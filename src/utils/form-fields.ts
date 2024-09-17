import camelCase from "lodash.camelcase";
import startCase from "lodash.startcase";
import template from "lodash.template";
import { z } from "zod";
import { logger } from "./logger";
import { arrayFieldTemplate } from "./templates/array-field";
import { formFieldTemplate } from "./templates/form-field";
import { inputs, optionItem } from "./templates/inputs";

type FormFieldsResult = {
	imports: string;
	components: string;
	functions: string;
};

export function getFormFields(schema: z.ZodTypeAny): FormFieldsResult {
	const components: string[] = [];
	const functions: string[] = [];
	const imports: Set<string> = new Set();

	processSchema(schema, "", components, imports, functions);

	return {
		imports: Array.from(imports)
			.filter((importStatement) => importStatement)
			.join("\n"),
		components: components.join(""),
		functions: functions.join(""),
	};
}

function processSchema(
	schema: z.ZodTypeAny,
	prefix = "",
	components: string[] = [],
	imports: Set<string> = new Set(),
	functions: string[] = [],
): FormFieldsResult {
	if (schema instanceof z.ZodNullable || schema instanceof z.ZodOptional) {
		return processSchema(
			schema.unwrap(),
			prefix,
			components,
			imports,
			functions,
		);
	}

	if (schema instanceof z.ZodObject) {
		return processObjectSchema(schema, prefix, components, imports, functions);
	}

	if (schema instanceof z.ZodArray) {
		return processArraySchema(schema, prefix, components, imports, functions);
	}

	// Process primitive types
	const { component, import: importStatement } = getInputComponent(
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
	schema: z.ZodObject<z.ZodRawShape>,
	prefix: string,
	components: string[],
	imports: Set<string>,
	functions: string[],
): FormFieldsResult {
	for (const [key, value] of Object.entries(schema.shape)) {
		const newKey = prefix ? `${prefix}.${key}` : key;
		processSchema(
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
	schema: z.ZodArray<z.ZodTypeAny>,
	prefix: string,
	components: string[],
	imports: Set<string>,
	functions: string[],
): FormFieldsResult {
	if (schema.element instanceof z.ZodObject) {
		const { components: children } = processSchema(
			schema.element,
			`${prefix}.\${index}`,
		);

		const defaultValues = getObjectDefaultValue(schema.element);
		const arrayFieldComponent = template(arrayFieldTemplate.component)({
			children,
			defaultValues: JSON.stringify(defaultValues).replace(
				/"([^"]+)":/g,
				"$1:",
			),
		});

		const arrayFieldFunctions = template(arrayFieldTemplate.functions)({
			name: prefix,
		});

		components.push(arrayFieldComponent);
		imports.add(arrayFieldTemplate.import);
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
	field: z.ZodTypeAny,
	prefix: string,
): {
	component: string;
	import: string;
} {
	const input = inputs[field.constructor.name];
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
			.map((option: string) => template(optionItem)({ option }))
			.join("\n");
	}

	const name = prefix.includes("${") ? `{\`${prefix}\`}` : `"${prefix}"`;

	return {
		...input,
		component: template(formFieldTemplate)({
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

function getObjectDefaultValue(
	field: z.ZodObject<z.ZodRawShape>,
): Record<string, unknown> {
	// todo: make recursive ?
	const defaultValues: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(field.shape)) {
		const defaultValue = inputs[value.constructor.name]?.defaultValue;
		if (typeof defaultValue !== "undefined") {
			defaultValues[key] = defaultValue;
		}
	}

	return defaultValues;
}
