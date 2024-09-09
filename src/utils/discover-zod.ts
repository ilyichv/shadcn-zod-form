import path from "node:path";
import { type Expression, type Node, Project, SyntaxKind } from "ts-morph";
import type { Config } from "./get-config";
import { logger } from "./logger";

export type ParsedSchema = Record<string, ParsedSchemaValue>;

export type ParsedSchemaValue = {
	type: string;
	children?: Record<string, ParsedSchemaValue>;
	options?: string[];
};

interface SchemaInfo {
	importStr: string;
	schema: Record<string, ParsedSchemaValue>;
}

const UNSUPPORTED_TYPES = ["z.array", "z.record"];

export function discoverZodSchemas(
	config: Config,
	filePath: string,
): Record<string, SchemaInfo> {
	const project = new Project({
		tsConfigFilePath: path.resolve(process.cwd(), "tsconfig.json"),
	});
	const sourceFile = project.addSourceFileAtPath(filePath);

	const schemas: Record<string, SchemaInfo> = {};

	const variableDeclarations = sourceFile.getDescendantsOfKind(
		SyntaxKind.VariableDeclaration,
	);

	for (const declaration of variableDeclarations) {
		const initializer = declaration.getInitializer();

		if (initializer && isZodObjectSchema(initializer)) {
			const schemaName = declaration.getName();

			// todo: apply current ts config paths if needed
			let relativePath = path.relative(config.resolvedPaths.forms, filePath);
			relativePath = relativePath.replace(/\.(ts|tsx|js|jsx)$/, "");
			relativePath = relativePath.replace(/\\/g, "/");
			if (!path.isAbsolute(relativePath) && !relativePath.startsWith(".")) {
				relativePath = `./${relativePath}`;
			}

			const isDefaultExport =
				sourceFile
					.getExportedDeclarations()
					.get("default")
					?.some((d) => d === declaration) || false;

			schemas[schemaName] = {
				schema: extractObjectSchema(initializer),
				importStr: isDefaultExport
					? `import ${schemaName} from "${relativePath}";`
					: `import { ${schemaName} } from "${relativePath}";`,
			};
		}
	}

	return schemas;
}

function isZodObjectSchema(node: Node): boolean {
	if (node.getKind() === SyntaxKind.CallExpression) {
		const callExpression = node.asKind(SyntaxKind.CallExpression);
		const expression = callExpression?.getExpression();

		if (expression?.getKind() === SyntaxKind.PropertyAccessExpression) {
			const propertyAccess = expression.asKind(
				SyntaxKind.PropertyAccessExpression,
			);
			const objectName = propertyAccess?.getExpression().getText();
			const propertyName = propertyAccess?.getName();

			return objectName === "z" && propertyName === "object";
		}
	}

	return false;
}

function extractObjectSchema(node: Node): ParsedSchema {
	const schemaObject: ParsedSchema = {};

	const objectLiteral = node.getDescendantsOfKind(
		SyntaxKind.ObjectLiteralExpression,
	)[0];

	for (const property of objectLiteral.getChildrenOfKind(
		SyntaxKind.PropertyAssignment,
	)) {
		const propertyName = property.getName();
		const propertyValue = property.getInitializer();

		if (propertyValue) {
			schemaObject[propertyName] = extractZodType(propertyValue);
		}
	}

	return schemaObject;
}

function extractZodType(node: Expression): ParsedSchemaValue {
	const text = node.getText();

	const unsupported = UNSUPPORTED_TYPES.find((type) => text.startsWith(type));
	if (unsupported) {
		logger.warn(`${unsupported} type is not currently supported.`);
		return { type: "unsupported" };
	}

	if (text.startsWith("z.object("))
		return { type: "object", children: extractObjectSchema(node) };

	if (text.includes(".datetime(")) return { type: "datetime" };
	if (text.includes(".date(")) return { type: "date" };

	if (text.startsWith("z.enum(")) {
		const enumValues = node
			.getFirstChildByKind(SyntaxKind.ArrayLiteralExpression)
			?.getElements()
			.map((element) => element.getText().replace(/['"]/g, ""));
		return { type: "enum", options: enumValues || [] };
	}

	const type = text.split(".")[1]?.split("(")[0];

	return { type: type ?? "unknown" };
}
