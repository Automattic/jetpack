import analytics from '@automattic/jetpack-analytics';
import useProductCheckoutWorkflow from '@automattic/jetpack-connection/hooks/use-product-checkout-workflow';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FreeTierNotice, { FREE_TIER_AT_LIMIT_MESSAGE } from '..';

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		initialize: jest.fn(),
		tracks: { recordEvent: jest.fn() },
	},
} ) );

jest.mock( '@automattic/jetpack-connection/hooks/use-product-checkout-workflow', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

const mockedCheckoutWorkflow = useProductCheckoutWorkflow as jest.Mock;
const mockedAnalytics = analytics as unknown as {
	tracks: { recordEvent: jest.Mock };
};

const setInitialState = ( state: unknown ) => {
	( window as unknown as { JPVIDEOPRESS_INITIAL_STATE?: unknown } ).JPVIDEOPRESS_INITIAL_STATE =
		state;
};

const DEFAULT_STATE = {
	product: { slug: 'jetpack_videopress' },
	siteData: { adminUrl: 'https://example.com/wp-admin/' },
};

let mockRun: jest.Mock;
const originalObserver = window.IntersectionObserver;

describe( 'FreeTierNotice', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		setInitialState( DEFAULT_STATE );
		mockRun = jest.fn();
		mockedCheckoutWorkflow.mockReturnValue( { run: mockRun } );
	} );

	afterEach( () => {
		window.IntersectionObserver = originalObserver;
		jest.restoreAllMocks();
	} );

	it( 'observes the notice and records its current video count on exposure', () => {
		jest.spyOn( document, 'visibilityState', 'get' ).mockReturnValue( 'visible' );
		let observerCallback: IntersectionObserverCallback;
		const observe = jest.fn();
		window.IntersectionObserver = jest.fn( callback => {
			observerCallback = callback;
			return { observe, disconnect: jest.fn() };
		} ) as unknown as typeof IntersectionObserver;
		render( <FreeTierNotice location="library_at_limit" videoCount={ 1 } /> );
		const notice = observe.mock.calls[ 0 ][ 0 ];
		expect( notice ).toContainElement( screen.getByRole( 'link', { name: 'Upgrade' } ) );
		expect( mockedAnalytics.tracks.recordEvent ).not.toHaveBeenCalled();
		act( () =>
			observerCallback(
				[
					{
						target: notice,
						isIntersecting: true,
						intersectionRatio: 0.5,
					} as IntersectionObserverEntry,
				],
				{} as IntersectionObserver
			)
		);
		expect( mockedAnalytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_videopress_upsell_impression',
			{
				location: 'library_at_limit',
				video_count_known: true,
				video_count: 1,
			}
		);
	} );

	it( 'drives the shared checkout workflow with the VideoPress product and redirect', () => {
		render( <FreeTierNotice location="overview" /> );

		expect( mockedCheckoutWorkflow ).toHaveBeenCalledWith( {
			productSlug: 'jetpack_videopress',
			// Relative to wp-admin; the REST endpoint makes it absolute via
			// `admin_url()`. An absolute URL here would be doubled and 404.
			redirectUrl: 'admin.php?page=jetpack-videopress',
			useBlogIdSuffix: true,
			from: 'jetpack-videopress',
		} );
	} );

	it( 'renders the free-plan copy by default', () => {
		render( <FreeTierNotice location="overview" /> );

		expect(
			screen.getByText(
				'You’re on the free plan, which allows 1 video upload. Upgrade for more storage and unlimited uploads.'
			)
		).toBeInTheDocument();
	} );

	it( 'renders the provided message instead of the default copy', () => {
		render( <FreeTierNotice location="library_at_limit" message={ FREE_TIER_AT_LIMIT_MESSAGE } /> );

		expect(
			screen.getByText( 'You’ve reached the free plan’s 1-video limit. Upgrade to upload more.' )
		).toBeInTheDocument();
		expect( screen.queryByText( /You’re on the free plan/ ) ).not.toBeInTheDocument();
	} );

	it.each( [ 'overview', 'library_at_limit', 'settings_at_limit' ] as const )(
		'records the %s notice location and starts checkout on click',
		async location => {
			const user = userEvent.setup();
			const { rerender } = render( <FreeTierNotice location={ location } /> );
			rerender( <FreeTierNotice location={ location } /> );
			expect( mockedAnalytics.tracks.recordEvent ).not.toHaveBeenCalled();

			await user.click( screen.getByRole( 'link', { name: 'Upgrade' } ) );

			expect( mockedAnalytics.tracks.recordEvent ).toHaveBeenCalledWith(
				'jetpack_videopress_upgrade_trigger_link_click',
				{ location }
			);
			expect( mockedAnalytics.tracks.recordEvent ).toHaveBeenCalledTimes( 1 );
			// `run` is deferred to a microtask; userEvent's await flushes it.
			expect( mockRun ).toHaveBeenCalledTimes( 1 );
		}
	);
} );
