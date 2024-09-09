// adapted from https://github.com/shadcn-ui/ui/blob/main/packages/cli/src/utils/transformers/index.ts

import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { Project, ScriptKind, type SourceFile } from "ts-morph";
import type { Config } from "../get-config";
import { transformImport } from "./transform-import";

export type TransformOpts = {
	filename: string;
	raw: string;
	config: Config;
};

export type Transformer<Output = SourceFile> = (
	opts: TransformOpts & {
		sourceFile: SourceFile;
	},
) => Promise<Output>;

const transformers: Transformer[] = [transformImport];

const project = new Project({
	compilerOptions: {},
});

async function createTempSourceFile(filename: string) {
	const dir = await fs.mkdtemp(path.join(tmpdir(), "shadcn-zod-form-"));
	return path.join(dir, filename);
}

export async function transform(opts: TransformOpts) {
	const tempFile = await createTempSourceFile(opts.filename);
	const sourceFile = project.createSourceFile(tempFile, opts.raw, {
		scriptKind: ScriptKind.TSX,
	});

	for (const transformer of transformers) {
		transformer({ sourceFile, ...opts });
	}

	sourceFile.formatText();

	return sourceFile.getFullText();
}
