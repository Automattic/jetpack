/**
 * External dependencies
 */
import debugFactory from 'debug';

const debug = debugFactory( 'jetpack:vp-block:dispatcher' );

export default function dispatchPlayerAction( ref, event, data = {} ) {
	debug( 'dispatching %o action [%o]', event, data );
	ref.contentWindow.postMessage(
		{
			event,
			...data,
		},
		'*'
	);
}
