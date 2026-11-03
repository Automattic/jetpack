import analytics from '@automattic/jetpack-analytics';
import { useEffect, useRef } from '@wordpress/element';
import type { UpgradeLocation } from './use-videopress-upgrade';

export type UpsellLocation = Exclude< UpgradeLocation, 'upload_limit' >;

/**
 * Record one half-visible upsell per mounted surface while the tab is visible.
 *
 * @param location   - Bounded surface name.
 * @param videoCount - Current UI count after a successful library read, if known.
 * @return Ref for the element whose visibility defines the impression.
 */
export function useUpsellImpression< T extends HTMLElement = HTMLDivElement >(
	location: UpsellLocation,
	videoCount?: number
) {
	const ref = useRef< T >( null );
	const recordedLocation = useRef< UpsellLocation | null >( null );

	useEffect( () => {
		const element = ref.current;
		if (
			! element ||
			recordedLocation.current === location ||
			typeof IntersectionObserver !== 'function'
		) {
			return;
		}

		let active = true;
		let halfVisible = false;
		const recordIfVisible = () => {
			if (
				! active ||
				! halfVisible ||
				document.visibilityState !== 'visible' ||
				recordedLocation.current === location
			) {
				return;
			}
			recordedLocation.current = location;
			const countKnown =
				typeof videoCount === 'number' && Number.isSafeInteger( videoCount ) && videoCount >= 0;
			analytics.tracks.recordEvent( 'jetpack_videopress_upsell_impression', {
				location,
				video_count_known: countKnown,
				...( countKnown ? { video_count: videoCount } : {} ),
			} );
		};

		const observer = new IntersectionObserver(
			entries => {
				for ( const entry of entries ) {
					if ( entry.target === element ) {
						halfVisible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
						recordIfVisible();
					}
				}
			},
			{ threshold: 0.5 }
		);
		observer.observe( element );
		document.addEventListener( 'visibilitychange', recordIfVisible );
		return () => {
			active = false;
			observer.disconnect();
			document.removeEventListener( 'visibilitychange', recordIfVisible );
		};
	}, [ location, videoCount ] );

	return ref;
}
