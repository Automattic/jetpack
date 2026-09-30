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
