import { Text, getRedirectUrl } from '@automattic/jetpack-components';
import { __, _n, sprintf } from '@wordpress/i18n';
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
import { useGetReadableFailedBackupReason } from '../../../hooks/use-notification-watcher/use-get-readable-failed-backup-reason';
import ProductCard from '../../connected-product-card';
import { InfoTooltip } from '../../info-tooltip';
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
	const { status: lastBackupStatus } = doesModuleNeedAttention || {};
	const hasBackups = status === PRODUCT_STATUSES.ACTIVE || status === PRODUCT_STATUSES.CAN_UPGRADE;
	const noDescription = () => null;

	const { title: errorTitle, text: errorDescription } = useGetReadableFailedBackupReason() || {};

	if ( hasBackups ) {
		return <WithBackupsValueSection slug={ productSlug } { ...props } />;
	}

	const isError = status === PRODUCT_STATUSES.NEEDS_ATTENTION__ERROR && lastBackupFailed;

	return (
		<ProductCard slug={ productSlug } Description={ isError && noDescription } { ...props }>
			{ isError && (
				<div className={ styles.backupErrorContainer }>
					<div className={ styles.iconContainer }>
						<Gridicon icon="notice" size={ 16 } className={ styles.iconError } />
					</div>
					<div className={ styles.contentContainer }>
						<Text variant="body-small" className="value-section__heading">
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
						<Text variant="body-small" className={ styles.error_description }>
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
		<Text variant="body-small" className={ styles.description }>
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
					<p className={ styles.summary }>{ lastRewindableEvent.summary }</p>
				</div>
			) : null }
		</ProductCard>
	);
};

BackupCard.propTypes = {
	admin: PropTypes.bool,
};

export default BackupCard;
