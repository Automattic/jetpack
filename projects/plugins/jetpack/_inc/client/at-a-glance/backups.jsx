import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { dateI18n } from '@wordpress/date';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { Icon, backup } from '@wordpress/icons';
import Button from 'components/button';
import Card from 'components/card';
import DashItem from 'components/dash-item';
import QueryBackupUndoEvent from 'components/data/query-backup-undo-event';
import QueryVaultPressData from 'components/data/query-vaultpress-data';
import JetpackBanner from 'components/jetpack-banner';
import analytics from 'lib/analytics';
import {
	getJetpackProductUpsellByFeature,
	FEATURE_SITE_BACKUPS_JETPACK,
} from 'lib/plans/constants';
import { get, noop } from 'lodash';
import { getProductDescriptionUrl } from 'product-descriptions/utils';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
	getBackupUndoEvent,
	hasLoadedBackupUndoEvent,
	isFetchingBackupUndoEvent,
	getVaultPressData,
} from 'state/at-a-glance';
import { hasConnectedOwner, isOfflineMode, connectUser } from 'state/connection';
import { isWoASite, getPartnerCoupon, showBackups } from 'state/initial-state';
import { siteHasFeature, isFetchingSiteData } from 'state/site';
import { isPluginInstalled } from 'state/site/plugins';
import BackupGettingStarted from './backup-getting-started';
import BackupUpgrade from './backup-upgrade';

/**
 * Displays a card for Backups based on the props given.
 *
 * @param   {object} props - Settings to render the card.
 * @returns {object}       Backups card
 */
const renderCard = props => (
	<DashItem
		label={ __( 'VaultPress Backup', 'jetpack' ) }
		module={ props.feature || 'backups' }
		support={ {
			text: __(
				'VaultPress Backup allows you to easily restore or download a backup from a specific moment.',
				'jetpack'
			),
			link: getRedirectUrl( 'jetpack-support-backup' ),
		} }
		className={ props.className + ' dash-backups' }
		status={ props.status }
		pro={ true }
		overrideContent={ props.overrideContent }
	>
		<p className="jp-dash-item__description">{ props.content }</p>
	</DashItem>
);

class DashBackups extends Component {
	static propTypes = {
		siteRawUrl: PropTypes.string.isRequired,
		getOptionValue: PropTypes.func.isRequired,
		rewindStatus: PropTypes.string.isRequired,
		rewindStatusReason: PropTypes.string.isRequired,
		trackUpgradeButtonView: PropTypes.func,

		// Connected props
		vaultPressData: PropTypes.any.isRequired,
		hasBackups: PropTypes.bool.isRequired,
		hasRealTimeBackups: PropTypes.bool.isRequired,
		isOfflineMode: PropTypes.bool.isRequired,
		isVaultPressInstalled: PropTypes.bool.isRequired,
		isWoA: PropTypes.bool.isRequired,
		upgradeUrl: PropTypes.string.isRequired,
		hasConnectedOwner: PropTypes.bool.isRequired,
		backupUndoEvent: PropTypes.any.isRequired,
	};

	static defaultProps = {
		siteRawUrl: '',
		getOptionValue: noop,
		vaultPressData: '',
		isOfflineMode: false,
		isVaultPressInstalled: false,
		isWoA: false,
		rewindStatus: '',
		trackUpgradeButtonView: noop,
		backupUndoEvent: {},
	};

	trackBackupsClick = ( trackingName = 'backups-link' ) => {
		return function () {
			analytics.tracks.recordJetpackClick( {
				type: trackingName,
				target: 'at-a-glance',
				feature: 'backups',
			} );
		};
	};

	trackRedeemCouponButtonView = () => {
		const { partnerCoupon } = this.props;

		analytics.tracks.recordEvent( 'jetpack_wpa_aag_redeem_partner_coupon_button_view', {
			feature: 'backups',
			coupon_preset: partnerCoupon.preset,
		} );
	};

