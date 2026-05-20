import { ProgressBar } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { filesize } from 'filesize';
import { getStorageUsedBytes, useSite } from '../../hooks/use-site';
import type { ReactElement } from 'react';

const ONE_TB_BYTES = 1_000_000_000_000; // 1 TB — same as legacy VideoStorageMeter.

/**
 * Storage meter strip rendered below the Overview's trends chart and
 * above the bottom row. Ported from the legacy `VideoStorageMeter`:
 * same string, same denominator, same percentage-of-1-TB display.
 *
 * Sources storage usage internally from `useSite()` so callers no
 * longer need to thread a `usedBytes` prop through the stats shape.
 *
 * Returns `null` while the site info is loading or when storage
 * usage is zero (mirrors legacy hide logic).
 *
 * @return The meter strip, or `null` when there's nothing to render.
 */
export default function StorageMeterCard(): ReactElement | null {
	const site = useSite();
	const usedBytes = getStorageUsedBytes( site.data );
	if ( site.isLoading || ! usedBytes ) {
		return null;
	}
	const progress = usedBytes / ONE_TB_BYTES;
	const progressLabel = `${ ( progress * 100 ).toFixed() }%`;
	const totalLabel = filesize( ONE_TB_BYTES, { base: 10 } );
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
