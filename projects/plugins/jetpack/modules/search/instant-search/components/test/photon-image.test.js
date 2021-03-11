/** @jsx h
 * @jest-environment jsdom
 */
/* global expect */

/**
 * External dependencies
 */
import { h } from 'preact';
import { render } from '@testing-library/preact';
import '@testing-library/jest-dom/extend-expect';

/**
 * Internal dependencies
 */
import PhotonImage from '../photon-image';

test( 'returns a Photon URL for a site with Photon enabled', () => {
	const { getByRole } = render(
		<PhotonImage src={ 'http://example.com/okapi.jpg' } isPhotonEnabled={ true } />
	);
	expect( getByRole( 'img' ).src ).toMatch( /i[0-9]\.wp\.com/ );
} );

test( 'returns the original URL for a private site', () => {
	const imageUrl = 'http://example.com/okapi.jpg';
	const { getByRole } = render( <PhotonImage src={ imageUrl } isPhotonEnabled={ false } /> );
	expect( getByRole( 'img' ).src ).toEqual( imageUrl );
} );