	getJetpackBackupBanner() {
		const { partnerCoupon, upgradeUrl, siteRawUrl, trackUpgradeButtonView } = this.props;

		if ( this.props.hasConnectedOwner ) {
			if ( partnerCoupon && 'jetpack_backup_daily' === partnerCoupon.product.slug ) {
				const checkoutUrl = getRedirectUrl( 'jetpack-plugin-partner-coupon-checkout', {
					path: partnerCoupon.product.slug,
					site: siteRawUrl,
					query: `coupon=${ partnerCoupon.coupon_code }`,
				} );

				return (
					<JetpackBanner
						callToAction={ __( 'Redeem', 'jetpack' ) }
						title={ sprintf(
							/* translators: %s: Name of a Jetpack product. */
							__(
								'Redeem your coupon and get started with %s for free the first year!',
								'jetpack'
							),
							partnerCoupon.product.title
						) }
						disableHref="false"
						href={ checkoutUrl }
						eventFeature="backups"
						path="dashboard"
						eventProps={ {
							type: 'redeem_partner_coupon',
							coupon_preset: partnerCoupon.preset,
						} }
						plan={ getJetpackProductUpsellByFeature( FEATURE_SITE_BACKUPS_JETPACK ) }
						trackBannerDisplay={ this.trackRedeemCouponButtonView }
					/>
				);
			}

			return (
				<>
					<BackupUpgrade />
					<JetpackBanner
						callToAction={ _x( 'Upgrade', 'Call to action to buy a new plan', 'jetpack' ) }
						title={ __(
							'Never worry about losing your site – automatic backups keep your content safe.',
							'jetpack'
						) }
						disableHref="false"
						href={ upgradeUrl }
						eventFeature="backups"
						path="dashboard"
						plan={ getJetpackProductUpsellByFeature( FEATURE_SITE_BACKUPS_JETPACK ) }
						trackBannerDisplay={ trackUpgradeButtonView }
					/>
				</>
			);
		}

		return (
			<JetpackBanner
				callToAction={ __( 'Connect', 'jetpack' ) }
				title={ __(
					'Connect your WordPress.com account to upgrade and get automatic backups that keep your content safe.',
					'jetpack'
				) }
				disableHref="false"
				onClick={ this.props.connectUser }
				eventFeature="backups"
				path="dashboard"
				plan={ getJetpackProductUpsellByFeature( FEATURE_SITE_BACKUPS_JETPACK ) }
			/>
		);
	}

	getVPContent() {
		const {
			hasBackups,
			isFetchingSite,
			isVaultPressInstalled,
			getOptionValue,
			siteRawUrl,
			vaultPressData,
		} = this.props;

		if ( getOptionValue( 'vaultpress' ) && 'success' === get( vaultPressData, 'code', '' ) ) {
			return renderCard( {
				className: 'jp-dash-item__is-active',
				status: 'is-working',
				content: (
					<span>
						{ get( vaultPressData, 'message', '' ) }
						&nbsp;
						{ createInterpolateElement( __( '<a>View backup details</a>.', 'jetpack' ), {
							a: (
								<a
									href={ getRedirectUrl( 'vaultpress-dashboard' ) }
									target="_blank"
									rel="noopener noreferrer"
								/>
							),
						} ) }
					</span>
				),
			} );
		}

		if ( ! isFetchingSite ) {
			// If site has a paid plan
			if ( hasBackups ) {
				return renderCard( {
					className: 'jp-dash-item__is-inactive',
					status: isVaultPressInstalled ? 'pro-inactive' : 'pro-uninstalled',
					content: createInterpolateElement(
						__(
							'To automatically back up your entire site, please <a>install and activate</a> VaultPress.',
							'jetpack'
						),
						{
							a: (
								<a
									href={ getRedirectUrl( 'calypso-plugins-setup', {
										site: siteRawUrl,
										query: 'only=backups',
									} ) }
									target="_blank"
									rel="noopener noreferrer"
								/>
							),
						}
					),
				} );
			}

			return renderCard( {
				className: 'jp-dash-item__is-inactive',
				status: 'no-pro-uninstalled-or-inactive',
				overrideContent: this.getJetpackBackupBanner(),
			} );
		}

		return this.renderLoading();
	}

