import type { Config } from "@/src/utils/get-config";
import camelCase from "lodash.camelcase";
import template from "lodash.template";
import { z } from "zod";
import { getDefaultValues } from "../../utils/default-values";
import { getFormFields } from "../../utils/form-fields";
import { packageConfigs } from "../../utils/packages";
import { transform } from "../../utils/transformers";

export const mockConfig: Config = {
	aliases: {
		ui: "@/registry/ui",
		components: "@/registry/components",
	},
	resolvedPaths: {
		forms: "/test/forms",
	},
};

export async function generateFormCode(
	schema: z.ZodTypeAny,
	packageName: "react-hook-form" | "@tanstack/react-form",
	formName: string,
	schemaName: string,
	schemaImport: string,
): Promise<string> {
	const packageConfig = packageConfigs[packageName];

	const { components, imports, functions } = getFormFields(
		schema,
		packageConfig,
	);
	const defaultValues = getDefaultValues(schema);

	const content = await transform({
		raw: template(packageConfig.templates.form)({
			defaultValues: JSON.stringify(defaultValues),
			schema: schemaName,
			formName:
				camelCase(formName).charAt(0).toUpperCase() +
				camelCase(formName).slice(1),
			functions,
			components,
			schemaImport,
			imports,
		}),
		filename: `${formName}.tsx`,
		config: mockConfig,
	});

	return content;
}

export const sampleSchemas = {
	simple: z.object({
		name: z.string().min(1, "Name is required"),
		email: z.string().email("Invalid email"),
		age: z.number().min(0, "Age must be positive"),
	}),

	withEnum: z.object({
		status: z.enum(["active", "inactive", "pending"]),
		priority: z.enum(["low", "medium", "high"]),
		description: z.string().optional(),
	}),

	withArray: z.object({
		title: z.string(),
		tags: z.array(z.string()),
		items: z.array(
			z.object({
				name: z.string(),
				value: z.number(),
			}),
		),
	}),

	withNested: z.object({
		user: z.object({
			name: z.string(),
			email: z.string().email(),
			profile: z.object({
				bio: z.string().optional(),
				avatar: z.string().url().optional(),
			}),
		}),
		settings: z.object({
			notifications: z.boolean(),
			theme: z.enum(["light", "dark"]),
		}),
	}),

	complex: z.object({
		title: z.string().min(1),
		description: z.string().optional(),
		category: z.enum(["tech", "business", "lifestyle"]),
		tags: z.array(z.string()),
		author: z.object({
			name: z.string(),
			email: z.string().email(),
			bio: z.string().optional(),
		}),
		metadata: z.array(
			z.object({
				key: z.string(),
				value: z.string(),
				type: z.enum(["string", "number", "boolean"]),
			}),
		),
		isPublished: z.boolean().default(false),
		publishedAt: z.date().optional(),
	}),
};
