// adapted from https://github.com/shadcn-ui/ui/blob/main/packages/cli/src/utils/transformers/transform-import.ts

import type { Transformer } from "@/src/utils/transformers";

export const transformImport: Transformer = async ({ sourceFile, config }) => {
	const importDeclarations = sourceFile.getImportDeclarations();

	for (const importDeclaration of importDeclarations) {
		const moduleSpecifier = importDeclaration.getModuleSpecifierValue();

		// Replace @/registry/ui with the components alias.
		if (moduleSpecifier.startsWith("@/registry/ui")) {
			if (config.aliases.ui) {
				importDeclaration.setModuleSpecifier(
					moduleSpecifier.replace(/^@\/registry\/ui/, config.aliases.ui),
				);
			} else {
				importDeclaration.setModuleSpecifier(
					moduleSpecifier.replace(
						/^@\/registry\/ui/,
						config.aliases.components,
					),
				);
			}
		}
	}

	return sourceFile;
};
