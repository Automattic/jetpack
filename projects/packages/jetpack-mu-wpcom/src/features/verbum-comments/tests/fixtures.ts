import { test as base } from '@playwright/test';
import surfaces, { type Surface } from './sites';
import { VerbumForm } from './verbum';

/**
 * `surface` is supplied per Playwright project (see playwright.config.ts), so every spec
 * under tests/specs runs once per configured platform.
 */
export const test = base.extend< { surface: Surface; verbum: VerbumForm } >( {
	surface: [ surfaces[ 0 ], { option: true } ],
	verbum: async ( { page, surface }, use ) => {
		await use( new VerbumForm( page, surface ) );
	},
} );

export { expect } from '@playwright/test';
