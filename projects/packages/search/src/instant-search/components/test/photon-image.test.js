/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import PhotonImage from '../photon-image';

test( 'returns a Photon URL for a site with Photon enabled', () => {
	render( <PhotonImage src={ 'http://example.com/okapi.jpg' } isPhotonEnabled={ true } /> );
	expect( screen.getByRole( 'img' ).src ).toMatch( /i[0-9]\.wp\.com/ );
} );

test( 'returns the original URL for a private site', () => {
	const imageUrl = 'http://example.com/okapi.jpg';
	render( <PhotonImage src={ imageUrl } isPhotonEnabled={ false } /> );
	expect( screen.getByRole( 'img' ).src ).toEqual( imageUrl );
} );

test( 'returns the original URL for a SVG image', () => {
	const imageUrl = 'http://example.com/okapi.svg';
	render( <PhotonImage src={ imageUrl } isPhotonEnabled={ true } /> );
	expect( screen.getByRole( 'img' ).src ).toEqual( imageUrl );
} );
