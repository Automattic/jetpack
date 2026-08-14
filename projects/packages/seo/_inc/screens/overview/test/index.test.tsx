import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import type { OverviewResponse } from '../../../data/overview-types';
import type { ReactNode } from 'react';

// `--experimental-vm-modules` (true ESM): mock with `jest.unstable_mockModule`
// and import the component under test dynamically after the mocks are registered.
const getOverview = jest.fn< () => OverviewResponse | null >();

jest.unstable_mockModule( '../../../data/get-overview', () => ( {
	default: getOverview,
} ) );

jest.unstable_mockModule( '@wordpress/route', () => ( {
	useNavigate: () => jest.fn(),
	Link: ( { children }: { children?: ReactNode } ) => <a href="#">{ children }</a>,
} ) );

// Still stubbed: the Overview renders `EnableSeoCard` when the module is off, and
// that card uses the toggle. Keeps the Overview off the module-toggle REST plumbing.
jest.unstable_mockModule( '../../../data/use-seo-tools-toggle', () => ( {
	default: () => ( { isToggling: false, setActive: jest.fn() } ),
} ) );

const { default: OverviewScreen } = await import( '../index' );

const OFF_RAMP_TEXT = 'Using a different SEO solution?';

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

	it( 'no longer carries the disable-SEO off-ramp', () => {
		// It moved to the Advanced module at the foot of Settings, where it can carry
		// the context explaining what turning SEO tools off actually stops.
		render( <OverviewScreen /> );

		expect( screen.queryByText( OFF_RAMP_TEXT ) ).not.toBeInTheDocument();
		// Queried against the strings the Advanced module actually uses, so putting the
		// control back on this screen fails here. The old wording no longer exists
		// anywhere, which would have made this assertion unfalsifiable.
		expect(
			screen.queryByRole( 'button', { name: 'Disable Jetpack SEO' } )
		).not.toBeInTheDocument();
		expect( screen.queryByText( 'Disable Jetpack’s SEO tools' ) ).not.toBeInTheDocument();
	} );

	it( 'renders its cards', () => {
		render( <OverviewScreen /> );

		expect( screen.getByText( 'Site visibility' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Site verification' ) ).toBeInTheDocument();
	} );
} );
