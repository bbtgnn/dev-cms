<script lang="ts">
	import { SearchIcon } from '@hugeicons/core-free-icons';
	import { HugeiconsIcon } from "@hugeicons/svelte"
	import { Command as CommandPrimitive } from "bits-ui";
	import * as InputGroup from "$lib/shadcn/components/ui/input-group/index.js";
	import { cn } from "$lib/shadcn/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		value = $bindable(""),
		...restProps
	}: CommandPrimitive.InputProps = $props();
</script>

<div data-slot="command-input-wrapper" class="p-1 pb-0">
	<InputGroup.Root class="bg-input/50 h-9">
		<CommandPrimitive.Input
			{value}
			data-slot="command-input"
			class={cn(
				"w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
				className
			)}
			{...restProps}
		>
			{#snippet child({ props })}
				<InputGroup.Input {...props} bind:value bind:ref />
			{/snippet}
		</CommandPrimitive.Input>
		<InputGroup.Addon>
			<HugeiconsIcon icon={SearchIcon} strokeWidth={2} class="size-4 shrink-0 opacity-50" />
		</InputGroup.Addon>
	</InputGroup.Root>
</div>
