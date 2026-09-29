/**
 * Map package source paths to the live/publish `dist/` consumer face (ADR-0027).
 * Keep package.json exports as compact strings; assert they match this helper.
 */

export function srcToDistPath(
	srcPath: string,
	sourceDir = "src",
): string {
	const prefix = `./${sourceDir.replace(/^\.\//, "").replace(/\/$/, "")}/`;
	if (!srcPath.startsWith(prefix)) {
		throw new Error(`expected ${prefix}*, got ${srcPath}`);
	}
	const rest = srcPath.slice(prefix.length);
	if (rest.endsWith(".ts")) {
		return `./dist/${rest.slice(0, -".ts".length)}.js`;
	}
	if (rest.endsWith(".astro") || rest.endsWith(".svelte")) {
		return `./dist/${rest}`;
	}
	throw new Error(`unsupported source extension: ${srcPath}`);
}

/** Compact export map: subpath → `./dist/...` string target. */
export function distExportsFromSrcMap(
	srcMap: Readonly<Record<string, string>>,
	sourceDir = "src",
): Record<string, string> {
	return Object.fromEntries(
		Object.entries(srcMap).map(([key, src]) => [
			key,
			srcToDistPath(src, sourceDir),
		]),
	);
}

export function srcToDistBin(srcPath: string): string {
	if (srcPath.startsWith("./dist/") && srcPath.endsWith(".js")) return srcPath;
	if (srcPath.startsWith("./src/") && srcPath.endsWith(".ts")) {
		return `./dist/${srcPath.slice("./src/".length, -".ts".length)}.js`;
	}
	throw new Error(`bin must be ./src/*.ts or ./dist/*.js (got ${srcPath})`);
}

function exportTarget(value: unknown): string {
	if (typeof value === "string") return value;
	if (value && typeof value === "object" && !Array.isArray(value)) {
		const targets = [
			...new Set(
				Object.values(value).filter(
					(target): target is string => typeof target === "string",
				),
			),
		];
		if (targets.length === 1) {
			const only = targets[0];
			if (only !== undefined) return only;
		}
	}
	throw new Error(
		`export must be a string path or a condition map to one file (got ${JSON.stringify(value)})`,
	);
}

/** Fail if package.json exports/bin drift from the source entry map. */
export function assertPackageFace(options: {
	readonly label: string;
	readonly exports: unknown;
	readonly publicEntries: Readonly<Record<string, string>>;
	readonly bin?: unknown;
	readonly binSrc?: Readonly<Record<string, string>> | string;
	readonly sourceDir?: string;
}): void {
	const expected = distExportsFromSrcMap(
		options.publicEntries,
		options.sourceDir ?? "src",
	);
	if (
		!options.exports ||
		typeof options.exports !== "object" ||
		Array.isArray(options.exports)
	) {
		throw new Error(`${options.label}: exports must be a map`);
	}
	const actualKeys = Object.keys(options.exports).sort();
	const expectedKeys = Object.keys(expected).sort();
	if (actualKeys.join("\0") !== expectedKeys.join("\0")) {
		throw new Error(
			`${options.label}: export keys ${JSON.stringify(actualKeys)} !== ${JSON.stringify(expectedKeys)}`,
		);
	}
	for (const [key, expectedTarget] of Object.entries(expected)) {
		let actual: string;
		try {
			actual = exportTarget(
				(options.exports as Record<string, unknown>)[key],
			);
		} catch (error) {
			throw new Error(
				`${options.label} export "${key}": ${error instanceof Error ? error.message : error}`,
			);
		}
		if (actual !== expectedTarget) {
			throw new Error(
				`${options.label} export "${key}": expected ${expectedTarget}, got ${actual}`,
			);
		}
	}

	if (options.binSrc === undefined) return;
	const expectedBin =
		typeof options.binSrc === "string"
			? srcToDistBin(options.binSrc)
			: Object.fromEntries(
					Object.entries(options.binSrc).map(([name, src]) => [
						name,
						srcToDistBin(src),
					]),
				);
	const actualBin = options.bin;
	if (typeof expectedBin === "string") {
		if (actualBin !== expectedBin) {
			throw new Error(
				`${options.label} bin: expected ${expectedBin}, got ${JSON.stringify(actualBin)}`,
			);
		}
		return;
	}
	if (!actualBin || typeof actualBin !== "object" || Array.isArray(actualBin)) {
		throw new Error(`${options.label}: bin must be a map`);
	}
	for (const [name, expectedTarget] of Object.entries(expectedBin)) {
		const actual = (actualBin as Record<string, string>)[name];
		if (actual !== expectedTarget) {
			throw new Error(
				`${options.label} bin "${name}": expected ${expectedTarget}, got ${actual}`,
			);
		}
	}
}
