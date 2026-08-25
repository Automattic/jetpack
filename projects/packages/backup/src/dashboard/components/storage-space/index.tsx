import { useId } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import { StorageUsageLevels } from '../../data/storage-usage-levels';
import { useStorageUsage } from '../../hooks/use-storage-usage';
import StorageMeter from './meter';
import './style.scss';
import type { StorageUsageLevelName } from '../../data/storage-usage-levels';

/**
 * Heading text for a usage level.
 *
 * The heading is the only place the calm and alarming readings differ in
 * words rather than colour, so it carries most of the answer to "why did
 * my backups stop".
 *
 * @param usageLevel - Derived level, or null when it could not be computed.
 * @return The section heading.
 */
function sectionHeading( usageLevel: StorageUsageLevelName | null ): string {
	if ( usageLevel === StorageUsageLevels.Full ) {
		return __( 'Cloud storage full', 'jetpack-backup-pkg' );
	}

	if ( usageLevel === StorageUsageLevels.Critical ) {
		return __( 'Cloud storage is almost full', 'jetpack-backup-pkg' );
	}

	return __( 'Cloud storage space', 'jetpack-backup-pkg' );
}

/**
 * The Overview screen's storage section.
 *
 * Renders nothing at all until both halves of the answer have arrived and
 * agree there is something to measure — a site with no policy answer has
 * no denominator, and drawing a bar for it would show a full-width empty
 * meter that means nothing. That silence is deliberate and matches the
 * legacy dashboard's own `storageSize !== null && storageLimit > 0` gate.
 *
 * Sibling issues add usage details, the upsell and the help popover
 * inside this same section.
 *
 * @return The storage section, or null when there is nothing to show.
 */
export default function StorageSpace() {
	const usage = useStorageUsage();
	// `<section>` is only a `region` landmark when it has an accessible
	// name; unnamed it is a generic container and buys nothing a `<div>`
	// would not. Pointing at the heading makes it a landmark a screen
	// reader can jump to, which is the point of a section that answers
	// "why did my backups stop".
	const headingId = useId();

	if ( ! usage.hasUsableFigures ) {
		return null;
	}

	return (
		<section className="jpb-storage-space" aria-labelledby={ headingId }>
			<Text variant="heading-md" render={ <h2 id={ headingId } /> }>
				{ sectionHeading( usage.usageLevel ) }
			</Text>
			<StorageMeter
				storageUsed={ usage.storageUsed }
				storageLimit={ usage.storageLimit }
				usageLevel={ usage.usageLevel }
			/>
		</section>
	);
}
