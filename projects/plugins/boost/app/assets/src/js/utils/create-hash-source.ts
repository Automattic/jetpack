import { createHashHistory } from 'history';

/**
 * An adapter for svelte-navigator to use hash history.
 *
 * The createHistory function on svelte-navigator expects an object of type HistorySource.
 * This function creates such an object using the history library.
 */
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
