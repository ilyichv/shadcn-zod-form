import { promises as fs } from "node:fs";
import path from "node:path";
import { Command } from "commander";
import ora from "ora";
import { getRawConfig } from "../utils/get-config";
import { handleError } from "../utils/handle-error";
import { logger } from "../utils/logger";

const DEFAULT_FORM_ALIAS = "@/components/form";

export const initCommand = new Command()
	.name("init")
	.description("Initialize shadcn-zod-form and install form components")
	.action(async () => {
		try {
			const cwd = process.cwd();
			const rawConfig = await getRawConfig(cwd);

			const spinner = ora(
				"Updating components.json with form alias...",
			).start();

			const targetPath = path.resolve(cwd, "components.json");

			const config = {
				...rawConfig,
				aliases: {
					...rawConfig.aliases,
					form: DEFAULT_FORM_ALIAS,
				},
			};

			await fs.writeFile(targetPath, JSON.stringify(config, null, 2), "utf8");

			// todo: install needed shadcn-ui library and components?

			spinner.succeed();
			logger.success("shadcn-zod-form initialized successfully");
		} catch (error) {
			handleError(error);
		}
	});
