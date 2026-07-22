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
 * Flip the dashboard into WordPress.com Simple mode by seeding the
 * `JetpackScriptData` global that `isSimpleSite()` reads. Mirrors VideoPress's
 * `setSimpleSite()` test util — seeding the real global rather than mocking the
 * module keeps `isSimpleSite()` itself in the code path under test.
 */
const setSimpleSite = () => {
	( window as unknown as { JetpackScriptData?: unknown } ).JetpackScriptData = {
		site: { host: 'wpcom' },
	};
};

/**
 * Remove the script-data global so the test runs in self-hosted mode.
 */
const unsetSimpleSite = () => {
	delete ( window as unknown as { JetpackScriptData?: unknown } ).JetpackScriptData;
};

/**
 * Build an Overview payload with SEO tools active.
 *
 * @return The Overview payload.
 */
const buildOverview = (): OverviewResponse => ( {
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
} );

describe( 'OverviewScreen — disable-SEO off-ramp', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		getOverview.mockReturnValue( buildOverview() );
	} );

	afterEach( () => {
		unsetSimpleSite();
	} );

	it( 'renders the off-ramp when the site is not WordPress.com Simple', () => {
		render( <OverviewScreen /> );

		expect( screen.getByText( OFF_RAMP_TEXT ) ).toBeInTheDocument();
	} );

	it( 'hides the off-ramp on WordPress.com Simple, where SEO tools cannot be disabled', () => {
		setSimpleSite();

		render( <OverviewScreen /> );

		expect( screen.queryByText( OFF_RAMP_TEXT ) ).not.toBeInTheDocument();
	} );

	it( 'still renders the rest of the Overview on Simple', () => {
		setSimpleSite();

		render( <OverviewScreen /> );

		expect( screen.getByText( 'Site visibility' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Site verification' ) ).toBeInTheDocument();
	} );
} );
