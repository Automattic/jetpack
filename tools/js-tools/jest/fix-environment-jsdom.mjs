/**
 * Fix-up for jest-environment-jsdom
 *
 * @see https://github.com/jsdom/jsdom/issues/3363#issuecomment-1467894943
 */

import { TestEnvironment as JSDOMEnvironment } from 'jest-environment-jsdom';

export default class FixJSDOMEnvironment extends JSDOMEnvironment {
	constructor( ...args ) {
		super( ...args );

		// FIXME https://github.com/jsdom/jsdom/issues/3363
		this.global.structuredClone = structuredClone;
	}
}
