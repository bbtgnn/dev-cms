import { extendByRecord } from "@sjsf/form/lib/resolver";
import "@sjsf/shadcn4-theme/extra-widgets/checkboxes-include";
import "@sjsf/shadcn4-theme/extra-widgets/combobox-include";
import "@sjsf/shadcn4-theme/extra-widgets/date-picker-include";
import "@sjsf/shadcn4-theme/extra-widgets/date-range-picker-include";
import "@sjsf/shadcn4-theme/extra-widgets/file-include";
import "@sjsf/shadcn4-theme/extra-widgets/multi-select-include";
import "@sjsf/shadcn4-theme/extra-widgets/radio-buttons-include";
import "@sjsf/shadcn4-theme/extra-widgets/radio-include";
import "@sjsf/shadcn4-theme/extra-widgets/range-include";
import "@sjsf/shadcn4-theme/extra-widgets/range-slider-include";
import "@sjsf/shadcn4-theme/extra-widgets/switch-include";
import "@sjsf/shadcn4-theme/extra-widgets/textarea-include";
import { setThemeContext, theme as shadcnTheme } from "@sjsf/shadcn4-theme";
import { Button } from "$lib/shadcn/components/ui/button";
import { ButtonGroup } from "$lib/shadcn/components/ui/button-group";
import { Calendar } from "$lib/shadcn/components/ui/calendar";
import { Checkbox } from "$lib/shadcn/components/ui/checkbox";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "$lib/shadcn/components/ui/command";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
	FieldTitle,
} from "$lib/shadcn/components/ui/field";
import { Input } from "$lib/shadcn/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "$lib/shadcn/components/ui/popover";
import {
	RadioGroup,
	RadioGroupItem,
} from "$lib/shadcn/components/ui/radio-group";
import { RangeCalendar } from "$lib/shadcn/components/ui/range-calendar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "$lib/shadcn/components/ui/select";
import { Slider } from "$lib/shadcn/components/ui/slider";
import { Switch } from "$lib/shadcn/components/ui/switch";
import { Textarea } from "$lib/shadcn/components/ui/textarea";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "$lib/shadcn/components/ui/toggle-group";
import ImageField from "./image-field.svelte";
import DiscriminatedUnionField from "./stock/discriminated-union-field.svelte";
import LiteralField from "./stock/literal-field.svelte";
import ReferenceField from "./stock/reference-field.svelte";
import { wrapFieldEditorForSjsf } from "./wrap-field-editor";

export function setCmsThemeContext(): void {
	setThemeContext({
		components: {
			ButtonGroup,
			Field,
			FieldLabel,
			FieldError,
			FieldDescription,
			FieldGroup,
			FieldLegend,
			FieldTitle,
			FieldSet,
			Button,
			Checkbox,
			Input,
			Select,
			SelectContent,
			SelectItem,
			SelectTrigger,
			Textarea,
			RadioGroup,
			RadioGroupItem,
			Command,
			CommandEmpty,
			CommandGroup,
			CommandInput,
			CommandItem,
			CommandList,
			Calendar,
			ToggleGroup,
			ToggleGroupItem,
			Slider,
			Switch,
			Popover,
			PopoverContent,
			PopoverTrigger,
			RangeCalendar,
		},
	});
}

export const theme = extendByRecord(shadcnTheme, {
	imageField: wrapFieldEditorForSjsf(ImageField),
	referenceField: wrapFieldEditorForSjsf(ReferenceField),
	literalField: wrapFieldEditorForSjsf(LiteralField),
	discriminatedUnionField: wrapFieldEditorForSjsf(DiscriminatedUnionField),
});
