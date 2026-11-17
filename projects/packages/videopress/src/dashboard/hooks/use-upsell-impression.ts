import analytics from '@automattic/jetpack-analytics';
import { useEffect, useRef } from '@wordpress/element';
import type { UpgradeLocation } from './use-videopress-upgrade';

export type UpsellLocation = Exclude< UpgradeLocation, 'upload_limit' >;

/**
 * Record one rendered upsell per mounted surface.
 *
 * @param location   - Bounded surface name.
 * @param videoCount - Current UI count after a successful library read, if known.
 * @return Ref for the rendered offer element.
 */
export function useUpsellImpression< T extends HTMLElement = HTMLDivElement >(
	location: UpsellLocation,
	videoCount?: number
) {
	const ref = useRef< T >( null );
	const recordedLocation = useRef< UpsellLocation | null >( null );

	// Recheck each commit because a conditional offer can render after the hook first mounts.
	useEffect( () => {
		if ( ! ref.current || recordedLocation.current === location ) {
			return;
		}

		recordedLocation.current = location;
		const countKnown =
			typeof videoCount === 'number' && Number.isSafeInteger( videoCount ) && videoCount >= 0;
		// Let parent dashboard effects initialize the existing Tracks identity first.
		queueMicrotask( () =>
			analytics.tracks.recordEvent( 'jetpack_videopress_upsell_impression', {
				location,
				video_count_known: countKnown,
				...( countKnown ? { video_count: videoCount } : {} ),
			} )
		);
	} );

	return ref;
}
