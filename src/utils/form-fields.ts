import camelCase from "lodash.camelcase";
import startCase from "lodash.startcase";
import template from "lodash.template";
import type { ParsedSchema, ParsedSchemaValue } from "./discover-zod";
import { formFieldTemplate } from "./templates/form-field";
import { inputs, optionItem } from "./templates/inputs";

export function getFormFields(schema: ParsedSchema): {
	imports: string;
	components: string;
} {
	const flattenedSchema = flattenSchema(schema);
	const components: string[] = [];
	const imports: Set<string> = new Set();

	for (const [key, value] of Object.entries(flattenedSchema)) {
		const { component, import: importStatement } = getInputComponent(value);
		const formField = template(formFieldTemplate)({
			name: key,
			label: getFieldLabel(key),
			component,
		});

		components.push(formField);
		imports.add(importStatement);
	}

	return {
		imports: Array.from(imports).join("\n"),
		components: components.join("\n"),
	};
}

function flattenSchema(
	schema: ParsedSchema | ParsedSchemaValue,
	prefix = "",
): ParsedSchema {
	const flattened: ParsedSchema = {};

	for (const [key, value] of Object.entries(schema)) {
		const newKey = prefix ? `${prefix}.${key}` : key;

		if (value.type === "object") {
			Object.assign(flattened, flattenSchema(value.children, newKey));
		} else {
			flattened[newKey] = value;
		}
	}

	return flattened;
}

function getFieldLabel(key: string): string {
	const parts = key.includes(".") ? key.split(".") : [key];

	return parts.map((part) => startCase(camelCase(part))).join(" ");
}

function getInputComponent(field: ParsedSchemaValue): {
	component: string;
	import: string;
} {
	const input = inputs[field.type];

	if (!input) {
		return {
			component: "",
			import: "",
		};
		// throw new Error(`No input component found for type: ${type}`);
	}

	return {
		...input,
		component: template(input.component)({
			options: field.options
				?.map((option) => template(optionItem)({ option }))
				.join(""),
		}),
	};
}
