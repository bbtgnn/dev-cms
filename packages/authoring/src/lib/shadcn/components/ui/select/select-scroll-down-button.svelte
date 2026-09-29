<script lang="ts">
	import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
	import { HugeiconsIcon } from "@hugeicons/svelte"
	import { Select as SelectPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "$lib/shadcn/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<SelectPrimitive.ScrollDownButtonProps> = $props();
</script>

<SelectPrimitive.ScrollDownButton
	bind:ref
	data-slot="select-scroll-down-button"
	class={cn("bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4", className)}
	{...restProps}
>
	<HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2}  />
</SelectPrimitive.ScrollDownButton>
