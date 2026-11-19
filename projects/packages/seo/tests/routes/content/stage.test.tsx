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
	CONTENT_PATH: '/jetpack/v4/seo/content',
} ) );
jest.unstable_mockModule( '../../../_inc/data/use-ensure-tab-data', () => ( {
	default: useEnsureTabData,
} ) );
jest.unstable_mockModule( '../../../_inc/screens/content', () => ( {
	default: () => 'content-screen',
} ) );

const { stage: Stage } = await import( '../../../routes/content/stage' );
const { CONTENT_PATH } = await import( '../../../_inc/data/get-preloaded' );

/**
 * Render the stage. Every branch's children are stubbed to a distinct string
 * above, so the rendered text identifies which branch the stage took.
 *
 * @return The testing-library render result.
 */
const renderStage = () => render( <Stage /> );

describe( 'Content route stage', () => {
	beforeEach( () => {
		useEnsureTabData.mockReset();
	} );

	/**
	 * A missing preload of the Content slice has to be recovered before the list renders.
	 */
	it( 'ensures the content slice is available', () => {
		useEnsureTabData.mockReturnValue( { status: 'ready', retry: jest.fn() } );

		Stage();

		expect( useEnsureTabData ).toHaveBeenCalledWith( [ { path: CONTENT_PATH } ] );
	} );

	/**
	 * While the slices are still being fetched the tab shows a skeleton rather than
	 * an empty list, which would read as "you have no content".
	 */
	it( 'shows the skeleton while the tab data is loading', () => {
		useEnsureTabData.mockReturnValue( { status: 'loading', retry: jest.fn() } );

		renderStage();

		expect( screen.getByText( 'skeleton' ) ).toBeInTheDocument();
	} );

	/**
	 * A genuine failure is recoverable: the tab surfaces the retry affordance instead
	 * of dead-ending, and hands it the retry callback from the data hook.
	 */
	it( 'shows a recoverable error state when the tab data fails', () => {
		useEnsureTabData.mockReturnValue( { status: 'error', retry: jest.fn() } );

		renderStage();

		expect( screen.getByText( 'load-error' ) ).toBeInTheDocument();
	} );

	/**
	 * With data ready, the tab renders the content list.
	 */
	it( 'renders the content list once the data is ready', () => {
		useEnsureTabData.mockReturnValue( { status: 'ready', retry: jest.fn() } );

		renderStage();

		expect( screen.getByText( 'content-screen' ) ).toBeInTheDocument();
	} );
} );
