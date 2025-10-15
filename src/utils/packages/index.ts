import { z } from "zod";
import { hookFormConfig } from "./react-hook-form";
import { tanstackConfig } from "./tanstack";

const templateSchema = z.object({
	import: z.string(),
	component: z.string(),
	functions: z.string().optional(),
	defaultValue: z.any().optional(),
});

// todo: standardise form and field to use templateSchema
export const packageConfigSchema = z.object({
	prefix: z.function().args(z.string()).returns(z.string()),
	templates: z.object({
		form: z.string(),
		field: z.string(),
		arrayField: templateSchema,
		inputs: z.record(z.string(), templateSchema),
		optionItem: z.string(),
	}),
});

export type Template = z.infer<typeof templateSchema>;
export type PackageConfig = z.infer<typeof packageConfigSchema>;

export const packageConfigs = {
	"react-hook-form": hookFormConfig,
	"@tanstack/react-form": tanstackConfig,
};
