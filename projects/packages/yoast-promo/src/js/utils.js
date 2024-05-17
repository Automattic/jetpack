export const createStore = key => ( {
	get: () => window.localStorage.getItem( key ),
	set: value => window.localStorage.setItem( key, value ),
} );
