/**
 * Internal dependencies
 */
import type * as WhatsNewModule from '.';
import type { act as Act } from 'react';

jest.mock( './load-translations', () => ( {
	loadTranslations: jest.fn(),
} ) );
jest.mock( './hooks', () => ( {
	ensureAnnouncementEntity: jest.fn(),
} ) );
jest.mock( './components', () => ( {
	WhatsNew: ( { channels }: { channels: string[] } ) => channels.join( ', ' ),
} ) );

// The tests drive React's own `act`, so they set what @testing-library/react sets for it.
( globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean } ).IS_REACT_ACT_ENVIRONMENT = true;

describe( 'mountWhatsNew', () => {
	let mountWhatsNew: typeof WhatsNewModule.mountWhatsNew;
	let act: typeof Act;
	let loadTranslations: jest.Mock;
	let ensureAnnouncementEntity: jest.Mock;

	// The module keeps its root for the page load, so each test loads a copy of its own.
	beforeEach( () => {
		jest.resetModules();
		( { act } = jest.requireActual( 'react' ) );
		( { loadTranslations } = jest.requireMock( './load-translations' ) );
		( { ensureAnnouncementEntity } = jest.requireMock( './hooks' ) );
		loadTranslations.mockResolvedValue( undefined );
		( { mountWhatsNew } = jest.requireActual( './index' ) );
	} );

	afterEach( () => {
		document.body.innerHTML = '';
	} );

	it.each( [
		[
			'in #wpbody, next to the content it must not be a child of',
			'<div id="wpbody"><div id="wpbody-content"></div></div>',
			'#wpbody > #jetpack-whats-new',
		],
		[ 'in the body of a page without #wpbody', '', 'body > #jetpack-whats-new' ],
	] )( 'mounts the surface %s', async ( _case, html, selector ) => {
		document.body.innerHTML = html;

		await act( async () => mountWhatsNew( { channels: [ 'my-plugin' ] } ) );

		expect( document.querySelector( selector ) ).toHaveTextContent( 'my-plugin' );
	} );

	it( 'updates the mounted surface on a second call, without a second root', async () => {
		await act( async () => mountWhatsNew( { channels: [ 'my-plugin' ] } ) );
		await act( async () => mountWhatsNew( { channels: [ 'my-plugin', 'another-plugin' ] } ) );

		expect( document.querySelectorAll( '#jetpack-whats-new' ) ).toHaveLength( 1 );
		expect( document.getElementById( 'jetpack-whats-new' ) ).toHaveTextContent(
			'my-plugin, another-plugin'
		);
		expect( loadTranslations ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'registers the entity once the translations are loaded, and renders after that', async () => {
		let finishLoading: () => void = () => {};
		loadTranslations.mockReturnValue(
			new Promise< void >( resolve => {
				finishLoading = resolve;
			} )
		);

		await act( async () => mountWhatsNew( { channels: [ 'my-plugin' ] } ) );

		expect( ensureAnnouncementEntity ).not.toHaveBeenCalled();
		expect( document.getElementById( 'jetpack-whats-new' ) ).not.toBeInTheDocument();

		await act( async () => finishLoading() );

		expect( ensureAnnouncementEntity ).toHaveBeenCalledTimes( 1 );
		expect( document.getElementById( 'jetpack-whats-new' ) ).toHaveTextContent( 'my-plugin' );
	} );
} );
