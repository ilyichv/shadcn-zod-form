// originally from https://github.com/shadcn-ui/ui/blob/main/packages/cli/src/utils/get-package-info.ts

import path from "node:path";
import fs from "fs-extra";
import type { PackageJson } from "type-fest";

export function getPackageInfo() {
	const packageJsonPath = path.join("package.json");

	return fs.readJSONSync(packageJsonPath) as PackageJson;
}
