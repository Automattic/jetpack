import { getRedirectUrl } from '@automattic/jetpack-components';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, _x, sprintf } from '@wordpress/i18n';
import { Link, Text } from '@wordpress/ui';
import gridiconsModule from 'gridicons';
import PropTypes from 'prop-types';
import { PRODUCT_STATUSES } from '../../../constants';
import {
	REST_API_LATEST_BACKUP_ENDPOINT,
	QUERY_LATEST_BACKUP_KEY,
	PRODUCT_SLUGS,
} from '../../../data/constants';
import useProduct from '../../../data/products/use-product';
import useSimpleQuery from '../../../data/use-simple-query';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import useGetReadableFailedBackupReason from '../../../hooks/use-notification-watcher/use-get-readable-failed-backup-reason';
import ProductCard from '../../connected-product-card';
import { InfoTooltip } from '../../info-tooltip';
import LoadingBlock from '../../loading-block';
import styles from './style.module.scss';

// gridicons is CJS-only: esbuild applies Node's ESM interop and hands over the whole
// module.exports, while webpack unwraps the Babel `__esModule` default for us.
const Gridicon = gridiconsModule.default ?? gridiconsModule;

const productSlug = PRODUCT_SLUGS.BACKUP;

export const getTimeSinceLastRenewableEvent = lastRewindableEventTime => {
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

	// The module only switches the dashboard, so a plan holder's backups keep running with it off.
	const isModuleOff = status === PRODUCT_STATUSES.MODULE_DISABLED;

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
			Description={ ( isError || isDeactivated || isModuleOff ) && noDescription }
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
			{ isModuleOff && (
				<div className={ styles.backupErrorContainer }>
					<div className={ styles.contentContainer }>
						<Text variant="body-sm">
							{ __(
								'Your backups are still running. Activate Backup to browse and restore them from your WordPress dashboard.',
								'jetpack-my-jetpack'
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

/**
 * A time in the site's own date and time formats and timezone.
 *
 * @param {string} time - An ISO 8601 time.
 * @return {string} The formatted date and time.
 */
const formatBackupTime = time => {
	const { formats } = getDateSettings();
	return sprintf(
		/* translators: 1: a date, 2: a time of day. */
		_x( '%1$s %2$s', 'date and time', 'jetpack-my-jetpack' ),
		dateI18n( formats.date, time ),
		dateI18n( formats.time, time )
	);
};

const WithBackupsValueSection = props => {
	const { data, isLoading, isError } = useSimpleQuery( {
		name: QUERY_LATEST_BACKUP_KEY,
		query: {
			path: REST_API_LATEST_BACKUP_ENDPOINT,
		},
	} );
	const lastBackupTime = data?.last_backup_time;

	let statusText = null;
	if ( data?.is_backing_up ) {
		statusText = __( 'Backing up now…', 'jetpack-my-jetpack' );
	} else if ( ! lastBackupTime ) {
		statusText = __( 'Waiting on first backup', 'jetpack-my-jetpack' );
	}

	const WithBackupsDescription = () => (
		<Text variant="body-sm" className={ styles.description }>
			{ statusText && <span>{ statusText }</span> }
			{ lastBackupTime && (
				<span className={ statusText ? styles.time : undefined }>
					{ sprintf(
						/* translators: %s: The date and time of the last backup. */
						__( 'Last backup: %s', 'jetpack-my-jetpack' ),
						formatBackupTime( lastBackupTime )
					) }
				</span>
			) }
		</Text>
	);

	return (
		<ProductCard
			{ ...props }
			showMenu
			isDataLoading={ isLoading }
			Description={ data && ! isError ? WithBackupsDescription : null }
		/>
	);
};

BackupCard.propTypes = {
	admin: PropTypes.bool,
};

export default BackupCard;
