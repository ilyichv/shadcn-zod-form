import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		snapshotFormat: {
			escapeString: true,
			printBasicPrototype: false,
		},
	},
});
