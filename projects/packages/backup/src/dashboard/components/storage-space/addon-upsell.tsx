import { formatCurrency } from '@automattic/number-formatters';
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { LinkButton, Notice } from '@wordpress/ui';
import { StorageUsageLevels } from '../../data/storage-usage-levels';
import { useAnalytics } from '../../hooks/use-analytics';
import { useSiteSuffix } from '../../hooks/use-connection';
import { useStorageAddonOffer } from '../../hooks/use-storage-addon-offer';
import { storageAddonCheckoutUrl } from './checkout-url';
import type { StorageUsageLevelName } from '../../data/storage-usage-levels';
import type { ReactNode } from 'react';

/**
 * The notice's title and body for a level, or null when the level has nothing to say.
 *
 * `Full` and `BackupsDiscarded` keep their legacy sentences where they exist. The
 * "add N of storage" half is left out when the offer has not arrived, so the notice
 * never promises a size it cannot name.
 *
 * @param usageLevel              - Derived level, or null when it could not be computed.
 * @param daysOfBackupsSaved      - Days of history actually held.
 * @param minDaysOfBackupsAllowed - Fewest days the plan will ever keep.
 * @param sizeText                - The add-on's size as WordPress.com words it, or null.
 * @return The copy, or null.
 */
function noticeCopy(
	usageLevel: StorageUsageLevelName | null,
	daysOfBackupsSaved: number | null,
	minDaysOfBackupsAllowed: number | null,
	sizeText: string | null
): { title?: string; body: string } | null {
	if ( usageLevel === StorageUsageLevels.Warning || usageLevel === StorageUsageLevels.Critical ) {
		const body =
			sizeText === null
				? __(
						'Once you do, we will delete your oldest backups to make space for new ones.',
						'jetpack-backup-pkg'
					)
				: sprintf(
						/* translators: %s is a storage size such as 10GB. */
						__(
							'Once you do, we will delete your oldest backups to make space for new ones. Upgrade to add additional %s of storage.',
							'jetpack-backup-pkg'
						),
						sizeText
					);
		return {
			title: __( 'You are close to reaching your storage limit', 'jetpack-backup-pkg' ),
			body,
		};
	}

	if ( usageLevel === StorageUsageLevels.Full ) {
		const body =
			sizeText === null
				? __(
						'Backups have been stopped. Please upgrade your storage to resume backups.',
						'jetpack-backup-pkg'
					)
				: sprintf(
						/* translators: %s is a storage size such as 10GB. */
						__(
							'Backups have been stopped. Please upgrade to add additional %s of storage and resume backups.',
							'jetpack-backup-pkg'
						),
						sizeText
					);

		if ( daysOfBackupsSaved === null ) {
			return { title: __( 'You have reached your storage limit', 'jetpack-backup-pkg' ), body };
		}

		return {
			title: sprintf(
				/* translators: %d is a number greater than 0 that means a number of days. */
				_n(
					'You have reached your storage limit with %d day of backup saved',
					'You have reached your storage limit with %d days of backup saved',
					daysOfBackupsSaved,
					'jetpack-backup-pkg'
				),
				daysOfBackupsSaved
			),
			body,
		};
	}

	if ( usageLevel === StorageUsageLevels.BackupsDiscarded && minDaysOfBackupsAllowed !== null ) {
		return {
			body: sprintf(
				/* translators: %s is a number greater than 0 that means a number of days. */
				__(
					'We removed your oldest backup(s) to make space for new ones. We will continue to remove old backups as needed, up to the last %s days.',
					'jetpack-backup-pkg'
				),
				String( minDaysOfBackupsAllowed )
			),
		};
	}

	return null;
}

/**
 * The retention dialog's purchase label: how much storage, at what price, on what terms.
 *
 * Legacy's msgid, reused so it arrives translated. Its `<Price />` token now carries
 * the finished string `formatCurrency` returns rather than the split-out symbol,
 * integer and fraction `PricingCard` wanted.
 *
 * Never a written currency symbol: `formatCurrency` places the right one for
 * `currencyCode`, which WordPress.com chooses from where the site appears to be.
 *
 * Returned as one element: the button is a flex container, so an interpolated
 * price left bare becomes its own flex item, with the button's gap either side.
 *
 * @param sizeText     - The add-on's size as WordPress.com words it, e.g. `100GB`.
 * @param monthlyPrice - One month of the add-on.
 * @param currencyCode - The currency WordPress.com priced it in.
 * @return The label.
 */
export function offerLabel(
	sizeText: string,
	monthlyPrice: number,
	currencyCode: string
): ReactNode {
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
	/** Present only for a dismissible level. */
	onDismiss?: () => void;
};

/**
 * The notice that storage is running out, with an "Upgrade now" link to checkout.
 *
 * The copy renders on the level alone, so a failed `/addon-offer` request still warns;
 * only the link and the add-on size depend on it.
 *
 * @param props                         - Component props.
 * @param props.usageLevel              - Derived level driving the wording and intent.
 * @param props.storageUsed             - Bytes of backup storage in use.
 * @param props.storageLimit            - The plan's storage limit in bytes.
 * @param props.daysOfBackupsSaved      - Days of history held, or null when unreported.
 * @param props.minDaysOfBackupsAllowed - Fewest days the plan will ever keep, or null.
 * @param props.onDismiss               - Closes the notice; omit for a level that cannot close.
 * @return The notice, or null when this level has nothing to say.
 */
export default function StorageAddonUpsell( {
	usageLevel,
	storageUsed,
	storageLimit,
	daysOfBackupsSaved,
	minDaysOfBackupsAllowed,
	onDismiss,
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

	const copy = noticeCopy( usageLevel, daysOfBackupsSaved, minDaysOfBackupsAllowed, sizeText );

	if ( ! copy ) {
		return null;
	}

	// Priced or no link: a slug missing from the catalogue arrives with an empty pricing block.
	const href =
		slug !== null && monthlyPrice !== null && currencyCode !== null && site !== undefined
			? storageAddonCheckoutUrl( slug, site )
			: null;
	const isWarning =
		usageLevel === StorageUsageLevels.Warning || usageLevel === StorageUsageLevels.Critical;

	return (
		<Notice.Root
			intent={ isWarning ? 'warning' : 'error' }
			className="jpb-storage-notice"
			spokenMessage={ [ copy.title, copy.body ].filter( Boolean ).join( ' ' ) }
		>
			{ copy.title && <Notice.Title>{ copy.title }</Notice.Title> }
			<Notice.Description>{ copy.body }</Notice.Description>
			{ href && (
				<Notice.Actions>
					<LinkButton variant="solid" size="compact" href={ href } onClick={ recordClick }>
						{ __( 'Upgrade now', 'jetpack-backup-pkg' ) }
					</LinkButton>
				</Notice.Actions>
			) }
			{ onDismiss && <Notice.CloseIcon onClick={ onDismiss } /> }
		</Notice.Root>
	);
}
