import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { info } from '@wordpress/icons';
import { Button, Link, LinkButton, Popover, Stack, Text } from '@wordpress/ui';
import { useAnalytics } from '../../hooks/use-analytics';
import { useSiteSuffix } from '../../hooks/use-connection';
import { useStorageAddonOffer } from '../../hooks/use-storage-addon-offer';
import { storageAddonCheckoutUrl } from './checkout-url';

/**
 * Where "reducing the backup size" goes.
 *
 * A literal URL rather than a redirect slug: the redirect service has no slug pointing
 * at this fragment.
 */
const REDUCE_SIZE_URL =
	'https://jetpack.com/support/backup/jetpack-vaultpress-backup-storage-and-retention/#reduce-storage-size';

type Props = {
	forecastInDays: number;
	storageUsed: number;
	storageLimit: number;
};

/**
 * The info button beside the usage reading, and what it says.
 *
 * Answers the question the meter raises but cannot: at the size this site's backups
 * actually are, how many days of them fit in the plan's storage.
 *
 * Two deliberate departures from legacy. The checkout link is built from an offer this
 * component asks for itself — legacy reads the slug from a store slot only its upsell
 * fills, and the two never coexist, so legacy's link carries a literal `null` where the
 * product should be.
 *
 * And it opens closed. Legacy auto-opens on first load, which under `@wordpress/ui`
 * would move keyboard focus into a popup nobody asked for.
 *
 * @param props                - Component props.
 * @param props.forecastInDays - Days of full backups the limit would hold.
 * @param props.storageUsed    - Bytes of backup storage in use.
 * @param props.storageLimit   - The plan's storage limit in bytes.
 * @return The trigger and its popup.
 */
export default function StorageHelpPopover( { forecastInDays, storageUsed, storageLimit }: Props ) {
	const site = useSiteSuffix();
	const analytics = useAnalytics();
	const { slug } = useStorageAddonOffer( storageUsed, storageLimit );

	const recordClick = useCallback( () => {
		// Its own event name: the two CTAs answer different questions and legacy counts
		// them separately. The `undefined` arm is as in `addon-upsell.tsx`.
		analytics.tracks.recordEvent(
			'jetpack_backup_upgrade_storage_prompt_from_popover_cta',
			site ? { site } : undefined
		);
	}, [ analytics, site ] );

	// No slug or no site slug, no link — the bug this replaces is exactly the one where
	// a missing half was interpolated anyway.
	const href = slug !== null && site !== undefined ? storageAddonCheckoutUrl( slug, site ) : null;

	const forecast = sprintf(
		/* translators: %d: is number of days of the forecast */
		_n(
			'Based on the current size of your site, Jetpack will save <strong>%d day of full backup</strong>.',
			'Based on the current size of your site, Jetpack will save <strong>%d days of full backups</strong>.',
			forecastInDays,
			'jetpack-backup-pkg'
		),
		forecastInDays
	);

	const advice = __(
		'If you need more backup days, try <link>reducing the backup size</link> or adding more storage.',
		'jetpack-backup-pkg'
	);

	// The same string labels the trigger and titles the popup, so the accessible name
	// contains the visible label (WCAG 2.5.3) and the announcement is the same before
	// and after opening.
	const heading = __( 'Backup archive size', 'jetpack-backup-pkg' );

	return (
		<Popover.Root>
			{ /*
			 * A labelled button rather than a bare `ⓘ`. This renders at the one usage
			 * level where nothing else on screen suggests storage is worth a thought,
			 * so a glyph with no words beside it reads as decoration and goes
			 * unopened. `Button` with `Button.Icon` rather than `IconButton`, which
			 * renders no text and puts its `label` in `aria-label`.
			 */ }
			<Popover.Trigger render={ <Button variant="minimal" tone="neutral" size="small" /> }>
				<Button.Icon icon={ info } />
				{ heading }
			</Popover.Trigger>
			<Popover.Popup className="jpb-storage-space__help-popup">
				<Stack direction="column" gap="sm" align="start">
					{ /*
					 * Required, not decoration: `Popover.Popup` is `aria-labelledby`
					 * this. Left at the design system's own element and variant
					 * rather than the section's heading scale — the popup is
					 * portalled out and announced as a dialog.
					 */ }
					<Popover.Title>{ heading }</Popover.Title>
					<Popover.Description>
						{ createInterpolateElement( forecast, { strong: <strong /> } ) }
					</Popover.Description>
					<Text variant="body-sm">
						{ createInterpolateElement( advice, {
							link: <Link openInNewTab href={ REDUCE_SIZE_URL } />,
						} ) }
					</Text>
					{ href && (
						<LinkButton variant="solid" size="compact" href={ href } onClick={ recordClick }>
							{ __( 'Add more storage', 'jetpack-backup-pkg' ) }
						</LinkButton>
					) }
				</Stack>
			</Popover.Popup>
		</Popover.Root>
	);
}
