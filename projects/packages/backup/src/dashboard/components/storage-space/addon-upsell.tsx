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
 * All four msgids are legacy's, character for character
 * (`storage-addon-upsell-prompt/use-storage-status-text.js`), so they
 * arrive already translated. The "day(s)" and "backup(s)" spellings are
 * legacy's too — worse English than `_n()` would give, but changing them
 * starts a fresh GlotPress cycle for a line the flag-off dashboard is
 * still rendering today.
 *
 * `Normal` has no line, which is what makes it the level at which this
 * whole component is absent rather than silent.
 *
 * The two day counts are not equally trustworthy, and an earlier version
 * of this file wrongly said they were.
 *
 * `BackupsDiscarded` really does imply a count: it is returned from one
 * place only, inside `getUsageLevel`'s branch guarded on
 * `!! minDaysOfBackupsAllowed && !! daysOfBackupsAllowed &&
 * !! retentionDays && !! daysOfBackupsSaved`, and it is absent from the
 * threshold table that produces every other level. So its `!== null`
 * check below is unreachable, kept only because it is also what narrows
 * the type.
 *
 * `Full` implies nothing of the sort. It appears in that guarded branch
 * and *also* as `100:` in the threshold table, so any site at or over
 * its limit reaches it with no day counts at all —
 * `getUsageLevel( 100GB, 100GB, null, null, null, null )` returns
 * `'Full'`, verified. Every field of `/site/backup/size` is optional, so
 * a response carrying `size` and nothing else is enough. Hence two
 * sentences for that level rather than one: without the countless
 * fallback, a site whose backups have stopped is shown the "add more
 * storage" button with no sentence saying why, and is shown nothing at
 * all if the offer request also fails. Legacy renders this same case as
 * "null day(s) of backups saved".
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
		// Two separate `__()` calls in two `return` statements, rather
		// than one call with the msgid chosen by a ternary: the minifier
		// factors a shared call out and leaves the msgid a variable, which
		// the text-domain scanner then drops without saying so.
		if ( daysOfBackupsSaved === null ) {
			// The one string here that is not legacy's, so the one that
			// waits a GlotPress cycle. It earns that: the alternative on
			// this path is silence about stopped backups.
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
 * Legacy's msgid, reused rather than rewritten, so it arrives
 * translated. Its `<Price />` token used to carry a component that split
 * the amount into symbol, integer and fraction for `PricingCard`'s
 * layout; nothing here wants that shape, so the token now carries the
 * finished string `formatCurrency` returns. `createInterpolateElement`
 * keeps the mapped element's own children for a self-closing token —
 * verified by rendering `Add 100GB additional storage for <Price
 * />/month, billed monthly` against `<span>R$44.95</span>` — so the
 * amount survives the substitution.
 *
 * Never a written currency symbol. `formatCurrency` places the right one
 * for `currencyCode`, which WordPress.com chooses from where the site
 * appears to be: `R$44.95` for a Brazilian site, `¥1,000` for a Japanese
 * one, both verified against the installed formatter.
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

	return createInterpolateElement( sprintf( offer, sizeText ), {
		Price: <span>{ formatCurrency( monthlyPrice, currencyCode ) }</span>,
	} );
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
 * Two halves that fail independently, which is the one structural change
 * from legacy. Legacy nests the warning *inside* the checkout button, so
 * a site whose `/addon-offer` request fails is told nothing at all —
 * neither what is wrong nor what to do — on the one screen whose job is
 * to say whether backups are at risk. Here the warning is its own line
 * and renders on the level alone; the priced link renders only when the
 * offer arrives complete.
 *
 * Nothing is rendered at `Normal`. That gate lives in the section rather
 * than here, matching legacy's own `usageLevel !==
 * StorageUsageLevels.Normal` and keeping this component from issuing the
 * offer request on a site that has no reason to see it.
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
		// Recorded on the click, not on arrival at checkout — the event
		// measures the reader deciding to buy, and there is no later
		// moment this page ever sees.
		//
		// The `undefined` arm cannot be reached today: the link this fires
		// from is only drawn when the site slug is known. It is spelled
		// anyway because the alternative — `{ site }` with `site`
		// undefined — is a payload reporting the site as the string
		// `undefined`, and that is the failure mode worth making
		// impossible rather than merely unlikely. `recordEvent` reads a
		// missing properties argument as `{}`.
		analytics.tracks.recordEvent(
			'jetpack_backup_upgrade_storage_prompt_cta',
			site ? { site } : undefined
		);
	}, [ analytics, site ] );

	const status = statusText( usageLevel, daysOfBackupsSaved, minDaysOfBackupsAllowed );

	// Every part or no link. The slug names the product, the site slug is
	// half the checkout path, and the two price fields are the whole of
	// what the label promises — a link missing any of them is either
	// malformed or dishonest. Spelled as two nullable values rather than
	// one boolean so the checks are also what narrows the types.
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
