import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

const useEnsureTabData = jest.fn< () => { status: string; retry: () => void } >();
const isSeoToolsActive = jest.fn< () => boolean >();

// The Content stage is invoked as a plain function below, and (on a plan-gated
// site) redirects via useNavigate/useEffect. Stub those hooks and force the
// ungated path so the tests exercise the normal render, not the redirect.
jest.unstable_mockModule( '@wordpress/element', () => ( {
	useEffect: () => undefined,
} ) );
jest.unstable_mockModule( '@wordpress/route', () => ( {
	useNavigate: () => jest.fn(),
} ) );
jest.unstable_mockModule( '../../../_inc/data/is-gated', () => ( {
	isGated: () => false,
} ) );
jest.unstable_mockModule( '../../../_inc/components/dashboard-load-error', () => ( {
	default: () => 'load-error',
} ) );
jest.unstable_mockModule( '../../../_inc/components/dashboard-skeleton', () => ( {
	default: () => 'skeleton',
} ) );
jest.unstable_mockModule( '../../../_inc/components/seo-disabled-stage', () => ( {
	default: () => 'seo-disabled',
} ) );
jest.unstable_mockModule( '../../../_inc/dashboard/dashboard-page', () => ( {
	default: ( { children }: { children: React.ReactNode } ) => children,
} ) );
jest.unstable_mockModule( '../../../_inc/data/get-preloaded', () => ( {
	CONTENT_PATH: '/jetpack/v4/seo/content',
	OVERVIEW_PATH: '/jetpack/v4/seo/overview',
} ) );
jest.unstable_mockModule( '../../../_inc/data/is-seo-tools-active', () => ( {
	default: isSeoToolsActive,
} ) );
jest.unstable_mockModule( '../../../_inc/data/use-ensure-tab-data', () => ( {
	default: useEnsureTabData,
} ) );
jest.unstable_mockModule( '../../../_inc/screens/content', () => ( {
	default: () => 'content-screen',
} ) );

const { stage: Stage } = await import( '../../../routes/content/stage' );
const { CONTENT_PATH, OVERVIEW_PATH } = await import( '../../../_inc/data/get-preloaded' );

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
		isSeoToolsActive.mockReset();
		isSeoToolsActive.mockReturnValue( true );
	} );

	/**
	 * The Content tab reads both its own slice and the Overview slice — it gates on
	 * the `seo-tools` state, which lives in Overview — so a missing preload for
	 * either has to be recovered before the list renders.
	 */
	it( 'ensures both the overview and content slices are available', () => {
		useEnsureTabData.mockReturnValue( { status: 'ready', retry: jest.fn() } );

		Stage();

		expect( useEnsureTabData ).toHaveBeenCalledWith( [
			{ path: OVERVIEW_PATH },
			{ path: CONTENT_PATH },
		] );
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
	 * With data ready and the module on, the tab renders the content list.
	 */
	it( 'renders the content list once the data is ready', () => {
		useEnsureTabData.mockReturnValue( { status: 'ready', retry: jest.fn() } );

		renderStage();

		expect( screen.getByText( 'content-screen' ) ).toBeInTheDocument();
	} );

	/**
	 * With the `seo-tools` module off, per-post SEO meta has no effect, so the tab
	 * offers the enable affordance instead of a list the user can't act on.
	 */
	it( 'offers the enable affordance when the seo-tools module is off', () => {
		useEnsureTabData.mockReturnValue( { status: 'ready', retry: jest.fn() } );
		isSeoToolsActive.mockReturnValue( false );

		renderStage();

		expect( screen.getByText( 'seo-disabled' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'content-screen' ) ).not.toBeInTheDocument();
	} );
} );
