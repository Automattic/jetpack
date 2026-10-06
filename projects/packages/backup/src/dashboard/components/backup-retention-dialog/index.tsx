import { formatNumber } from '@automattic/number-formatters';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Button, Dialog, LinkButton, Notice, SelectControl, Stack } from '@wordpress/ui';
import {
	RETENTION_OPTIONS,
	isRetentionOption,
	type RetentionDays,
} from '../../data/api/backup-retention';
import { GIGABYTE, MEGABYTE, TERABYTE } from '../../data/storage-units';
import useAdminMenuWidth from '../../hooks/use-admin-menu-width';
import { useAnalytics } from '../../hooks/use-analytics';
import { useSiteSuffix } from '../../hooks/use-connection';
import { useStorageAddonOffer } from '../../hooks/use-storage-addon-offer';
import { useUpdateBackupRetention } from '../../hooks/use-update-backup-retention';
import { offerLabel } from '../storage-space/addon-upsell';
import { retentionCheckoutUrl } from '../storage-space/checkout-url';
import type { CSSProperties } from 'react';

type Props = {
	/** Days of backups WordPress.com keeps today, or null when unreported. */
	currentDays: number | null;
	/** The storage limit in bytes, add-ons included. */
	storageLimit: number;
	/** Bytes the last full backup took, or null when unreported. */
	lastBackupSize: number | null;
	/** A choice carried back from checkout, preselected over the current one. */
	initialDays?: RetentionDays;
	/** Whether checkout reported buying storage for `initialDays`. */
	storagePurchased?: boolean;
	/** Called once the dialog should go, with true when a new retention was saved. */
	onClose: ( saved: boolean ) => void;
};

/**
 * A period as the picker names it.
 *
 * @param days - One of the offered periods.
 * @return Its label.
 */
function optionLabel( days: RetentionDays ): string {
	const labels: Record< RetentionDays, string > = {
		7: __( '7 days', 'jetpack-backup-pkg' ),
		30: __( '30 days', 'jetpack-backup-pkg' ),
		120: __( '120 days', 'jetpack-backup-pkg' ),
		365: __( '1 year', 'jetpack-backup-pkg' ),
	};

	return labels[ days ];
}

const LONGEST = RETENTION_OPTIONS[ RETENTION_OPTIONS.length - 1 ];

/**
 * A byte count in the units storage is sold in, e.g. `12.4GB` or `1.5TB`; MB below 1GB.
 *
 * @param bytes - The amount.
 * @return The amount, abbreviated as legacy does.
 */
function sizeText( bytes: number ): string {
	const options = { numberFormatOptions: { maximumFractionDigits: 1 } };

	if ( bytes < GIGABYTE ) {
		return `${ formatNumber( bytes / MEGABYTE ) }MB`;
	}

	return bytes >= TERABYTE
		? `${ formatNumber( bytes / TERABYTE, options ) }TB`
		: `${ formatNumber( bytes / GIGABYTE, options ) }GB`;
}

/**
 * Picks how many days of backups WordPress.com keeps, buying storage when a choice needs it.
 *
 * @param props                  - Component props.
 * @param props.currentDays      - The retention in force.
 * @param props.storageLimit     - The storage limit in bytes.
 * @param props.lastBackupSize   - The last backup's size in bytes.
 * @param props.initialDays      - A choice carried back from checkout.
 * @param props.storagePurchased - Whether that choice's storage was bought.
 * @param props.onClose          - Callback to close the dialog.
 * @return The rendered dialog.
 */
