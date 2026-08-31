import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Link, Text } from '@wordpress/ui';
import Gridicon from 'gridicons';
import PropTypes from 'prop-types';
import { PRODUCT_STATUSES } from '../../../constants';
import {
	REST_API_REWINDABLE_BACKUP_EVENTS_ENDPOINT,
	QUERY_BACKUP_HISTORY_KEY,
	PRODUCT_SLUGS,
} from '../../../data/constants';
import useProduct from '../../../data/products/use-product';
import useSimpleQuery from '../../../data/use-simple-query';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../../hooks/use-analytics';
import useGetReadableFailedBackupReason from '../../../hooks/use-notification-watcher/use-get-readable-failed-backup-reason';
import ProductCard from '../../connected-product-card';
import { InfoTooltip } from '../../info-tooltip';
import LoadingBlock from '../../loading-block';
import styles from './style.module.scss';

const productSlug = PRODUCT_SLUGS.BACKUP;

const getTimeSinceLastRenewableEvent = lastRewindableEventTime => {
	if ( ! lastRewindableEventTime ) {
		return '';
	}

	const now = new Date();
	const lastRewindableEventDate = new Date( lastRewindableEventTime );
	const timeSinceLastRenewableEvent = now - lastRewindableEventDate;

	if ( timeSinceLastRenewableEvent > 0 ) {
		const days = Math.floor( timeSinceLastRenewableEvent / ( 1000 * 60 * 60 * 24 ) );
		const hours = Math.floor(
			( timeSinceLastRenewableEvent % ( 1000 * 60 * 60 * 24 ) ) / ( 1000 * 60 * 60 )
		);
		const minutes = Math.floor(
			( timeSinceLastRenewableEvent % ( 1000 * 60 * 60 ) ) / ( 1000 * 60 )
		);
		const seconds = Math.floor( ( timeSinceLastRenewableEvent % ( 1000 * 60 ) ) / 1000 );

		if ( days > 0 ) {
			return sprintf(
				// translators: %s is the number of days since the last backup
				_n( '%s day ago', '%s days ago', days, 'jetpack-my-jetpack' ),
				days
			);
		}

		if ( hours > 0 ) {
			return sprintf(
				// translators: %s is the number of hours since the last backup
				_n( '%s hour ago', '%s hours ago', hours, 'jetpack-my-jetpack' ),
				hours
			);
		}

		if ( minutes > 0 ) {
			return sprintf(
				// translators: %s is the number of minutes since the last backup
				_n( '%s minute ago', '%s minutes ago', minutes, 'jetpack-my-jetpack' ),
				minutes
			);
		}

		return sprintf(
			// translators: %s is the number of seconds since the last backup
			_n( '%s second ago', '%s seconds ago', seconds, 'jetpack-my-jetpack' ),
			seconds
		);
	}
};

