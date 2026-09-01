/**
 * Use `@jest/environment-jsdom-abstract` to use latest jsdom.
 */

import BaseEnv from '@jest/environment-jsdom-abstract';
import * as JSDOM from 'jsdom';

export default class FixJSDOMEnvironment extends BaseEnv {
	constructor( config, context ) {
		super( config, context, JSDOM );

		// FIXME https://github.com/jsdom/jsdom/issues/3363
		this.global.structuredClone = structuredClone;
	}
}
