import analytics from '@automattic/jetpack-analytics';
import { act, render, screen } from '@testing-library/react';
import { StrictMode } from '@wordpress/element';
import { useUpsellImpression, type UpsellLocation } from '../use-upsell-impression';

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: jest.fn() } },
} ) );

const recordEvent = analytics.tracks.recordEvent as jest.Mock;
const originalObserver = window.IntersectionObserver;
let observers: Array< {
	emit: ( ratio: number, intersecting?: boolean ) => void;
	observe: jest.Mock;
	disconnect: jest.Mock;
} >;

const Surface = ( {
	location = 'overview',
	videoCount,
}: {
	location?: UpsellLocation;
	videoCount?: number;
} ) => {
	const ref = useUpsellImpression( location, videoCount );
	return <div ref={ ref }>{ 'Upgrade notice' }</div>;
};

describe( 'useUpsellImpression', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		jest.spyOn( document, 'visibilityState', 'get' ).mockReturnValue( 'visible' );
		observers = [];
		window.IntersectionObserver = jest.fn( callback => {
			let target: Element;
			const observer = {
				observe: jest.fn( element => {
					target = element;
				} ),
				disconnect: jest.fn(),
				emit: ( ratio: number, intersecting = true ) => {
					act( () =>
						callback(
							[
								{
									target,
									intersectionRatio: ratio,
									isIntersecting: intersecting,
								},
							],
							observer
						)
					);
				},
			};
			observers.push( observer );
			return observer;
		} ) as unknown as typeof IntersectionObserver;
	} );

	afterEach( () => {
		window.IntersectionObserver = originalObserver;
		jest.restoreAllMocks();
	} );

	it( 'waits for half the surface to be visible', () => {
		render( <Surface videoCount={ 2 } /> );
		expect( observers[ 0 ].observe ).toHaveBeenCalledWith( screen.getByText( 'Upgrade notice' ) );
		expect( recordEvent ).not.toHaveBeenCalled();
		observers[ 0 ].emit( 0.49 );
		observers[ 0 ].emit( 0.5, false );
		expect( recordEvent ).not.toHaveBeenCalled();
		observers[ 0 ].emit( 0.5 );
		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_videopress_upsell_impression', {
			location: 'overview',
			video_count_known: true,
			video_count: 2,
		} );
	} );

	it.each( [ 'overview', 'library_at_limit', 'settings_at_limit', 'pricing_upsell' ] as const )(
		'records the bounded %s location',
		location => {
			render( <Surface location={ location } /> );
			observers[ 0 ].emit( 1 );
			expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_videopress_upsell_impression', {
				location,
				video_count_known: false,
			} );
		}
	);

	it( 'does not duplicate an impression on visibility changes or count rerenders', () => {
		const { rerender } = render( <Surface /> );
		observers[ 0 ].emit( 1 );
		observers[ 0 ].emit( 0 );
		observers[ 0 ].emit( 1 );
		rerender( <Surface videoCount={ 4 } /> );
		expect( recordEvent ).toHaveBeenCalledTimes( 1 );
		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_videopress_upsell_impression', {
			location: 'overview',
			video_count_known: false,
		} );
	} );

	it( 'uses count data available before the first impression', () => {
		const { rerender } = render( <Surface /> );
		observers[ 0 ].emit( 0.1 );
		rerender( <Surface videoCount={ 0 } /> );
		observers[ 0 ].emit( 1 );
		expect( recordEvent ).not.toHaveBeenCalled();
		observers[ 1 ].emit( 1 );
		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_videopress_upsell_impression', {
			location: 'overview',
			video_count_known: true,
			video_count: 0,
		} );
	} );

	it.each( [ -1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1 ] )(
		'omits invalid count %s',
		videoCount => {
			render( <Surface videoCount={ videoCount } /> );
			observers[ 0 ].emit( 1 );
			expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_videopress_upsell_impression', {
				location: 'overview',
				video_count_known: false,
			} );
		}
	);

	it( 'waits for a background tab to become visible', () => {
		const visibility = jest.spyOn( document, 'visibilityState', 'get' ).mockReturnValue( 'hidden' );
		render( <Surface /> );
		observers[ 0 ].emit( 1 );
		expect( recordEvent ).not.toHaveBeenCalled();
		visibility.mockReturnValue( 'visible' );
		act( () => document.dispatchEvent( new Event( 'visibilitychange' ) ) );
		expect( recordEvent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'ignores stale StrictMode observers and callbacks after unmount', () => {
		const { unmount } = render(
			<StrictMode>
				<Surface />
			</StrictMode>
		);
		expect( observers ).toHaveLength( 2 );
		expect( observers[ 0 ].disconnect ).toHaveBeenCalled();
		observers[ 0 ].emit( 1 );
		expect( recordEvent ).not.toHaveBeenCalled();
		observers[ 1 ].emit( 1 );
		unmount();
		observers[ 1 ].emit( 1 );
		expect( recordEvent ).toHaveBeenCalledTimes( 1 );
		expect( observers[ 1 ].disconnect ).toHaveBeenCalled();
	} );

	it( 'records a new impression when a surface is visited again', () => {
		const { unmount } = render( <Surface /> );
		observers[ 0 ].emit( 1 );
		unmount();
		render( <Surface /> );
		observers[ 1 ].emit( 1 );
		expect( recordEvent ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'does not substitute a mount event for unsupported visibility detection', () => {
		( window as unknown as { IntersectionObserver?: unknown } ).IntersectionObserver = undefined;
		render( <Surface /> );
		expect( recordEvent ).not.toHaveBeenCalled();
	} );
} );
