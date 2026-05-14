import { ProgressBar } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { filesize } from 'filesize';
import type { ReactElement } from 'react';

const TOTAL_BYTES = 1_000_000_000_000; // 1 TB — same as legacy VideoStorageMeter.

type Props = {
	usedBytes: number;
};

/**
 * Storage meter strip rendered below the Overview's trends chart and
 * above the bottom row. Ported from the legacy `VideoStorageMeter`:
 * same string, same denominator, same percentage-of-1-TB display. The
 * caller is responsible for the hide rules (free / atomic / unlimited /
 * no uploads) — keeping that logic at the call site keeps this
 * component pure.
 *
 * Falls back to a no-op `null` render when `usedBytes` is non-positive,
 * which gracefully handles the loading state and any future "API
 * returned 0 bytes" case.
 *
 * @param props           - Component props.
 * @param props.usedBytes - Cumulative bytes used across the site's VideoPress library.
 * @return The meter strip, or `null` when there's nothing to render.
 */
export default function StorageMeterCard( { usedBytes }: Props ): ReactElement | null {
	if ( usedBytes <= 0 ) {
		return null;
	}
	const progress = usedBytes / TOTAL_BYTES;
	const progressLabel = `${ ( progress * 100 ).toFixed() }%`;
	const totalLabel = filesize( TOTAL_BYTES, { base: 10 } );
	return (
		<div className="vp-overview__storage-meter">
			<span className="vp-overview__storage-meter-label">
				{ sprintf(
					/* translators: %1$s is the storage percentage, from 0% to 100%, %2$s is the total storage. */
					__( '%1$s of %2$s of cloud video storage', 'jetpack-videopress-pkg' ),
					progressLabel,
					totalLabel
				) }
			</span>
			<ProgressBar value={ Math.min( progress * 100, 100 ) } />
		</div>
	);
}
