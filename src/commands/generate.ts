import { promises as fs, existsSync } from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import camelCase from "lodash.camelcase";
import kebabCase from "lodash.kebabcase";
import template from "lodash.template";
import ora from "ora";
import prompts from "prompts";
import { z } from "zod";
import { getFormFields } from "../utils/form-fields";
import { getConfig } from "../utils/get-config";
import { handleError } from "../utils/handle-error";
import { logger } from "../utils/logger";
import { parseZodSchemasFromFile } from "../utils/parse-zod";
import { formTemplate } from "../utils/templates/form";
import { transform } from "../utils/transformers";

const generateOptionsSchema = z.object({
	schema: z.string().describe("the path to zod schemas folder"),
	name: z.string().optional().describe("the name of the form"),
	output: z.string().optional().describe("the output directory"),
});

export const generate = new Command()
	.name("generate")
	.description("Generate shadcn/ui form from zod schema")
	.argument("<schema>", "the path to zod schemas folder")
	.option("-n, --name <name>", "the name of the form")
	.option("-o, --output <output>", "the output directory")
	.action(async (schema, opts) => {
		try {
			const options = generateOptionsSchema.parse({ schema, ...opts });
			const cwd = process.cwd();
			const config = await getConfig(cwd);
			if (!config) {
				logger.warn(
					`Configuration is missing. Please run ${chalk.green(
						"npx shadcn-zod-form@latest init",
					)} to create a components.json file.`,
				);
				process.exit(1);
			}

			const zodSchemas = parseZodSchemasFromFile(config, options.schema);

			if (Object.keys(zodSchemas).length === 0) {
				logger.error("No Zod schemas found in the specified file.");
				process.exit(1);
			}

			let selectedSchema = Object.keys(zodSchemas)[0];

			if (Object.keys(zodSchemas).length > 1) {
				const response = await prompts({
					type: "select",
					name: "schema",
					message: "Select a schema to generate the form:",
					choices: Object.keys(zodSchemas).map((schema) => ({
						title: schema,
						value: schema,
					})),
				});

				if (!response.schema) {
					logger.error("No schema selected. Exiting.");
					process.exit(1);
				}

				selectedSchema = response.schema;
			}

			const name =
				options.name ||
				(
					await prompts({
						type: "text",
						name: "name",
						message: "Enter the name for the generated form:",
						initial: () =>
							`${kebabCase(selectedSchema).replace(/-schema$/i, "")}-form`,
						validate: (value) =>
							value.length > 0 || "Form name cannot be empty",
					})
				).name;

			const spinner = ora(
				`Generating form for schema: ${selectedSchema} at ${config.resolvedPaths.forms}/${name}.tsx\n`,
			).start();

			const targetDir = options.output || config.resolvedPaths.forms;

			if (!existsSync(targetDir)) {
				await fs.mkdir(targetDir, { recursive: true });
			}

			const existingComponent = existsSync(
				path.resolve(targetDir, `${name}.tsx`),
			);

			if (existingComponent) {
				spinner.stop();
				logger.warn(
					`File ${name}.tsx already exists. Please chose another name.`,
				);
				process.exit(1);
			}

			const { components, imports, functions } = getFormFields(
				zodSchemas[selectedSchema].schema,
			);

			const content = await transform({
				raw: template(formTemplate)({
					schema: selectedSchema,
					formName:
						camelCase(name).charAt(0).toUpperCase() + camelCase(name).slice(1),
					functions,
					components,
					schemaImport: zodSchemas[selectedSchema].import,
					imports,
				}),
				filename: `${name}.tsx`,
				config,
			});

			await fs.writeFile(path.resolve(targetDir, `${name}.tsx`), content);

			spinner.succeed(`Form for ${selectedSchema} generated successfully.`);
		} catch (error) {
			handleError(error);
		}
	});
