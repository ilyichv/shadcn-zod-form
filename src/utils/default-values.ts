import { z } from "zod";

const PRIMITIVE_DEFAULTS: Record<string, unknown> = {
	[z.ZodString.name]: "",
	[z.ZodNumber.name]: 0,
	[z.ZodBoolean.name]: false,
	[z.ZodEnum.name]: "",
	[z.ZodDate.name]: new Date(),
};

function getDefaultValue(schema: z.ZodTypeAny): unknown {
	const typeName = schema.constructor.name;

	if (typeName === z.ZodArray.name) {
		const elementSchema = (schema as z.ZodArray<z.ZodTypeAny>).element;
		return [getDefaultValue(elementSchema)];
	}

	if (typeName === z.ZodObject.name) {
		return getDefaultValues(schema as z.ZodObject<z.ZodRawShape>);
	}

	return PRIMITIVE_DEFAULTS[typeName];
}

export function getDefaultValues(
	schema: z.ZodTypeAny,
	defaultValues: Record<string, unknown> = {},
): Record<string, unknown> {
	if (!(schema instanceof z.ZodObject)) {
		return {};
	}

	for (const [key, fieldSchema] of Object.entries(
		schema.shape as z.ZodRawShape,
	)) {
		const defaultValue = getDefaultValue(fieldSchema);
		if (typeof defaultValue !== "undefined") {
			defaultValues[key] = defaultValue;
		}
	}

	return defaultValues;
}
