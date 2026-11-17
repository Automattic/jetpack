import analytics from '@automattic/jetpack-analytics';
import { renderHook } from '@testing-library/react';
import useTabView from '..';
import type { SocialTab } from '../../../components/social-page';

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: jest.fn() } },
} ) );

const recordEvent = analytics.tracks.recordEvent as jest.Mock;
const shown = ( page: string, firstShow: boolean ) =>
	window.dispatchEvent(
		new CustomEvent( 'jetpack-admin-shell:page-shown', { detail: { page, firstShow } } )
	);

beforeEach( () => recordEvent.mockClear() );

describe( 'useTabView', () => {
	it( 'records the tab on mount and on each change, not on a re-render', () => {
		const { rerender } = renderHook( ( { tab }: { tab: SocialTab } ) => useTabView( tab ), {
			initialProps: { tab: 'overview' },
		} );
		rerender( { tab: 'overview' } );
		rerender( { tab: 'settings' } );

		expect( recordEvent.mock.calls ).toEqual( [
			[ 'jetpack_social_tab_view', { tab: 'overview' } ],
			[ 'jetpack_social_tab_view', { tab: 'settings' } ],
		] );
	} );

	it( 'records the tab again when the admin shell shows the page again, not on its first show', () => {
		renderHook( () => useTabView( 'settings' ) );

		shown( 'jetpack-social', true );
		shown( 'my-jetpack', false );
		shown( 'jetpack-social', false );

		expect( recordEvent.mock.calls ).toEqual( [
			[ 'jetpack_social_tab_view', { tab: 'settings' } ],
			[ 'jetpack_social_tab_view', { tab: 'settings' } ],
		] );
	} );
} );
