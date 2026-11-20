import { getSiteData } from '@automattic/jetpack-script-data';
import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { useViewState } from '../_inc/subscribers/lib/use-view-state';
import type { View } from '@wordpress/dataviews';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getSiteData: jest.fn( () => ( { wpcom: { blog_id: 123 } } ) ),
	getScriptData: jest.fn( () => ( { user: { current_user: { id: 1 } } } ) ),
} ) );

const defaultView: View = { type: 'table', page: 1, perPage: 20 };

// StrictMode, as in wp-admin with SCRIPT_DEBUG on, runs each effect twice on mount.
const openPage = ( search = '' ) => {
	window.history.replaceState( null, '', `/wp-admin/admin.php${ search }` );
	return renderHook( () => useViewState( defaultView ), { wrapper: StrictMode } );
};

describe( 'useViewState', () => {
	beforeEach( () => {
		window.localStorage.clear();
		jest.mocked( getSiteData ).mockReturnValue( { wpcom: { blog_id: 123 } } as never );
	} );

	it( 'remembers the chosen page size the next time the screen opens', () => {
		const { result: firstVisit, unmount } = openPage( '?page=jetpack-newsletter' );
		act( () => firstVisit.current[ 1 ]( { ...firstVisit.current[ 0 ], perPage: 50 } ) );
		unmount();

		const { result: secondVisit } = openPage( '?page=jetpack-newsletter' );

		expect( secondVisit.current[ 0 ].perPage ).toBe( 50 );
	} );

	it( 'lets a page size in the URL win over the remembered one', () => {
		const { result: firstVisit, unmount } = openPage( '?page=jetpack-newsletter' );
		act( () => firstVisit.current[ 1 ]( { ...firstVisit.current[ 0 ], perPage: 50 } ) );
		unmount();

		const { result: secondVisit } = openPage( '?page=jetpack-newsletter&pp=100' );

		expect( secondVisit.current[ 0 ].perPage ).toBe( 100 );
	} );

	it( 'keeps the remembered page size after opening a link with a different one', () => {
		const { result: firstVisit, unmount } = openPage( '?page=jetpack-newsletter' );
		act( () => firstVisit.current[ 1 ]( { ...firstVisit.current[ 0 ], perPage: 50 } ) );
		unmount();
		openPage( '?page=jetpack-newsletter&pp=100' ).unmount();

		const { result: laterVisit } = openPage( '?page=jetpack-newsletter' );

		expect( laterVisit.current[ 0 ].perPage ).toBe( 50 );
	} );

	it( 'remembers nothing until a page size is picked', () => {
		openPage( '?page=jetpack-newsletter' ).unmount();

		expect( window.localStorage ).toHaveLength( 0 );
	} );

	it( 'remembers nothing when the site has no WordPress.com id', () => {
		jest.mocked( getSiteData ).mockReturnValue( { wpcom: { blog_id: 0 } } as never );
		const { result: firstVisit, unmount } = openPage( '?page=jetpack-newsletter' );
		act( () => firstVisit.current[ 1 ]( { ...firstVisit.current[ 0 ], perPage: 50 } ) );
		unmount();

		expect( window.localStorage ).toHaveLength( 0 );
	} );

	it( 'uses the default page size when nothing is remembered', () => {
		const { result } = openPage( '?page=jetpack-newsletter' );

		expect( result.current[ 0 ].perPage ).toBe( 20 );
	} );
} );
