import { getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { PRODUCT_STATUSES } from '../../../constants';
import {
	PRODUCT_SLUGS,
	QUERY_BACKUP_HISTORY_KEY,
	REST_API_REWINDABLE_BACKUP_EVENTS_ENDPOINT,
} from '../../../data/constants';
import useProduct from '../../../data/products/use-product';
import useSimpleQuery from '../../../data/use-simple-query';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import useGetReadableFailedBackupReason from '../../../hooks/use-notification-watcher/use-get-readable-failed-backup-reason';
import ProductOverviewItem from '../overview-item/product-item';
import { getTimeSinceLastRenewableEvent } from '.';
import type { ProductCardComponent } from '../types';

const BackupOverviewItem: ProductCardComponent = ( { admin } ) => {
	const { detail } = useProduct( PRODUCT_SLUGS.BACKUP );
	const { status, doesModuleNeedAttention } = detail || {};
	const hasBackups = status === PRODUCT_STATUSES.ACTIVE || status === PRODUCT_STATUSES.CAN_UPGRADE;
	const { data, isLoading } = useSimpleQuery< {
		last_rewindable_event?: { published?: string };
	} >( {
		name: QUERY_BACKUP_HISTORY_KEY,
		query: { path: REST_API_REWINDABLE_BACKUP_EVENTS_ENDPOINT },
		options: { enabled: hasBackups },
	} );
	const { reasonContent } = useGetReadableFailedBackupReason() || {};
	const { siteUrl = '' } = getMyJetpackWindowInitialState();

	const lastBackup = hasBackups
		? getTimeSinceLastRenewableEvent( data?.last_rewindable_event?.published )
		: undefined;
	const attention = doesModuleNeedAttention ? doesModuleNeedAttention.data : undefined;
	const isDeactivated =
		status === PRODUCT_STATUSES.INACTIVE &&
		!! attention &&
		'status' in attention &&
		attention.status === 'backups-deactivated';
	const failureReason =
		status === PRODUCT_STATUSES.NEEDS_ATTENTION__ERROR && typeof reasonContent?.title === 'string'
			? reasonContent.title
			: undefined;

	return (
		<ProductOverviewItem
			slug={ PRODUCT_SLUGS.BACKUP }
			admin={ admin }
			actionLabel={ __( 'Generate backup', 'jetpack-my-jetpack' ) }
			label={ lastBackup ? __( 'Latest backup', 'jetpack-my-jetpack' ) : undefined }
			value={ lastBackup || undefined }
			statusLabel={ failureReason }
			isLoading={ hasBackups && isLoading }
			// Only support can turn Backup back on once it was turned off, and anyone can ask them.
			action={
				isDeactivated
					? {
							label: __( 'Contact support to reactivate', 'jetpack-my-jetpack' ),
							openInNewTab: true,
							forEveryone: true,
							href: getRedirectUrl( 'jetpack-backup-support-reactivate', {
								site: siteUrl,
								query: `subject=${ encodeURIComponent(
									__( 'Please reactivate Backup on my site', 'jetpack-my-jetpack' )
								) }`,
							} ),
						}
					: undefined
			}
		/>
	);
};

export default BackupOverviewItem;
