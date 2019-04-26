/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import React from 'react';

/**
 * Internal dependencies
 */
import { TiledGallerySave } from '../save';

describe( 'jetpack/tiled-gallery', () => {
	test( 'block save matches snapshot', () => {
		expect( render( <TiledGallerySave attributes={ {} } /> ) ).toMatchSnapshot();
	} );
} );