export default function BackupRetentionDialog( {
	currentDays,
	storageLimit,
	lastBackupSize,
	initialDays,
	storagePurchased = false,
	onClose,
}: Props ) {
	const adminMenuWidth = useAdminMenuWidth();
	const site = useSiteSuffix();
	const { tracks } = useAnalytics();
	const items = useMemo(
		() =>
			RETENTION_OPTIONS.map( days => ( { label: optionLabel( days ), value: String( days ) } ) ),
		[]
	);
	const [ selected, setSelected ] = useState< RetentionDays | null >(
		() => initialDays ?? ( isRetentionOption( currentDays ) ? currentDays : null )
	);
	// The reduction awaiting confirmation, if any: lowering retention deletes older backups.
	const [ confirming, setConfirming ] = useState< RetentionDays | null >( null );
	const { mutate, isPending, isError, error } = useUpdateBackupRetention();

	const isUnchanged = selected === null || selected === currentDays;
	// With the current setting unknown, anything but the longest might shorten it.
	const isReduction =
		selected !== null && ( currentDays === null ? selected < LONGEST : selected < currentDays );
	// Calypso's estimate: every day costs one full backup.
	const spaceNeeded = selected !== null && lastBackupSize ? lastBackupSize * selected : null;
	// Only a change can need storage; buying more for the current setting is the upsell's job.
	const needsStorage = ! isUnchanged && spaceNeeded !== null && spaceNeeded > storageLimit;
	const offer = useStorageAddonOffer(
		needsStorage ? spaceNeeded : null,
		needsStorage ? storageLimit : null
	);
	const checkoutUrl =
		needsStorage && selected !== null && offer.slug && site
			? retentionCheckoutUrl( offer.slug, site, selected )
			: null;

	const save = useCallback( () => {
		if ( selected !== null ) {
			mutate( selected, { onSuccess: () => onClose( true ) } );
		}
	}, [ mutate, onClose, selected ] );

	// Only an increase applies itself: a crafted link must not be able to delete backups.
	const [ applyOnOpen ] = useState(
		() =>
			storagePurchased &&
			initialDays !== undefined &&
			currentDays !== null &&
			initialDays > currentDays &&
			spaceNeeded !== null &&
			! needsStorage
	);
	const hasApplied = useRef( false );
	useEffect( () => {
		if ( applyOnOpen && ! hasApplied.current ) {
			hasApplied.current = true;
			save();
		}
	}, [ applyOnOpen, save ] );

	const handleOpenChange = useCallback(
		( open: boolean ) => {
			// Held open mid-save, so a failure still has somewhere to be reported.
			if ( ! open && ! isPending ) {
				onClose( false );
			}
		},
		[ isPending, onClose ]
	);

	const handleSelect = useCallback( ( item: { value: string } | null ) => {
		const days = Number( item?.value );
		setSelected( isRetentionOption( days ) ? days : null );
	}, [] );

	const handleSave = useCallback( () => {
		if ( isReduction ) {
			setConfirming( selected );
		} else {
			save();
		}
	}, [ isReduction, save, selected ] );

	const handleCancel = useCallback( () => onClose( false ), [ onClose ] );
	const handleBack = useCallback( () => setConfirming( null ), [] );

	// The second click of a double-click on Save lands here, on the same button.
	const handleConfirm = useCallback(
		( event: { detail: number } ) => {
			if ( event.detail <= 1 ) {
				save();
			}
		},
		[ save ]
	);

	// The steps swap in place, so focus would otherwise stay on "Confirm change".
	const cancelRef = useRef< HTMLButtonElement >( null );
	const warningId = useId();
	useEffect( () => {
		if ( confirming !== null ) {
			cancelRef.current?.focus();
		}
	}, [ confirming ] );

	const recordPurchase = useCallback( () => {
		tracks.recordEvent( 'jetpack_backup_storage_retention_purchase_click', {
			retention_option: selected,
		} );
	}, [ selected, tracks ] );

	const purchaseLabel = __( 'Purchase and update', 'jetpack-backup-pkg' );

	const errorNotice = isError && (
		<Notice.Root intent="error">
			<Notice.Description>{ error.message }</Notice.Description>
		</Notice.Root>
	);

	return (
		<Dialog.Root open onOpenChange={ handleOpenChange }>
			<Dialog.Popup
				size="small"
				className="jpb-menu-aware-dialog"
				style={ { '--jpb-admin-menu-width': `${ adminMenuWidth }px` } as CSSProperties }
			>
				<Dialog.Header>
					<Dialog.Title>{ __( 'Days of backups saved', 'jetpack-backup-pkg' ) }</Dialog.Title>
					<Dialog.CloseIcon disabled={ isPending } />
				</Dialog.Header>
				{ confirming !== null ? (
					<Dialog.Content>
						<Stack direction="column" gap="lg">
							<Dialog.Description id={ warningId }>
								{ sprintf(
									/* translators: %d: number of days of backups that will be kept. */
									_n(
										'You are about to reduce the number of days your backups are saved. Backups older than %d day will be deleted.',
										'You are about to reduce the number of days your backups are saved. Backups older than %d days will be deleted.',
										confirming,
										'jetpack-backup-pkg'
									),
									confirming
								) }
							</Dialog.Description>
							{ errorNotice }
						</Stack>
					</Dialog.Content>
				) : (
					<Dialog.Content>
						<Stack direction="column" gap="lg">
							<Dialog.Description>
								{ __( 'Choose how many days of backups to keep.', 'jetpack-backup-pkg' ) }
							</Dialog.Description>
							<SelectControl
								label={ __( 'Keep backups for', 'jetpack-backup-pkg' ) }
								items={ items }
								value={ items.find( item => item.value === String( selected ) ) ?? null }
								onValueChange={ handleSelect }
								disabled={ isPending }
								description={
									spaceNeeded !== null
										? sprintf(
												/* translators: %1$s: estimated storage, e.g. "45.2GB". %2$s: the site's storage limit, e.g. "10GB". */
												__( 'Needs about %1$s of your %2$s.', 'jetpack-backup-pkg' ),
												sizeText( spaceNeeded ),
												sizeText( storageLimit )
											)
										: undefined
								}
							/>
							{ needsStorage && (
								<Notice.Root intent="warning">
									<Notice.Description>
										{ __(
											'You need additional storage to choose this setting.',
											'jetpack-backup-pkg'
										) }{ ' ' }
										{ offer.sizeText !== null &&
											offer.monthlyPrice !== null &&
											offer.currencyCode !== null &&
											offerLabel( offer.sizeText, offer.monthlyPrice, offer.currencyCode ) }
									</Notice.Description>
								</Notice.Root>
							) }
							{ errorNotice }
						</Stack>
					</Dialog.Content>
				) }
				<Dialog.Footer>
					{ confirming !== null ? (
						<>
							<Button
								ref={ cancelRef }
								variant="outline"
								tone="neutral"
								disabled={ isPending }
								onClick={ handleBack }
								aria-describedby={ warningId }
							>
								{ __( 'Cancel', 'jetpack-backup-pkg' ) }
							</Button>
							<Button onClick={ handleConfirm } disabled={ isPending } loading={ isPending }>
								{ __( 'Confirm change', 'jetpack-backup-pkg' ) }
							</Button>
						</>
					) : (
						<>
							{ /* A `Button` like the step above's, so going back keeps focus on Cancel. */ }
							<Button
								variant="outline"
								tone="neutral"
								disabled={ isPending }
								onClick={ handleCancel }
							>
								{ __( 'Cancel', 'jetpack-backup-pkg' ) }
							</Button>
							{ needsStorage && checkoutUrl && (
								<LinkButton href={ checkoutUrl } onClick={ recordPurchase }>
									{ purchaseLabel }
								</LinkButton>
							) }
							{ /* Held in place while the offer loads, and if it never does. */ }
							{ needsStorage && ! checkoutUrl && <Button disabled>{ purchaseLabel }</Button> }
							{ ! needsStorage && (
								<Button
									onClick={ handleSave }
									disabled={ isUnchanged || isPending }
									loading={ isPending }
								>
									{ __( 'Save', 'jetpack-backup-pkg' ) }
								</Button>
							) }
						</>
					) }
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
