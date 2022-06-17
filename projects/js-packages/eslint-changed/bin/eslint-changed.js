#!/usr/bin/env node

import { createProgram } from '../src/cli.js';

try {
	await createProgram().parseAsync();
} catch ( e ) {
	console.error( e ); // eslint-disable-line no-console
	process.exitCode = 1;
}
