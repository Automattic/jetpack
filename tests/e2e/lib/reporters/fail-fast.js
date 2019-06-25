/**
 * External dependencies
 */
import { wrap } from 'lodash';

let refs;

export const registerFailFastReporter = () => {
	jasmine.getEnv().addReporter( failFastReporter() );
};

// Jasmine doesn't yet have an option to fail fast. This "reporter" is a workaround for the time
// being, making Jasmine essentially skip all tests after the first failure.
// https://github.com/jasmine/jasmine/issues/414
// https://github.com/juliemr/minijasminenode/issues/20
function failFastReporter() {
	refs = getSpecReferences();

	return {
		specDone( result ) {
			// console.log( result );
			if ( result.status === 'failed' ) {
				const describeName = result.fullName.replace( result.description, '' );
				const localRefs = { suites: refs.suites, specs: refs.specs[ describeName ] };

				disableSpecs( localRefs );
			}
		},
	};
}

/**
 * Gather references to all jasmine specs and suites, through any (currently hacky) means possible.
 *
 * @return {Object} An object with `specs` and `suites` properties, arrays of respective types.
 */
function getSpecReferences() {
	const specs = [];
	const suites = [];

	// Use specFilter to gather references to all specs.
	jasmine.getEnv().specFilter = spec => {
		const result = spec.result;
		const describeName = result.fullName.replace( result.description, '' );
		if ( ! specs[ describeName ] ) {
			specs[ describeName ] = [];
		}
		specs[ describeName ].push( spec );
		return true;
	};

	// Wrap jasmine's describe function to gather references to all suites.
	jasmine.getEnv().describe = wrap( jasmine.getEnv().describe, ( describe, ...args ) => {
		const suite = describe.apply( null, args );
		suites.push( suite );
		return suite;
	} );

	return {
		specs,
		suites,
	};
}

/**
 * Hacky workaround to facilitate "fail fast". Disable all specs (basically `xit`), then
 * remove references to all before/after functions, else they'll still run. Disabling the
 * suites themselves does not appear to have an effect.
 */
export function disableSpecs( { specs, suites } ) {
	if ( ! specs || ! suites ) {
		throw new Error( 'jasmine-fail-fast: Must call init() before calling disableSpecs()!' );
	}

	specs.forEach( spec => spec.disable() );

	suites.forEach( suite => {
		suite.beforeFns = [];
		suite.afterFns = [];
		suite.beforeAllFns = [];
		suite.afterAllFns = [];
	} );
}
