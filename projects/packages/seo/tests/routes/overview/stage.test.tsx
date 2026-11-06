import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

const useEnsureTabData = jest.fn< () => { status: string; retry: () => void } >();
const isSeoToolsActive = jest.fn< () => boolean >();
const isGated = jest.fn< () => boolean >();

jest.unstable_mockModule( '../../../_inc/components/dashboard-load-error', () => ( {
	default: () => 'load-error',
} ) );
jest.unstable_mockModule( '../../../_inc/components/dashboard-skeleton', () => ( {
	default: () => 'skeleton',
} ) );
jest.unstable_mockModule( '../../../_inc/components/seo-disabled-stage', () => ( {
	default: ( { active }: { active: string } ) => `seo-disabled:${ active }`,
} ) );
jest.unstable_mockModule( '../../../_inc/dashboard/dashboard-page', () => ( {
	default: ( { children }: { children: React.ReactNode } ) => children,
} ) );
jest.unstable_mockModule( '../../../_inc/data/get-preloaded', () => ( {
	OVERVIEW_PATH: '/jetpack/v4/seo/overview',
} ) );
jest.unstable_mockModule( '../../../_inc/data/is-gated', () => ( {
	isGated,
} ) );
jest.unstable_mockModule( '../../../_inc/data/is-seo-tools-active', () => ( {
	default: isSeoToolsActive,
} ) );
jest.unstable_mockModule( '../../../_inc/data/use-ensure-tab-data', () => ( {
	default: useEnsureTabData,
} ) );
jest.unstable_mockModule( '../../../_inc/screens/overview', () => ( {
	default: () => 'overview-screen',
} ) );

const { stage: Stage } = await import( '../../../routes/overview/stage' );

describe( 'Overview route stage', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		useEnsureTabData.mockReturnValue( { status: 'ready', retry: jest.fn() } );
		isSeoToolsActive.mockReturnValue( true );
		isGated.mockReturnValue( false );
	} );

	it( 'renders the Overview when SEO tools are on', () => {
		render( <Stage /> );

		expect( screen.getByText( 'overview-screen' ) ).toBeInTheDocument();
	} );

	/**
	 * With the module off, the Overview shows the same tab-less enable prompt as the
	 * other tabs rather than its cards.
	 */
	it( 'shows the module-off stage when SEO tools are off', () => {
		isSeoToolsActive.mockReturnValue( false );

		render( <Stage /> );

		expect( screen.getByText( 'seo-disabled:overview' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'overview-screen' ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the reduced Overview on plan-gated sites even with SEO tools off', () => {
		isSeoToolsActive.mockReturnValue( false );
		isGated.mockReturnValue( true );

		render( <Stage /> );

		expect( screen.getByText( 'overview-screen' ) ).toBeInTheDocument();
	} );

	// The module state lives in the Overview slice, so it isn't known until it loads.
	it( 'shows the skeleton, not the module-off stage, while loading', () => {
		useEnsureTabData.mockReturnValue( { status: 'loading', retry: jest.fn() } );
		isSeoToolsActive.mockReturnValue( false );

		render( <Stage /> );

		expect( screen.getByText( 'skeleton' ) ).toBeInTheDocument();
	} );
} );
