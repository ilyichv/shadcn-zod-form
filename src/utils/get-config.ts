// adapted from https://github.com/shadcn-ui/ui/blob/cd9a55b76a66cccb222daf964a75fe018eeca434/packages/cli/src/utils/get-config.ts

import { cosmiconfig } from "cosmiconfig";
import { loadConfig } from "tsconfig-paths";
import { z } from "zod";
import { resolveImport } from "./resolve-imports";

const explorer = cosmiconfig("components", {
	searchPlaces: ["components.json"],
});

const aliasesSchema = z.object({
	form: z.string().optional(),
	components: z.string(),
	ui: z.string().optional(),
});

export const shadcnConfigSchema = z.object({
	aliases: aliasesSchema,
});

export type ShadcnConfig = z.infer<typeof shadcnConfigSchema>;

export const initializedConfigSchema = shadcnConfigSchema.extend({
	aliases: aliasesSchema.extend({
		form: z.string(),
	}),
});

export type InitializedConfig = z.infer<typeof initializedConfigSchema>;

export const configSchema = shadcnConfigSchema.extend({
	resolvedPaths: z.object({
		forms: z.string(),
	}),
});

export type Config = z.infer<typeof configSchema>;

export async function getConfig(cwd: string) {
	const config = await getInitializedConfig(cwd);

	if (!config) {
		return null;
	}

	return await resolveConfigPaths(cwd, config);
}

export async function readTsConfig(cwd: string) {
	const tsConfig = await loadConfig(cwd);

	if (tsConfig.resultType === "failed") {
		throw new Error(
			`Failed to load tsconfig.json. ${tsConfig.message ?? ""}`.trim(),
		);
	}

	return tsConfig;
}

export async function resolveConfigPaths(
	cwd: string,
	config: InitializedConfig,
) {
	const tsConfig = await readTsConfig(cwd);

	return configSchema.parse({
		...config,
		resolvedPaths: {
			forms: await resolveImport(config.aliases.form, tsConfig),
		},
	});
}

export async function getRawConfig(cwd: string) {
	const configResult = await explorer.search(cwd);
	if (!configResult)
		throw new Error(`Invalid configuration found in ${cwd}/components.json.`);
	return configResult.config;
}

export async function getShadcnConfig(cwd: string) {
	const config = await getRawConfig(cwd);
	return shadcnConfigSchema.parse(config);
}

export async function getInitializedConfig(cwd: string) {
	const config = await getRawConfig(cwd);
	return config ? initializedConfigSchema.parse(config) : null;
}
