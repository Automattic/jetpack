// Strict, so Stub has no own `arguments` or `caller`; older V8 makes those read-only and the proxy throws on them.
// eslint-disable-next-line strict
'use strict';

/**
 * Stands in for every export of the modules webpack.config.js stubs: a component that renders nothing.
 *
 * @return {null} Nothing.
 */
function Stub() {
	return null;
}

module.exports = new Proxy( Stub, {
	get: ( target, key ) => ( key === 'then' || typeof key === 'symbol' ? undefined : Stub ),
} );
