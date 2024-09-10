import path from "node:path";
import {
	type CallExpression,
	type Expression,
	type Node,
	Project,
	type PropertyAccessExpression,
	SyntaxKind,
} from "ts-morph";
import type { Config } from "./get-config";

export type ParsedSchema = Record<string, ParsedSchemaValue>;

export type ParsedSchemaValue = {
	type: string;
	children?: Record<string, ParsedSchemaValue>;
	options?: string[];
	chained?: ChainedMethods;
	member?: ParsedSchemaValue;
};

export type ChainedMethods = {
	datetime?: boolean;
	date?: boolean;
};

interface SchemaInfo {
	importStr: string;
	schema: Record<string, ParsedSchemaValue>;
}

const zodTypeMap: Record<
	string,
	(callExp: CallExpression) => ParsedSchemaValue
> = {
	object: (callExp) => ({
		type: "object",
		children: extractObjectSchema(callExp),
	}),
	enum: (callExp) => ({ type: "enum", options: extractEnumValues(callExp) }),
	string: () => ({ type: "string" }),
	number: () => ({ type: "number" }),
	boolean: () => ({ type: "boolean" }),
	date: () => ({ type: "date" }),
	array: (callExp) => ({
		type: "array",
		member: extractArrayMemberSchema(callExp),
	}),
};

export function parseZodSchemasFromFile(
	config: Config,
	filePath: string,
): Record<string, SchemaInfo> {
	const project = new Project();
	const sourceFile = project.addSourceFileAtPath(filePath);
	const schemas: Record<string, SchemaInfo> = {};

	for (const declaration of sourceFile.getVariableDeclarations()) {
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

function isZodObjectSchema(node: Expression | undefined): boolean {
	if (!node) return false;

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
			schemaObject[propertyName] = parseSchemaValue(propertyValue);
		}
	}

	return schemaObject;
}

function extractArrayMemberSchema(node: Node): ParsedSchemaValue {
	if (node.getKind() === SyntaxKind.CallExpression) {
		const callExp = node as CallExpression;
		const argument = callExp.getArguments()[0];

		if (argument.isKind(SyntaxKind.CallExpression)) {
			return parseSchemaValue(argument);
		}
	}

	return { type: "unsupported" };
}

function parseSchemaValue(
	node: Expression,
	result: ParsedSchemaValue = { type: "unsupported" },
): ParsedSchemaValue {
	if (node.getKind() === SyntaxKind.CallExpression) {
		const callExp = node as CallExpression;
		const expression = callExp.getExpression();

		if (expression.getKind() === SyntaxKind.PropertyAccessExpression) {
			const propAccess = expression as PropertyAccessExpression;
			const objectName = propAccess.getExpression().getText();
			const methodName = propAccess.getName();

			// chained methods
			if (objectName !== "z") {
				const chained = methodName ? { [methodName]: true } : {};
				return parseSchemaValue(propAccess.getExpression(), {
					...result,
					chained,
				});
			}

			const zodTypeParser = zodTypeMap[methodName];
			if (zodTypeParser) {
				return { ...result, ...zodTypeParser(callExp) };
			}
		}
	}

	return result;
}

function extractEnumValues(callExp: CallExpression): string[] {
	return (
		callExp
			.getArguments()[0]
			?.asKind(SyntaxKind.ArrayLiteralExpression)
			?.getElements()
			.map((element) => element.getText().replace(/['"]/g, "")) || []
	);
}
