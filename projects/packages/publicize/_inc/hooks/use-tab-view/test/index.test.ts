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

const resolveTab = ( tab: unknown ): SocialTab => ( tab === 'settings' ? 'settings' : 'overview' );

beforeEach( () => recordEvent.mockClear() );

describe( 'useTabView', () => {
	it( 'records the tab on mount and on each change, not on a re-render', () => {
		const { rerender } = renderHook(
			( { tab }: { tab: SocialTab } ) => useTabView( tab, resolveTab ),
			{
				initialProps: { tab: 'overview' },
			}
		);
		rerender( { tab: 'overview' } );
		rerender( { tab: 'settings' } );

		expect( recordEvent.mock.calls ).toEqual( [
			[ 'jetpack_social_tab_view', { tab: 'overview' } ],
			[ 'jetpack_social_tab_view', { tab: 'settings' } ],
		] );
	} );

	it.each( [
		[ 'another tab', '/?tab=settings', 'settings', true ],
		[ 'another tab, before the route renders', '/?tab=settings', 'settings', false ],
		[ 'the same tab at another URL', '/?tab=connections', 'overview', true ],
	] )(
		'records one view when the admin shell shows the page again at %s',
		( _, route, tab, rendersFirst ) => {
			const { rerender } = renderHook(
				( { tab: current }: { tab: SocialTab } ) => useTabView( current, resolveTab ),
				{ initialProps: { tab: 'overview' } }
			);
			recordEvent.mockClear();

			window.dispatchEvent(
				new CustomEvent( 'jetpack-admin-shell:page-hidden', {
					detail: { page: 'jetpack-social', next: 'my-jetpack' },
				} )
			);
			if ( rendersFirst ) {
				rerender( { tab: tab as SocialTab } );
			}
			window.dispatchEvent(
				new CustomEvent( 'jetpack-admin-shell:page-shown', {
					detail: {
						page: 'jetpack-social',
						firstShow: false,
						routeChanged: true,
						url: `https://example.com/wp-admin/admin.php?page=jetpack-social&p=${ encodeURIComponent(
							route
						) }`,
					},
				} )
			);

			rerender( { tab: tab as SocialTab } );

			expect( recordEvent.mock.calls ).toEqual( [ [ 'jetpack_social_tab_view', { tab } ] ] );
		}
	);

	it( 'records the tab again when the admin shell shows the page again, not on its first show', () => {
		renderHook( () => useTabView( 'settings', resolveTab ) );

		shown( 'jetpack-social', true );
		shown( 'my-jetpack', false );
		shown( 'jetpack-social', false );

		expect( recordEvent.mock.calls ).toEqual( [
			[ 'jetpack_social_tab_view', { tab: 'settings' } ],
			[ 'jetpack_social_tab_view', { tab: 'settings' } ],
		] );
	} );
} );
