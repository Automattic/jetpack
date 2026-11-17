import analytics from '@automattic/jetpack-analytics';
import { render } from '@testing-library/react';
import { StrictMode } from '@wordpress/element';
import { useDashboardAnalytics } from '../use-dashboard-analytics';
import { useUpsellImpression, type UpsellLocation } from '../use-upsell-impression';

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { initialize: jest.fn(), tracks: { recordEvent: jest.fn() } },
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => ( { user: { current_user: { wpcom: { ID: 7, login: 'jane' } } } } ),
} ) );

const recordEvent = analytics.tracks.recordEvent as jest.Mock;

const Surface = ( {
	location = 'overview',
	videoCount,
	showOffer = true,
}: {
	location?: UpsellLocation;
	videoCount?: number;
	showOffer?: boolean;
} ) => {
	const ref = useUpsellImpression( location, videoCount );
	return showOffer ? <div ref={ ref }>{ 'Upgrade notice' }</div> : null;
};

describe( 'useUpsellImpression', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it.each( [ 'overview', 'library_at_limit', 'settings_at_limit', 'pricing_upsell' ] as const )(
		'records the bounded %s location when the offer renders',
		async location => {
			render( <Surface location={ location } /> );
			await Promise.resolve();
			expect( recordEvent.mock.calls ).toEqual( [
				[ 'jetpack_videopress_upsell_impression', { location, video_count_known: false } ],
			] );
		}
	);

	it.each( [ 0, 2 ] )( 'includes a known video count of %s', async videoCount => {
		render( <Surface videoCount={ videoCount } /> );
		await Promise.resolve();
		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_videopress_upsell_impression', {
			location: 'overview',
			video_count_known: true,
			video_count: videoCount,
		} );
	} );

	it( 'does not duplicate an impression on rerenders or later count updates', async () => {
		const { rerender } = render( <Surface /> );
		rerender( <Surface /> );
		rerender( <Surface videoCount={ 4 } /> );
		await Promise.resolve();
		expect( recordEvent.mock.calls ).toEqual( [
			[
				'jetpack_videopress_upsell_impression',
				{ location: 'overview', video_count_known: false },
			],
		] );
	} );

	it( 'waits for a conditional offer to render even when its properties do not change', async () => {
		const { rerender } = render( <Surface showOffer={ false } videoCount={ 1 } /> );
		await Promise.resolve();
		expect( recordEvent ).not.toHaveBeenCalled();
		rerender( <Surface videoCount={ 1 } /> );
		await Promise.resolve();
		expect( recordEvent.mock.calls ).toEqual( [
			[
				'jetpack_videopress_upsell_impression',
				{ location: 'overview', video_count_known: true, video_count: 1 },
			],
		] );
	} );

	it.each( [ -1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1 ] )(
		'omits invalid count %s',
		async videoCount => {
			render( <Surface videoCount={ videoCount } /> );
			await Promise.resolve();
			expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_videopress_upsell_impression', {
				location: 'overview',
				video_count_known: false,
			} );
		}
	);

	it( 'does not duplicate an impression during StrictMode replay', async () => {
		render(
			<StrictMode>
				<Surface />
			</StrictMode>
		);
		await Promise.resolve();
		expect( recordEvent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'records a new impression when a surface is visited again', async () => {
		const { unmount } = render( <Surface /> );
		unmount();
		render( <Surface /> );
		await Promise.resolve();
		expect( recordEvent ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'lets the dashboard initialize Tracks identity before the first impression', async () => {
		const Dashboard = () => {
			useDashboardAnalytics( 'overview' );
			return <Surface />;
		};
		delete window.__jetpackVideoPressDashboardTracked;
		render( <Dashboard /> );
		await Promise.resolve();
		expect( analytics.initialize ).toHaveBeenCalledWith( 7, 'jane' );
		expect( recordEvent.mock.calls.map( ( [ event ] ) => event ) ).toEqual( [
			'jetpack_videopress_admin_page_view',
			'jetpack_videopress_upsell_impression',
		] );
		delete window.__jetpackVideoPressDashboardTracked;
	} );
} );
