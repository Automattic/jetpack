import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

const useEnsureTabData = jest.fn< () => { status: string; retry: () => void } >();

jest.unstable_mockModule( '../../../_inc/components/dashboard-load-error', () => ( {
	default: () => 'load-error',
} ) );
jest.unstable_mockModule( '../../../_inc/components/dashboard-skeleton', () => ( {
	default: () => 'skeleton',
} ) );
jest.unstable_mockModule( '../../../_inc/dashboard/dashboard-page', () => ( {
	default: ( { children }: { children: React.ReactNode } ) => children,
} ) );
jest.unstable_mockModule( '../../../_inc/data/get-preloaded', () => ( {
	OVERVIEW_PATH: '/jetpack/v4/seo/overview',
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
	} );

	it( 'renders the Overview once its data is ready', () => {
		render( <Stage /> );

		expect( screen.getByText( 'overview-screen' ) ).toBeInTheDocument();
	} );

	it( 'shows the skeleton while loading', () => {
		useEnsureTabData.mockReturnValue( { status: 'loading', retry: jest.fn() } );

		render( <Stage /> );

		expect( screen.getByText( 'skeleton' ) ).toBeInTheDocument();
	} );
} );
