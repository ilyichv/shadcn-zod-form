import camelCase from "lodash.camelcase";
import startCase from "lodash.startcase";
import template from "lodash.template";
import { z } from "zod";
import { getDefaultValues } from "./default-values";
import { logger } from "./logger";
import type { PackageConfig } from "./packages";

type FormFieldsResult = {
	imports: string;
	components: string;
	functions: string;
};

export function getFormFields(
	schema: z.ZodTypeAny,
	packageConfig: PackageConfig,
): FormFieldsResult {
	const components: string[] = [];
	const functions: string[] = [];
	const imports: Set<string> = new Set();

	processSchema(packageConfig, schema, "", components, imports, functions);

	return {
		imports: Array.from(imports)
			.filter((importStatement) => importStatement)
			.join("\n"),
		components: components.join(""),
		functions: functions.join(""),
	};
}

function processSchema(
	packageConfig: PackageConfig,
	schema: z.ZodTypeAny,
	prefix = "",
	components: string[] = [],
	imports: Set<string> = new Set(),
	functions: string[] = [],
): FormFieldsResult {
	if (schema instanceof z.ZodNullable || schema instanceof z.ZodOptional) {
		return processSchema(
			packageConfig,
			schema.unwrap(),
			prefix,
			components,
			imports,
			functions,
		);
	}

	if (schema instanceof z.ZodObject) {
		return processObjectSchema(
			packageConfig,
			schema,
			prefix,
			components,
			imports,
			functions,
		);
	}

	if (schema instanceof z.ZodArray) {
		return processArraySchema(
			packageConfig,
			schema,
			prefix,
			components,
			imports,
			functions,
		);
	}

	// Process primitive types
	const { component, import: importStatement } = getInputComponent(
		packageConfig,
		schema,
		prefix,
	);
	components.push(component);
	imports.add(importStatement);

	return {
		imports: Array.from(imports).join(""),
		components: components.join(""),
		functions: functions.join(""),
	};
}

function processObjectSchema(
	packageConfig: PackageConfig,
	schema: z.ZodObject<z.ZodRawShape>,
	prefix: string,
	components: string[],
	imports: Set<string>,
	functions: string[],
): FormFieldsResult {
	for (const [key, value] of Object.entries(schema.shape)) {
		const newKey = prefix ? `${prefix}.${key}` : key;
		processSchema(
			packageConfig,
			value as z.ZodTypeAny,
			newKey,
			components,
			imports,
			functions,
		);
	}

	return {
		imports: Array.from(imports).join(""),
		components: components.join(""),
		functions: functions.join(""),
	};
}

function processArraySchema(
	packageConfig: PackageConfig,
	schema: z.ZodArray<z.ZodTypeAny>,
	prefix: string,
	components: string[],
	imports: Set<string>,
	functions: string[],
): FormFieldsResult {
	if (schema.element instanceof z.ZodObject) {
		const { components: children } = processSchema(
			packageConfig,
			schema.element,
			packageConfig.prefix(prefix),
		);

		const defaultValues = getDefaultValues(schema.element);
		const arrayFieldComponent = template(
			packageConfig.templates.arrayField.component,
		)({
			children,
			name: prefix,
			defaultValues: JSON.stringify(defaultValues),
		});

		const arrayFieldFunctions = template(
			packageConfig.templates.arrayField.functions,
		)({
			name: prefix,
		});

		components.push(arrayFieldComponent);
		imports.add(packageConfig.templates.arrayField.import);
		functions.push(arrayFieldFunctions);
	} else {
		logger.warn(`Only objects are supported in arrays, skipping ${prefix}`);
	}

	return {
		imports: Array.from(imports).join(""),
		components: components.join(""),
		functions: functions.join(""),
	};
}

function getInputComponent(
	packageConfig: PackageConfig,
	field: z.ZodTypeAny,
	prefix: string,
): {
	component: string;
	import: string;
} {
	const input = packageConfig.templates.inputs[field.constructor.name];
	const inputProps = {
		children: "",
	};

	if (!input) {
		logger.warn(`Unsupported field type: ${field.constructor.name}`);
		return {
			component: "",
			import: "",
		};
	}

	if (field instanceof z.ZodEnum) {
		inputProps.children = field.options
			.map((option: string) =>
				template(packageConfig.templates.optionItem)({ option }),
			)
			.join("\n");
	}

	const name = prefix.includes("${") ? `{\`${prefix}\`}` : `"${prefix}"`;

	return {
		...input,
		component: template(packageConfig.templates.field)({
			name,
			label: getFieldLabel(prefix),
			input: template(input.component)(inputProps),
		}),
	};
}

function getFieldLabel(key: string): string {
	const parts = key.includes(".") ? key.split(".") : [key];
	return parts.map((part) => startCase(camelCase(part))).join(" ");
}
