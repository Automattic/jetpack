import { __ } from '@wordpress/i18n';

type Resolve< ReturnType = void > = ( value: ReturnType | PromiseLike< ReturnType > ) => void;

type PollPromiseArgs< ReturnType = void > = {
	interval: number;
	timeout: number;
	timeoutError?: string;
	callback: ( resolve: Resolve< ReturnType > ) => Promise< void > | void;
};

/**
 * Repeatedly poll callback every <interval> milliseconds until it calls the
 * resolve() callback. If the callback throws an error, the whole polling
 * promise will reject.
 *
 * Rejects with a timeout after <timeout> milliseconds.
 *
 * @template ReturnType
 * @param {Object}   obj
 * @param {number}   obj.interval     - Milliseconds between calling callback
 * @param {number}   obj.timeout      - Milliseconds before rejecting w/ a timeout
 * @param {Function} obj.callback     - Callback to call every <interval> ms.
 * @param {string}   obj.timeoutError - Message to throw on timeout.
 * @return {Promise< ReturnType >} - A promise which resolves to the value resolved() inside callback.
 */
export default async function pollPromise< ReturnType = void >( {
	interval,
	callback,
	timeout,
	timeoutError,
}: PollPromiseArgs< ReturnType > ): Promise< ReturnType > {
	let timeoutHandle: number, intervalHandle: number;

	return new Promise< ReturnType >( ( resolve, reject ) => {
		timeoutHandle = setTimeout( () => {
			reject( new Error( timeoutError || __( 'Timed out', 'jetpack-boost' ) ) );
		}, timeout || 2 * 60 * 1000 );

		intervalHandle = setInterval( async () => {
			try {
				await Promise.resolve( callback( resolve ) );
			} catch ( err ) {
				reject( err );
			}
		}, interval );
	} ).finally( () => {
		clearTimeout( timeoutHandle );
		clearInterval( intervalHandle );
	} );
}
