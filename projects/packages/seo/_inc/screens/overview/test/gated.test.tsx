import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import type { OverviewResponse } from '../../../data/overview-types';
import type { ReactNode } from 'react';

// `--experimental-vm-modules` (true ESM): mock with `jest.unstable_mockModule`
// and import the component under test dynamically after the mocks are registered.
const getOverview = jest.fn< () => OverviewResponse | null >();
const isGated = jest.fn< () => boolean >();

jest.unstable_mockModule( '../../../data/get-overview', () => ( {
	default: getOverview,
} ) );

jest.unstable_mockModule( '../../../data/is-gated', () => ( {
	isGated,
	getUpsellUrl: () => 'https://wordpress.com/checkout/example.com/value_bundle',
} ) );

jest.unstable_mockModule( '@wordpress/route', () => ( {
	useNavigate: () => jest.fn(),
	Link: ( { children }: { children?: ReactNode } ) => <a href="#">{ children }</a>,
} ) );

const { default: OverviewScreen } = await import( '../index' );

const UPSELL_TITLE = 'Boost your search engine ranking';

/**
 * Build an Overview payload with SEO tools active.
 *
 * @return The Overview payload.
 */
const buildOverview = (): OverviewResponse =>
	( {
		site_visibility: {
			search_engines_visible: true,
			sitemap_active: true,
			seo_tools_active: true,
		},
		site_verification: {
			google: false,
			bing: false,
			pinterest: false,
			yandex: false,
			facebook: false,
		},
		content_coverage: {
			total: 10,
			with_schema: 5,
			with_title: 5,
			with_description: 5,
			with_search_visible: 5,
		},
	} ) as OverviewResponse;

describe( 'OverviewScreen — plan gating', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		getOverview.mockReturnValue( buildOverview() );
	} );

	it( 'shows the full overview without an upgrade prompt on formerly gated sites', () => {
		isGated.mockReturnValue( true );

		render( <OverviewScreen /> );

		expect( screen.queryByText( UPSELL_TITLE ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Site visibility' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Site verification' ) ).toBeInTheDocument();
	} );

	it( 'keeps content coverage on formerly gated sites', () => {
		isGated.mockReturnValue( true );

		render( <OverviewScreen /> );

		expect( screen.getByText( 'Content SEO' ) ).toBeInTheDocument();
	} );

	it( 'renders the full Overview with no banner when ungated', () => {
		isGated.mockReturnValue( false );

		render( <OverviewScreen /> );

		expect( screen.queryByText( UPSELL_TITLE ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Content SEO' ) ).toBeInTheDocument();
	} );

	describe( 'while Jetpack SEO output is paused', () => {
		const setPaused = ( plugin: string ) => {
			( window as unknown as { JetpackScriptData?: unknown } ).JetpackScriptData = {
				site: { admin_url: 'https://example.com/wp-admin/' },
				seo: { output: { paused: true, conflicting_plugin: plugin } },
			};
		};

		afterEach( () => {
			delete ( window as unknown as { JetpackScriptData?: unknown } ).JetpackScriptData;
		} );

		// Plugin conflicts still explain why output is paused.
		it.each( [
			[
				'Yoast SEO',
				'Yoast SEO is managing your site’s SEO, so Jetpack has paused its SEO titles, descriptions, canonical URLs, structured data and llms.txt. Your saved settings are kept. Deactivate Yoast SEO to use them.',
			],
			[
				'',
				'Jetpack’s SEO titles, descriptions, structured data and llms.txt are turned off on this site. Your saved settings are kept.',
			],
		] )(
			'shows the pause banner without an upgrade prompt, with "%s" in charge',
			( plugin, banner ) => {
				isGated.mockReturnValue( true );
				setPaused( plugin );

				render( <OverviewScreen /> );

				expect( screen.getByText( banner ) ).toBeInTheDocument();
				expect( screen.queryByText( UPSELL_TITLE ) ).not.toBeInTheDocument();
			}
		);

		it( 'preserves the pause notice while SEO tools are off', () => {
			isGated.mockReturnValue( true );
			setPaused( 'Yoast SEO' );
			const overview = buildOverview();
			overview.site_visibility.seo_tools_active = false;
			getOverview.mockReturnValue( overview );

			render( <OverviewScreen /> );

			expect( screen.getByText( /SEO titles, descriptions/ ) ).toBeInTheDocument();
			expect( screen.getByText( 'Site visibility' ) ).toBeInTheDocument();
		} );
	} );
} );
