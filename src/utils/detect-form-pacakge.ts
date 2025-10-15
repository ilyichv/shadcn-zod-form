import { getPackageInfo } from "./get-package-info";

export async function detectFormPackage() {
	const dependencies = await getPackageInfo()?.dependencies;
	if (!dependencies) return null;

	if ("@tanstack/react-form" in dependencies) return "@tanstack/react-form";

	return "react-hook-form";
}
