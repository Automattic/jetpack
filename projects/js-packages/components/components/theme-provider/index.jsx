/**
 * External dependencies
 */
import { useEffect } from 'react';

const vars = {
	'--specific-var-for-test': '#ACACAC',
};

const setup = () => {
	const root = document.documentElement;
	for ( const key in vars ) {
		root.style.setProperty( key, vars[ key ] );
	}
};

const ThemeProvider = ( { children = null } ) => {
	useEffect( () => {
		setup();
	}, [] );

	return children;
};

export default ThemeProvider;
