import { formatCurrency } from '@automattic/number-formatters';
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { LinkButton, Stack, Text } from '@wordpress/ui';
import { StorageUsageLevels } from '../../data/storage-usage-levels';
import { useAnalytics } from '../../hooks/use-analytics';
import { useSiteSuffix } from '../../hooks/use-connection';
import { useStorageAddonOffer } from '../../hooks/use-storage-addon-offer';
import { storageAddonCheckoutUrl } from './checkout-url';
import type { StorageUsageLevelName } from '../../data/storage-usage-levels';
import type { ReactNode } from 'react';

/**
 * What has gone wrong, in the reader's terms.
 *
 * All four msgids are legacy's character for character, so they arrive translated —
 * including the "day(s)" spellings, which changing would start a fresh GlotPress cycle
 * for a line the flag-off dashboard still renders.
 *
 * The two day counts are not equally trustworthy. `BackupsDiscarded` is only ever
 * returned from a branch that guarantees one. `Full` also appears in the threshold
 * table, so a site at its limit reaches it with no day counts at all — hence two
 * sentences for that level. Legacy renders that case as "null day(s) of backups saved".
 *
 * @param usageLevel              - Derived level, or null when it could not be computed.
 * @param daysOfBackupsSaved      - Days of history actually held.
 * @param minDaysOfBackupsAllowed - Fewest days the plan will ever keep.
 * @return The line, or null when this level has nothing to say.
 */
function statusText(
	usageLevel: StorageUsageLevelName | null,
	daysOfBackupsSaved: number | null,
	minDaysOfBackupsAllowed: number | null
): string | null {
	if ( usageLevel === StorageUsageLevels.Warning ) {
		return __(
			'You are close to reaching your storage limit. Once you do, we will delete your oldest backups to make space for new ones.',
			'jetpack-backup-pkg'
		);
	}

	if ( usageLevel === StorageUsageLevels.Critical ) {
		return __(
			'You are very close to reaching your storage limit. Once you do, we will delete your oldest backups to make space for new ones.',
			'jetpack-backup-pkg'
		);
	}

	if ( usageLevel === StorageUsageLevels.Full ) {
		// Two separate `__()` calls rather than one with a ternary msgid: the minifier
		// factors a shared call out and leaves the msgid a variable, which the
		// text-domain scanner then drops silently.
		if ( daysOfBackupsSaved === null ) {
			// The one string here that is not legacy's. It earns its GlotPress cycle:
			// the alternative on this path is silence about stopped backups.
			return __(
				'You have reached your storage limit. Backups have been stopped. Please upgrade your storage to resume backups.',
				'jetpack-backup-pkg'
			);
		}

		return sprintf(
			/* translators: %s is a number greater than 0 that means a number of days. */
			__(
				'You have reached your storage limit with %s day(s) of backups saved. Backups have been stopped. Please upgrade your storage to resume backups.',
				'jetpack-backup-pkg'
			),
			String( daysOfBackupsSaved )
		);
	}

	if ( usageLevel === StorageUsageLevels.BackupsDiscarded && minDaysOfBackupsAllowed !== null ) {
		return sprintf(
			/* translators: %s is a number greater than 0 that means a number of days. */
			__(
				'We removed your oldest backup(s) to make space for new ones. We will continue to remove old backups as needed, up to the last %s days.',
				'jetpack-backup-pkg'
			),
			String( minDaysOfBackupsAllowed )
		);
	}

	return null;
}

/**
 * The button's label: how much storage, at what price, on what terms.
 *
 * Legacy's msgid, reused so it arrives translated. Its `<Price />` token now carries
 * the finished string `formatCurrency` returns rather than the split-out symbol,
 * integer and fraction `PricingCard` wanted.
 *
 * Never a written currency symbol: `formatCurrency` places the right one for
 * `currencyCode`, which WordPress.com chooses from where the site appears to be.
 *
 * Returned as one element: the button is a flex container with a gap, so an
 * interpolated price left bare becomes its own flex item with 8px either side.
 *
 * @param sizeText     - The add-on's size as WordPress.com words it, e.g. `100GB`.
 * @param monthlyPrice - One month of the add-on.
 * @param currencyCode - The currency WordPress.com priced it in.
 * @return The label.
 */
