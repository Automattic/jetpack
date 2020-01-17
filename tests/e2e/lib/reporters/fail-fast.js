/**
 * External dependencies
 */
import { wrap } from 'lodash';

let refs;

// Jasmine doesn't yet have an option to fail fast. This "reporter" is a workaround for the time
// being, making Jasmine essentially skip all tests after the first failure.
// https://github.com/jasmine/jasmine/issues/414
// https://github.com/juliemr/minijasminenode/issues/20
export function init() {
	refs = getSpecReferences();

	return {
		specDone( result ) {
			// console.log( result );
			console.log( result.fullName );
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
export function getSpecReferences() {
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
	if ( ! specs || suites ) {
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

async function saveNetworkRequests( results ) {
	let paused = false;
	const pausedRequests = [];

	const nextRequest = () => {
		// continue the next request or "unpause"
		if ( pausedRequests.length === 0 ) {
			paused = false;
		} else {
			// continue first request in "queue"
			pausedRequests.shift()(); // calls the request.continue function
		}
	};

	await page.setRequestInterception( true );
	page.on( 'request', request => {
		if ( paused ) {
			pausedRequests.push( () => request.continue() );
		} else {
			paused = true; // pause, as we are processing a request now
			request.continue();
		}
	} );

	page.on( 'requestfinished', async request => {
		const response = await request.response();

		const responseHeaders = response.headers();
		let responseBody;
		if ( request.redirectChain().length === 0 ) {
			// body can only be access for non-redirect responses
			responseBody = await response.buffer();
			if ( responseBody.type && responseBody.type === 'Buffer' ) {
				responseBody = Buffer.from( responseBody.data ).toString();
			}
		}

		const information = {
			url: request.url(),
			requestHeaders: request.headers(),
			requestPostData: request.postData(),
			responseHeaders,
			responseSize: responseHeaders[ 'content-length' ],
			responseBody,
		};
		results.push( information );

		nextRequest(); // continue with next request
	} );

	page.on( 'requestfailed', () => {
		// handle failed request
		nextRequest();
	} );
}
