let initialized = false;

// Keep the history wrappers installed for the page lifetime.
export function initLocationChange(): void {
	if ( initialized ) {
		return;
	}
	initialized = true;

	for ( const method of [ 'pushState', 'replaceState' ] as const ) {
		const original = window.history[ method ];
		window.history[ method ] = function ( ...args: Parameters< History[ typeof method ] > ) {
			original.apply( this, args );
			window.dispatchEvent( new Event( 'jetpack-boost:location-change' ) );
		};
	}
}
