// originally from https://github.com/shadcn-ui/ui/blob/main/packages/cli/src/utils/resolve-import.ts

import {
	type ConfigLoaderSuccessResult,
	createMatchPath,
} from "tsconfig-paths";

export async function resolveImport(
	importPath: string,
	config: Pick<ConfigLoaderSuccessResult, "absoluteBaseUrl" | "paths">,
) {
	return createMatchPath(config.absoluteBaseUrl, config.paths)(
		importPath,
		undefined,
		() => true,
		[".ts", ".tsx"],
	);
}
