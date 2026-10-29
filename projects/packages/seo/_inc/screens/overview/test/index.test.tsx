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
		site_is_private: false,
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
	verification_switchable: true,
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

	describe( 'while Jetpack SEO output is paused', () => {
		afterEach( () => {
			delete ( window as unknown as { JetpackScriptData?: unknown } ).JetpackScriptData;
		} );

		it.each( [
			[
				'names the plugin that manages SEO',
				'Yoast SEO',
				'Yoast SEO is managing your site’s SEO, so Jetpack’s SEO output is paused. Your saved settings are kept. Deactivate Yoast SEO to use them.',
			],
			[
				'says SEO output is off without a plugin',
				'',
				'Jetpack’s SEO output is turned off on this site. Your saved settings are kept.',
			],
		] )( '%s', ( _, plugin, banner ) => {
			( window as unknown as { JetpackScriptData?: unknown } ).JetpackScriptData = {
				site: { admin_url: 'https://example.com/wp-admin/' },
				seo: { output: { paused: true, conflicting_plugin: plugin } },
			};

			render( <OverviewScreen /> );

			expect( screen.getByText( banner ) ).toBeInTheDocument();
			// The old fallback wrongly said SEO tools weren't enabled while the module was on.
			expect( screen.queryByText( /SEO tools are not enabled/ ) ).not.toBeInTheDocument();
		} );
	} );

	it( 'shows no banner while Jetpack owns the output', () => {
		render( <OverviewScreen /> );

		expect( screen.queryByText( /SEO output is/ ) ).not.toBeInTheDocument();
	} );
} );
