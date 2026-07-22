import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import type { OverviewResponse } from '../../../data/overview-types';

// `--experimental-vm-modules` (true ESM): mock with `jest.unstable_mockModule`
// and import the component under test dynamically after the mocks are registered.
const getOverview = jest.fn< () => OverviewResponse | null >();

jest.unstable_mockModule( '../../../data/get-overview', () => ( {
	default: getOverview,
} ) );

jest.unstable_mockModule( '@wordpress/route', () => ( {
	useNavigate: () => jest.fn(),
} ) );

// The off-ramp's only non-presentational dependency; stubbed so the Overview can
// render without the module-toggle REST plumbing (matches the sibling
// `disable-seo-tools` test).
jest.unstable_mockModule( '../../../data/use-seo-tools-toggle', () => ( {
	default: () => ( { isToggling: false, setActive: jest.fn() } ),
} ) );

const { default: OverviewScreen } = await import( '../index' );

const OFF_RAMP_TEXT = 'Using a different SEO solution?';

/**
 * Build an Overview payload with SEO tools active, varying only `is_simple`.
 *
 * @param isSimple - Value for the payload's `is_simple` flag.
 * @return The Overview payload.
 */
const buildOverview = ( isSimple: boolean ): OverviewResponse => ( {
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
	is_simple: isSimple,
} );

describe( 'OverviewScreen — disable-SEO off-ramp', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'renders the off-ramp when the site is not WordPress.com Simple', () => {
		getOverview.mockReturnValue( buildOverview( false ) );

		render( <OverviewScreen /> );

		expect( screen.getByText( OFF_RAMP_TEXT ) ).toBeInTheDocument();
	} );

	it( 'hides the off-ramp on WordPress.com Simple, where SEO tools cannot be disabled', () => {
		getOverview.mockReturnValue( buildOverview( true ) );

		render( <OverviewScreen /> );

		expect( screen.queryByText( OFF_RAMP_TEXT ) ).not.toBeInTheDocument();
	} );

	it( 'still renders the rest of the Overview on Simple', () => {
		getOverview.mockReturnValue( buildOverview( true ) );

		render( <OverviewScreen /> );

		expect( screen.getByText( 'Site visibility' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Site verification' ) ).toBeInTheDocument();
	} );
} );