function offerLabel( sizeText: string, monthlyPrice: number, currencyCode: string ): ReactNode {
	/* translators: %1$s: Storage unit, <Price>: Additional charge. */
	const offer = __(
		'Add %1$s additional storage for <Price />/month, billed monthly',
		'jetpack-backup-pkg'
	);

	return (
		<span>
			{ createInterpolateElement( sprintf( offer, sizeText ), {
				Price: <span>{ formatCurrency( monthlyPrice, currencyCode ) }</span>,
			} ) }
		</span>
	);
}

type Props = {
	usageLevel: StorageUsageLevelName | null;
	storageUsed: number;
	storageLimit: number;
	daysOfBackupsSaved: number | null;
	minDaysOfBackupsAllowed: number | null;
};

/**
 * The offer of more storage, shown once usage leaves `Normal`.
 *
 * Two halves that fail independently, which is the one structural change from legacy:
 * legacy nests the warning inside the checkout button, so a site whose `/addon-offer`
 * request fails is told nothing at all. Here the warning renders on the level alone.
 *
 * The `Normal` gate lives in the section rather than here, so this component never
 * issues the offer request on a site with no reason to see it.
 *
 * @param props                         - Component props.
 * @param props.usageLevel              - Derived level driving the warning's wording.
 * @param props.storageUsed             - Bytes of backup storage in use.
 * @param props.storageLimit            - The plan's storage limit in bytes.
 * @param props.daysOfBackupsSaved      - Days of history held, or null when unreported.
 * @param props.minDaysOfBackupsAllowed - Fewest days the plan will ever keep, or null.
 * @return The upsell, or null when there is neither a warning nor an offer.
 */
export default function StorageAddonUpsell( {
	usageLevel,
	storageUsed,
	storageLimit,
	daysOfBackupsSaved,
	minDaysOfBackupsAllowed,
}: Props ) {
	const site = useSiteSuffix();
	const analytics = useAnalytics();
	const { slug, sizeText, monthlyPrice, currencyCode } = useStorageAddonOffer(
		storageUsed,
		storageLimit
	);

	const recordClick = useCallback( () => {
		// On the click rather than on arrival at checkout: the event measures the
		// reader deciding to buy, and there is no later moment this page sees.
		//
		// The `undefined` arm is unreachable today, and spelled anyway because the
		// alternative is a payload reporting the site as the string `undefined`.
		analytics.tracks.recordEvent(
			'jetpack_backup_upgrade_storage_prompt_cta',
			site ? { site } : undefined
		);
	}, [ analytics, site ] );

	const status = statusText( usageLevel, daysOfBackupsSaved, minDaysOfBackupsAllowed );

	// Every part or no link: a link missing any of them is malformed or dishonest.
	// Two nullable values rather than one boolean, so the checks also narrow the types.
	const href = slug !== null && site !== undefined ? storageAddonCheckoutUrl( slug, site ) : null;
	const label =
		sizeText !== null && monthlyPrice !== null && currencyCode !== null
			? offerLabel( sizeText, monthlyPrice, currencyCode )
			: null;

	if ( ! status && ! ( href && label ) ) {
		return null;
	}

	return (
		<Stack className="jpb-storage-space__upsell" direction="column" gap="xs" align="start">
			{ status && <Text variant="body-sm">{ status }</Text> }
			{ href && label && (
				<LinkButton variant="solid" size="compact" href={ href } onClick={ recordClick }>
					{ label }
				</LinkButton>
			) }
		</Stack>
	);
}
