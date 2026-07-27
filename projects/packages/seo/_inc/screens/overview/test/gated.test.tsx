import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import type { OverviewResponse } from '../../../data/overview-types';

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
} ) );

// The off-ramp's only non-presentational dependency; stubbed so the ungated
// Overview can render without the module-toggle REST plumbing.
jest.unstable_mockModule( '../../../data/use-seo-tools-toggle', () => ( {
	default: () => ( { isToggling: false, setActive: jest.fn() } ),
} ) );

const { default: OverviewScreen } = await import( '../index' );

const UPSELL_TITLE = 'Boost your search engine ranking';
const OFF_RAMP_TEXT = 'Using a different SEO solution?';

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
		plan: {
			seo_enabled_for_site: true,
		},
	} ) as OverviewResponse;

describe( 'OverviewScreen — plan gating', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		getOverview.mockReturnValue( buildOverview() );
	} );

	it( 'shows the upsell banner and only the free cards when gated', () => {
		isGated.mockReturnValue( true );

		render( <OverviewScreen /> );

		expect( screen.getByText( UPSELL_TITLE ) ).toBeInTheDocument();
		expect( screen.getByText( 'Site visibility' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Site verification' ) ).toBeInTheDocument();
	} );

	it( 'hides the paid surfaces when gated', () => {
		isGated.mockReturnValue( true );

		render( <OverviewScreen /> );

		// Content coverage and the disable off-ramp are paid surfaces.
		expect( screen.queryByText( OFF_RAMP_TEXT ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Content SEO' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the full Overview with no banner when ungated', () => {
		isGated.mockReturnValue( false );

		render( <OverviewScreen /> );

		expect( screen.queryByText( UPSELL_TITLE ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Content SEO' ) ).toBeInTheDocument();
		expect( screen.getByText( OFF_RAMP_TEXT ) ).toBeInTheDocument();
	} );
} );
