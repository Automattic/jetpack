import { ProgressBar } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Card } from '@wordpress/ui';
import { filesize } from 'filesize';
import { useIsVideoPressUnlimited } from '../../hooks/use-is-videopress-unlimited';
import { getStorageUsedBytes, useSite } from '../../hooks/use-site';
import type { ReactElement } from 'react';

const ONE_TB_BYTES = 1_000_000_000_000; // 1 TB — same as legacy VideoStorageMeter.
const TWO_TB_BYTES = 2_000_000_000_000; // 2 TB — grandfathered "unlimited" cap.

/**
 * Storage meter strip rendered below the Overview's trends chart and
 * above the bottom row. Ported from the legacy `VideoStorageMeter`:
 * same string, same percentage display. The denominator is 1TB, or 2TB
 * for sites grandfathered into the "unlimited" storage tier (Jetpack
 * plans purchased before 2021-10-07, physically capped at 2TB).
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
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return -- Hook must run unconditionally (Rules of Hooks); its value is only read after the early return below.
	const isUnlimited = useIsVideoPressUnlimited();
	const usedBytes = getStorageUsedBytes( site.data );
	if ( site.isLoading || ! usedBytes ) {
		return null;
	}
	const totalBytes = isUnlimited ? TWO_TB_BYTES : ONE_TB_BYTES;
	const progress = usedBytes / totalBytes;
	const progressLabel = `${ ( progress * 100 ).toFixed() }%`;
	const totalLabel = filesize( totalBytes, { base: 10 } );
	return (
		<Card.Root>
			<Card.Content>
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
			</Card.Content>
		</Card.Root>
	);
}
