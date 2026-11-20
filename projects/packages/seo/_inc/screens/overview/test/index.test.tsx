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

	it( 'renders its cards', () => {
		render( <OverviewScreen /> );

		expect( screen.getByText( 'Site visibility' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Site verification' ) ).toBeInTheDocument();
	} );
} );
