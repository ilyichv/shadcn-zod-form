import { describe, expect, it } from "vitest";
import { z } from "zod";
import { generateFormCode, sampleSchemas } from "../utils/test-utils";

const packages = ["react-hook-form", "@tanstack/react-form"] as const;

const testCases = [
	// Sample schemas
	{
		name: "simple schema",
		schema: sampleSchemas.simple,
		formName: "simple-form",
		schemaName: "SimpleSchema",
	},
	{
		name: "schema with enum",
		schema: sampleSchemas.withEnum,
		formName: "enum-form",
		schemaName: "EnumSchema",
	},
	{
		name: "schema with array",
		schema: sampleSchemas.withArray,
		formName: "array-form",
		schemaName: "ArraySchema",
	},
	{
		name: "nested schema",
		schema: sampleSchemas.withNested,
		formName: "nested-form",
		schemaName: "NestedSchema",
	},
	{
		name: "complex schema",
		schema: sampleSchemas.complex,
		formName: "complex-form",
		schemaName: "ComplexSchema",
	},
	// Field types
	{
		name: "string field",
		schema: z.object({ name: z.string() }),
		formName: "string-field",
		schemaName: "StringSchema",
	},
	{
		name: "number field",
		schema: z.object({ age: z.number() }),
		formName: "number-field",
		schemaName: "NumberSchema",
	},
	{
		name: "boolean field",
		schema: z.object({ isActive: z.boolean() }),
		formName: "boolean-field",
		schemaName: "BooleanSchema",
	},
	{
		name: "enum field",
		schema: z.object({ status: z.enum(["active", "inactive"]) }),
		formName: "enum-field",
		schemaName: "EnumSchema",
	},
	{
		name: "array field",
		schema: z.object({
			items: z.array(
				z.object({
					name: z.string(),
					value: z.number(),
				}),
			),
		}),
		formName: "array-field",
		schemaName: "ArraySchema",
	},
];

describe("Comprehensive Code Generation Tests", () => {
	for (const packageName of packages) {
		describe(packageName, () => {
			for (const { name, schema, formName, schemaName } of testCases) {
				it(`should generate form for ${name}`, async () => {
					const code = await generateFormCode(
						schema,
						packageName,
						formName,
						schemaName,
						`import { ${schemaName} } from "./schemas";`,
					);

					expect(code).toMatchSnapshot();
				});
			}
		});
	}
});
