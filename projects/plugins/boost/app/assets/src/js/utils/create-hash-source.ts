/**
 * External dependencies
 */
import { createHashHistory } from 'history';

function createHashSource() {
	const history = createHashHistory();
	let listeners = [];

	history.listen( location => {
		if ( history.action === 'POP' ) {
			listeners.forEach( listener => listener( location ) );
		}
	} );

	return {
		get location() {
			return history.location;
		},
		addEventListener( name, handler ) {
			if ( name !== 'popstate' ) return;
			listeners.push( handler );
		},
		removeEventListener( name, handler ) {
			if ( name !== 'popstate' ) return;
			listeners = listeners.filter( fn => fn !== handler );
		},
		history: {
			get state() {
				return history.location.state;
			},
			pushState( state, title, uri ) {
				history.push( uri, state );
			},
			replaceState( state, title, uri ) {
				history.replace( uri, state );
			},
			go( to ) {
				history.go( to );
			},
		},
	};
}

export default createHashSource;
