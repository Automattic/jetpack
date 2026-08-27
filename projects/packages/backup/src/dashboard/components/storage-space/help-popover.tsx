import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { info } from '@wordpress/icons';
import { IconButton, Link, LinkButton, Popover, Stack, Text } from '@wordpress/ui';
import { useAnalytics } from '../../hooks/use-analytics';
import { useSiteSuffix } from '../../hooks/use-connection';
import { useStorageAddonOffer } from '../../hooks/use-storage-addon-offer';
import { storageAddonCheckoutUrl } from './checkout-url';

/**
 * Where "reducing the backup size" goes.
 *
 * A jetpack.com support anchor rather than a redirect slug, which is
 * what legacy links to. Left as the literal URL for that reason: the
 * redirect service has no slug pointing at this fragment, and inventing
 * one here would point somewhere else.
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
 * Answers the question the meter raises but cannot itself answer: at the
 * size this site's backups actually are, how many days of them fit in
 * the plan's storage. Shown only where that number is lower than the
 * retention the plan promises — the section decides that, and passes a
 * forecast only when it is worth reading.
 *
 * Two departures from legacy, both deliberate.
 *
 * The checkout link is built from an offer this component asks for
 * itself. Legacy reads the slug from a store slot that only its *upsell*
 * ever fills, and the upsell renders only above `Normal` while this
 * renders only at `Normal` — so the two never coexist and the slot holds
 * its `null` default every time this link is drawn, producing a checkout
 * path with the literal string `null` where the product should be.
 * Sharing `useStorageAddonOffer` makes the dependency real; React Query
 * keys the answer on the same two figures, so the upsell and this cost
 * one request between them rather than two.
 *
 * It opens closed. Legacy opens it automatically the first time a
 * browser ever loads the dashboard and remembers the dismissal in
 * `localStorage`. Under `@wordpress/ui` that would move keyboard focus
 * into a popup nobody asked for, on page load — `Popover.Popup` takes
 * focus when it opens — and the latch is per-browser rather than per
 * reader, so a shared machine shows it to exactly one person. The button
 * is the affordance; it does not need to open itself.
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
		// On the click, like the section's own upsell, and under its own
		// event name: the two CTAs answer different questions and legacy
		// counts them separately. The `undefined` arm is unreachable for
		// the same reason it is there — see `addon-upsell.tsx`.
		analytics.tracks.recordEvent(
			'jetpack_backup_upgrade_storage_prompt_from_popover_cta',
			site ? { site } : undefined
		);
	}, [ analytics, site ] );

	// No slug or no site slug, no link. Both are half of a checkout URL,
	// and the bug this replaces is exactly the one where a missing half
	// was interpolated anyway.
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

	// The same string labels the trigger and titles the popup, which is
	// legacy's arrangement and the right one: the button's accessible
	// name is what a screen reader announces before the popup opens, and
	// the title is what it announces after.
	const heading = __( 'Backup archive size', 'jetpack-backup-pkg' );

	return (
		<Popover.Root>
			<Popover.Trigger
				render={
					<IconButton
						icon={ info }
						label={ heading }
						variant="minimal"
						tone="neutral"
						size="small"
					/>
				}
			/>
			<Popover.Popup className="jpb-storage-space__help-popup">
				<Stack direction="column" gap="sm" align="start">
					{ /*
					 * Required by the primitive, not optional decoration:
					 * `Popover.Popup` is `aria-labelledby` this, so without
					 * it the popup opens with no accessible name. Left at
					 * the design system's own element and variant — an `h2`
					 * in `heading-xl`, the same as `Dialog` — rather than
					 * matched to the section's heading scale. It is not part
					 * of the page outline to match: the popup is portalled
					 * out of this section and announced as a dialog.
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
