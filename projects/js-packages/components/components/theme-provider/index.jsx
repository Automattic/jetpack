/**
 * External dependencies
 */
import React, { useLayoutEffect } from 'react';

export const typography = {
	// Typography
	'--font-title-large': '36px',
	'--font-title-small': '24px',
	'--font-body': '16px',
	'--font-label': '12px',
};

export const colors = {
	// Colors
	'--jp-black': '#000000',
	'--jp-black-80': '#2c3338',
	'--jp-white': '#ffffff',
	'--jp-white-off': '#f9f9f6',
	'--jp-gray': '#dcdcde',
	'--jp-gray-0': '#F6F7F7',
	'--jp-gray-20': '#A7AAAD',
	'--jp-gray-40': '#787C82',
	'--jp-gray-50': '#646970',
	'--jp-gray-60': '#50575E',
	'--jp-gray-80': '#2C3338',
	'--jp-gray-off': '#e2e2df',
	'--jp-red-0': '#F7EBEC',
	'--jp-red-50': '#D63638',
	'--jp-red-60': '#B32D2E',
	'--jp-red-80': '#8A2424',
	'--jp-red': '#d63639',
	'--jp-pink': '#C9356E',
	'--jp-green-0': '#f0f2eb',
	'--jp-green-5': '#d0e6b8',
	'--jp-green-10': '#9dd977',
	'--jp-green-20': '#64ca43',
	'--jp-green-30': '#2fb41f',
	'--jp-green-40': '#069e08',
	'--jp-green-50': '#008710',
	'--jp-green-60': '#007117',
	'--jp-green-70': '#005b18',
	'--jp-green-80': '#004515',
	'--jp-green-90': '#003010',
	'--jp-green-100': '#001c09',
	'--jp-green': '#069e08',
	'--jp-green-primary': 'var( --jp-green-40 )',
	'--jp-green-secondary': 'var( --jp-green-30 )',
};

export const borders = {
	// Borders
	'--jp-border-radius': '4px',
	'--jp-menu-border-height': '1px',
	'--jp-underline-thickness': '2px',
};

const setup = () => {
	const root = document.getElementById( 'jetpack-theme-provider' );
	const tokens = { ...typography, ...colors, ...borders };

	for ( const key in tokens ) {
		root.style.setProperty( key, tokens[ key ] );
	}
};

const ThemeProvider = ( { children = null } ) => {
	useLayoutEffect( () => {
		setup();
	}, [] );

	return <div id="jetpack-theme-provider">{ children }</div>;
};

export default ThemeProvider;