	renderManageBackupsLinks() {
		const { isWoA, siteRawUrl } = this.props;
		return (
			<Card compact key="manage-backups" className="jp-dash-item__manage-in-wpcom">
				<div className="jp-dash-item__action-links">
					<ExternalLink
						href={
							isWoA
								? getRedirectUrl( 'calypso-backups', {
										site: siteRawUrl,
								  } )
								: getRedirectUrl( 'my-jetpack-manage-backup', {
										site: siteRawUrl,
								  } )
						}
						target="_blank"
						rel="noopener noreferrer"
						onClick={ this.trackBackupsClick( 'backups-link' ) }
					>
						{ __( "View your site's backups", 'jetpack' ) }
					</ExternalLink>
					<ExternalLink
						href={ getRedirectUrl( 'calypso-activity-log', {
							site: siteRawUrl,
							query: 'group=rewind',
						} ) }
						target="_blank"
						rel="noopener noreferrer"
						onClick={ this.trackBackupsClick( 'restore-points-link' ) }
					>
						{ __( 'View your most recent restore points', 'jetpack' ) }
					</ExternalLink>
				</div>
			</Card>
		);
	}

	getRewindContent() {
		const { hasRealTimeBackups, rewindStatus, siteRawUrl, backupUndoEventLoaded } = this.props;
		const buildAction = ( url, message, trackingName ) => (
			<Card
				compact
				key="manage-backups"
				className="jp-dash-item__manage-in-wpcom"
				href={ url }
				target="_blank"
				rel="noopener noreferrer"
				onClick={ this.trackBackupsClick( trackingName ) }
			>
				{ message }
			</Card>
		);
		const buildCard = message =>
			renderCard( {
				className: 'jp-dash-item__is-active',
				status: 'is-working',
				feature: 'rewind',
				content: message,
			} );

		switch ( rewindStatus ) {
			case 'provisioning':
				return (
					<React.Fragment>
						{ buildCard( __( "We are configuring your site's backups.", 'jetpack' ) ) }
					</React.Fragment>
				);
			case 'awaiting_credentials':
				return (
					<React.Fragment>
						{ buildCard(
							__(
								'Enter your SSH, SFTP or FTP credentials to enable one-click site restores and faster backups',
								'jetpack'
							)
						) }
						{ buildAction(
							getRedirectUrl( 'jetpack-backup-dash-credentials', { site: siteRawUrl } ),
							__( 'Enter credentials', 'jetpack' ),
							'enter-credentials-link'
						) }
					</React.Fragment>
				);
			case 'active': {
				if ( backupUndoEventLoaded ) {
					return this.renderUndo();
				}

				/* Avoid ternary as code minification will break translation function. :( */
				let message = __( 'We are backing up your site daily.', 'jetpack' );
				if ( hasRealTimeBackups ) {
					message = createInterpolateElement(
						__(
							'Every change you make will be backed up, in real-time, as you edit your site. <ExternalLink>Learn More</ExternalLink>',
							'jetpack'
						),
						{
							ExternalLink: (
								<ExternalLink
									href={ getRedirectUrl( 'jetpack-blog-realtime-mechanics' ) }
									target="_blank"
									rel="noopener noreferrer"
									onClick={ this.trackBackupsClick( 'realtime-learn-more-link' ) }
								></ExternalLink>
							),
						}
					);
				}

				return (
					<React.Fragment>
						{ buildCard( message ) }
						{ this.renderManageBackupsLinks() }
					</React.Fragment>
				);
			}
		}

		return false;
	}

	renderLoading() {
		return renderCard( {
			className: '',
			status: '',
			content: __( 'Loading…', 'jetpack' ),
		} );
	}

	renderFromRewindStatus() {
		if (
			this.props.hasBackups &&
			'unavailable' === this.props.rewindStatus &&
			'site_new' === this.props.rewindStatusReason
		) {
			return renderCard( {
				className: 'jp-dash-item__is-inactive',
				status: 'pro-inactive',
				content: __(
					'Your site is new and may still be preparing backup configuration.',
					'jetpack'
				),
			} );
			// this.props.rewindStatus is empty string on API error.
		} else if ( 'unavailable' === this.props.rewindStatus || '' === this.props.rewindStatus ) {
			return this.getVPContent();
		}
		return <div className="jp-dash-item">{ this.getRewindContent() }</div>;
	}

	trackUndoFeatureView() {
		analytics.tracks.recordEvent( 'jetpack_wpa_aag_backup_undo_view' );
	}