const BackupCard = props => {
	const { detail } = useProduct( productSlug );
	const { status, doesModuleNeedAttention } = detail;
	const lastBackupFailed = !! doesModuleNeedAttention;
	const lastBackupStatus = doesModuleNeedAttention?.data?.status || '';
	const hasBackups = status === PRODUCT_STATUSES.ACTIVE || status === PRODUCT_STATUSES.CAN_UPGRADE;
	const noDescription = () => null;
	const { siteUrl = '' } = getMyJetpackWindowInitialState();

	const { reasonContent, isLoading: isBackupFailedReasonLoading } =
		useGetReadableFailedBackupReason() || {};
	const { title: errorTitle, text: errorDescription } = reasonContent || {};

	if ( hasBackups ) {
		return <WithBackupsValueSection slug={ productSlug } { ...props } />;
	}

	// Check if backups are deactivated (INACTIVE status with info type).
	const isDeactivated =
		status === PRODUCT_STATUSES.INACTIVE && lastBackupStatus === 'backups-deactivated';

	const isError = status === PRODUCT_STATUSES.NEEDS_ATTENTION__ERROR && lastBackupFailed;

	// Build support URL with pre-filled subject and site URL
	const supportUrl = getRedirectUrl( 'jetpack-backup-support-reactivate', {
		site: siteUrl,
		query: `subject=${ encodeURIComponent(
			__( 'Please reactivate Backup on my site', 'jetpack-my-jetpack' )
		) }`,
	} );

	return (
		<ProductCard
			{ ...props }
			slug={ productSlug }
			Description={ ( isError || isDeactivated ) && noDescription }
			admin={ isDeactivated ? false : props.admin }
		>
			{ isBackupFailedReasonLoading && <LoadingBlock height="75px" width="100%" /> }
			{ isDeactivated && ! isBackupFailedReasonLoading && (
				<div className={ styles.backupErrorContainer }>
					<div className={ styles.contentContainer }>
						<Text variant="body-sm">
							{ createInterpolateElement(
								__(
									'Backup was manually turned off. Please <a>contact support</a> to reactivate it.',
									'jetpack-my-jetpack'
								),
								{
									a: <Link openInNewTab href={ supportUrl } />,
								}
							) }
						</Text>
					</div>
				</div>
			) }
			{ isError && ! isBackupFailedReasonLoading && (
				<div className={ styles.backupErrorContainer }>
					<div className={ styles.iconContainer }>
						<Gridicon icon="notice" size={ 16 } className={ styles.iconError } />
					</div>
					<div className={ styles.contentContainer }>
						<Text variant="body-sm" className="value-section__heading">
							{ __( 'The last backup attempt failed.', 'jetpack-my-jetpack' ) }
							<InfoTooltip
								tracksEventName={ 'backup_card_tooltip_open' }
								tracksEventProps={ {
									location: 'backup-error',
									status: status,
									backup_status: lastBackupStatus,
									feature: 'jetpack-backup',
								} }
								expandOnMobile={ true }
							>
								<>
									<h3>{ errorTitle }</h3>
									<p>{ errorDescription }</p>
									<p>
										{ __(
											'Check out our troubleshooting guide or contact your hosting provider to resolve the issue.',
											'jetpack-my-jetpack'
										) }
									</p>
								</>
							</InfoTooltip>
						</Text>
						<Text variant="body-sm" className={ styles.error_description }>
							{ __( 'Check out our troubleshooting guide.', 'jetpack-my-jetpack' ) }
						</Text>
					</div>
				</div>
			) }
		</ProductCard>
	);
};

const WithBackupsValueSection = props => {
	const { data, isLoading } = useSimpleQuery( {
		name: QUERY_BACKUP_HISTORY_KEY,
		query: {
			path: REST_API_REWINDABLE_BACKUP_EVENTS_ENDPOINT,
		},
	} );
	const lastRewindableEvent = data?.last_rewindable_event;
	const lastRewindableEventTime = lastRewindableEvent?.published;
	const undoBackupId = data?.undo_backup_id;
	const { recordEvent } = useAnalytics();
	const { siteSuffix = '' } = getMyJetpackWindowInitialState();

	const handleUndoClick = () => {
		recordEvent( 'jetpack_myjetpack_backup_card_undo_click', {
			product: props.slug,
			undo_backup_id: undoBackupId,
		} );
	};

	const undoAction = {
		href: getRedirectUrl( 'jetpack-backup-undo-cta', {
			path: undoBackupId,
			site: siteSuffix,
		} ),
		size: 'small',
		variant: 'primary',
		weight: 'regular',
		label: __( 'Undo', 'jetpack-my-jetpack' ),
		onClick: handleUndoClick,
		isExternalLink: true,
	};

	const WithBackupsDescription = () => (
		<Text variant="body-sm" className={ styles.description }>
			<span>{ __( 'Activity Detected', 'jetpack-my-jetpack' ) }</span>
			<span className={ styles.time }>
				{ getTimeSinceLastRenewableEvent( lastRewindableEventTime ) }
			</span>
		</Text>
	);

	return (
		<ProductCard
			{ ...props }
			showMenu
			isDataLoading={ isLoading }
			Description={ lastRewindableEvent ? WithBackupsDescription : null }
			additionalActions={ lastRewindableEvent ? [ undoAction ] : [] }
		>
			{ lastRewindableEvent ? (
				<div className={ styles.activity }>
					<Gridicon icon={ lastRewindableEvent.gridicon } size={ 24 } />
					<p className={ styles.summary }>
						{ lastRewindableEvent.summary }
						{ lastRewindableEvent.actor?.is_mcp_agent && (
							<>
								{ ' ' }
								<span className={ styles.mcpBadge }>
									{ sprintf(
										/* translators: %s: The name of the MCP client application. */
										__( 'via %s (MCP)', 'jetpack-my-jetpack' ),
										lastRewindableEvent.actor?.mcp_client ||
											lastRewindableEvent.actor?.mcp_client_name ||
											__( 'MCP client', 'jetpack-my-jetpack' )
									) }
								</span>
							</>
						) }
					</p>
				</div>
			) : null }
		</ProductCard>
	);
};

BackupCard.propTypes = {
	admin: PropTypes.bool,
};

export default BackupCard;
