// Babel doesn't polyfill node_modules, so methods the bundled @wordpress packages call go here.

// Chrome 110, Safari 16, Firefox 115.
if ( ! Array.prototype.toSorted ) {
	Object.defineProperty( Array.prototype, 'toSorted', {
		value( this: unknown[], compare?: ( a: unknown, b: unknown ) => number ) {
			return this.slice().sort( compare );
		},
		configurable: true,
		writable: true,
	} );
}

export {};