	trackUndoButtonClick() {
		analytics.tracks.recordEvent( 'jetpack_wpa_aag_backup_undo_button_click' );
	}

	renderUndo() {
		const { backupUndoEvent } = this.props;
		const {
			activityDate,
			activityTitle,
			activityDescription,
			actorName,
			actorRole,
			actorAvatarUrl,
			undoBackupId,
		} = backupUndoEvent;

		const activityDateFormatted = dateI18n( 'M jS, g:i a', activityDate );

		const message = (
			<div className="dops-card jp-dash-item__card dash-backup-undo">
				<div className="jp-dash-item__description dash-backup-undo__activity-log">
					<div className="dash-backup-undo__activity-log-date">{ activityDateFormatted }</div>
					<div className="dash-backup-undo__activity-log-action">{ activityTitle }</div>
					<div className="dash-backup-undo__activity-log-description">{ activityDescription }</div>
					<div className="dash-backup-undo__activity-log-user-meta">
						<div className="dash-backup-undo__activity-log-user-meta-avatar">
							<img
								alt={ actorName }
								src={ actorAvatarUrl ?? 'https://www.gravatar.com/avatar/0?s=96&d=mm' }
								width="30"
								height="30"
							/>
						</div>
						<div className="dash-backup-undo__activity-log-user-meta-name">
							{ actorName }
							{ actorRole && ' - ' + actorRole }
						</div>
					</div>
				</div>
				<div className="dash-backup-undo__cta">
					{ createInterpolateElement( __( '<button><icon /> Undo</button>', 'jetpack' ), {
						button: (
							<Button
								href={ getRedirectUrl( 'jetpack-backup-undo-cta', { path: undoBackupId } ) }
								primary
								target="_blank"
								onClick={ this.trackUndoButtonClick }
							/>
						),
						icon: <Icon icon={ backup } />,
					} ) }
				</div>
			</div>
		);

		this.trackUndoFeatureView();

		return (
			<>
				{ renderCard( {
					className: 'jp-dash-item__is-active',
					status: 'is-working',
					feature: 'rewind',
					overrideContent: message,
				} ) }
				{ this.renderManageBackupsLinks() }
			</>
		);
	}

	renderGettingStartedVideo() {
		if ( this.props.rewindStatus !== 'awaiting_credentials' ) {
			return null;
		}

		return <BackupGettingStarted />;
	}

	render() {
		if ( ! this.props.showBackups ) {
			return null;
		}

		if ( this.props.isOfflineMode ) {
			return (
				<div className="jp-dash-item__interior">
					{ renderCard( {
						className: 'jp-dash-item__is-inactive',
						status: 'no-pro-uninstalled-or-inactive',
						content: __( 'Unavailable in Offline Mode.', 'jetpack' ),
					} ) }
				</div>
			);
		}

		if ( this.props.isFetchingSite ) {
			this.renderLoading();
		}

		return (
			<div>
				<QueryVaultPressData />
				{ this.props.rewindStatus === 'active' && <QueryBackupUndoEvent /> }
				{ this.renderFromRewindStatus() }
				{ this.renderGettingStartedVideo() }
			</div>
		);
	}
}

export default connect(
	state => {
		return {
			vaultPressData: getVaultPressData( state ),
			isOfflineMode: isOfflineMode( state ),
			isVaultPressInstalled: isPluginInstalled( state, 'vaultpress/vaultpress.php' ),
			showBackups: showBackups( state ),
			upgradeUrl: getProductDescriptionUrl( state, 'backup' ),
			hasConnectedOwner: hasConnectedOwner( state ),
			isFetchingSite: isFetchingSiteData( state ),
			hasBackups: siteHasFeature( state, 'backups' ),
			hasRealTimeBackups: siteHasFeature( state, 'real-time-backups' ),
			partnerCoupon: getPartnerCoupon( state ),
			isWoA: isWoASite( state ),
			backupUndoEvent: getBackupUndoEvent( state ),
			backupUndoEventLoaded: hasLoadedBackupUndoEvent( state ),
			backupUndoEventIsFetching: isFetchingBackupUndoEvent( state ),
		};
	},
	dispatch => ( {
		connectUser: () => {
			return dispatch( connectUser() );
		},
	} )
)( DashBackups );
