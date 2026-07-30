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

// Still stubbed: the Overview renders `EnableSeoCard` when the module is off, and
// that card uses the toggle. Keeps the Overview off the module-toggle REST plumbing.
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

describe( 'OverviewScreen', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		getOverview.mockReturnValue( buildOverview() );
	} );

	afterEach( () => {
		unsetSimpleSite();
	} );

	it( 'no longer carries the disable-SEO off-ramp', () => {
		// It moved to the Advanced module at the foot of Settings, where it can carry
		// the context explaining what turning SEO tools off actually stops.
		render( <OverviewScreen /> );

		expect( screen.queryByText( OFF_RAMP_TEXT ) ).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: /Disable Jetpack SEO tools/ } )
		).not.toBeInTheDocument();
	} );

	it( 'renders its cards on WordPress.com Simple', () => {
		setSimpleSite();

		render( <OverviewScreen /> );

		expect( screen.getByText( 'Site visibility' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Site verification' ) ).toBeInTheDocument();
	} );
} );
