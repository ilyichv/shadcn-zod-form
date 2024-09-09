// originally from https://github.com/shadcn-ui/ui/blob/cd9a55b76a66cccb222daf964a75fe018eeca434/packages/cli/src/utils/logger.ts

import chalk from "chalk";

export const logger = {
	error(...args: unknown[]) {
		console.log(chalk.red(...args));
	},
	warn(...args: unknown[]) {
		console.log(chalk.yellow(...args));
	},
	info(...args: unknown[]) {
		console.log(chalk.cyan(...args));
	},
	success(...args: unknown[]) {
		console.log(chalk.green(...args));
	},
	break() {
		console.log("");
	},
};
