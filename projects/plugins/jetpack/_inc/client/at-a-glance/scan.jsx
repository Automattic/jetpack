import restApi from '@automattic/jetpack-api';
import { getRedirectUrl, numberFormat } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _n } from '@wordpress/i18n';
import Card from 'components/card';
import DashItem from 'components/dash-item';
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';
import JetpackBanner from 'components/jetpack-banner';
import analytics from 'lib/analytics';
import {
	getPlanClass,
	getJetpackProductUpsellByFeature,
	FEATURE_SECURITY_SCANNING_JETPACK,
} from 'lib/plans/constants';
import { get, isArray, noop } from 'lodash';
import { getProductDescriptionUrl } from 'product-descriptions/utils';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
	isFetchingVaultPressData,
	getVaultPressScanThreatCount,
	getVaultPressData,
} from 'state/at-a-glance';
import {
	hasConnectedOwner as hasConnectedOwnerSelector,
	isOfflineMode,
	connectUser,
} from 'state/connection';
import { isAtomicSite, showBackups } from 'state/initial-state';
import { getScanStatus, isFetchingScanStatus } from 'state/scan';
import { getSitePlan, isFetchingSiteData } from 'state/site';
import { isPluginInstalled } from 'state/site/plugins';

/**
 * Displays a card for Security Scan based on the props given.
 *
 * @param   {object} props - Settings to render the card.
 * @returns {object}       Security Scan card
 */
const renderCard = props => (
	<DashItem
		label={ __( 'Scan', 'jetpack' ) }
		module={ props.feature || 'scan' }
		support={ {
			text: __(
				'Your site’s files are regularly scanned for unauthorized or suspicious modifications that could compromise your security and data.',
				'jetpack'
			),
			link: getRedirectUrl( 'jetpack-support-security' ),
		} }
		className={ props.className || '' }
		status={ props.status || '' }
		pro={ true }
		overrideContent={ props.overrideContent }
	>
		{ isArray( props.content ) ? (
			props.content.map( ( el, i ) => <React.Fragment key={ i }>{ el }</React.Fragment> )
		) : (
			<p className="jp-dash-item__description">{ props.content }</p>
		) }
	</DashItem>
);

const renderActiveCard = message => {
	return renderCard( {
		className: 'jp-dash-item__is-active',
		status: 'is-working',
		content: message,
	} );
};

class DashScan extends Component {
	static propTypes = {
		siteRawUrl: PropTypes.string.isRequired,
		siteAdminUrl: PropTypes.string.isRequired,
		trackUpgradeButtonView: PropTypes.func,

		// Connected props
		vaultPressData: PropTypes.any.isRequired,
		scanThreats: PropTypes.any.isRequired,
		sitePlan: PropTypes.object.isRequired,
		isOfflineMode: PropTypes.bool.isRequired,
		isVaultPressInstalled: PropTypes.bool.isRequired,
		fetchingSiteData: PropTypes.bool.isRequired,
		upgradeUrl: PropTypes.string.isRequired,
		hasConnectedOwner: PropTypes.bool.isRequired,
	};

	static defaultProps = {
		siteRawUrl: '',
		siteAdminUrl: '',
		vaultPressData: '',
		scanThreats: 0,
		sitePlan: '',
		isOfflineMode: false,
		isVaultPressInstalled: false,
		fetchingSiteData: false,
		trackUpgradeButtonView: noop,
	};

	trackScansClick = () => {
		analytics.tracks.recordJetpackClick( {
			type: 'scans-link',
			target: 'at-a-glance',
			feature: 'scans',
		} );
	};

	onActivateVaultPressClick = () => {
		analytics.tracks.recordJetpackClick( {
			type: 'activate-link',
			target: 'at-a-glance',
			feature: 'vaultpress',
		} );

		this.props.createNotice( 'is-info', __( 'Activating VaultPress…', 'jetpack' ), {
			id: 'activating-vaultpress',
		} );

		restApi
			.activateVaultPress()
			.then( () => {
				this.props.removeNotice( 'activating-vaultpress' );
				window.location.href = this.props.siteAdminUrl + 'admin.php?page=vaultpress';
			} )
			.catch( () => {
				this.props.removeNotice( 'activating-vaultpress' );
				this.props.createNotice( 'is-error', __( 'Could not activate VaultPress.', 'jetpack' ), {
					id: 'activate-vaultpress-failure',
				} );
			} );

		return false;
	};

	getVPContent() {
		const { vaultPressData, hasConnectedOwner } = this.props;

		// The VaultPress plugin is active but not registered, or we can't connect
		if ( vaultPressData?.code === 'not_registered' ) {
			return renderCard( {
				className: 'jp-dash-item__is-inactive',
				status: 'not-registered',
				content: createInterpolateElement(
					__(
						'VaultPress is having difficulties scanning. Please make sure your <keyLink>registration key is entered</keyLink>. If you require further assistance please <supportLink>contact support</supportLink>.',
						'jetpack'
					),
					{
						keyLink: <a href={ this.props.siteAdminUrl + 'admin.php?page=vaultpress' } />,
						supportLink: <a href={ getRedirectUrl( 'vaultpress-help' ) } />,
					}
				),
			} );
		}

		// The VaultPress plugin is active and we received scanning data
		const scanEnabled = get( vaultPressData, [ 'data', 'features', 'security' ], false );
		if ( scanEnabled ) {
			const threats = this.props.scanThreats;

			// We found threats, so report them
			if ( threats !== 0 ) {
				return this.renderThreatsFound( threats, getRedirectUrl( 'vaultpress-dashboard' ) );
			}

			// No threats; all good
			if ( vaultPressData.code === 'success' ) {
				return renderCard( {
					status: 'is-working',
					content: __( "No threats found, you're good to go!", 'jetpack' ),
				} );
			}
		}

		// At this point, either the plugin isn't active/installed, or we're not receiving scan data.
		// We need to know this site's current plan for decision-making past this point.
		if ( this.props.fetchingSiteData ) {
			return renderCard( {
				content: __( 'Loading…', 'jetpack' ),
			} );
		}

		const hasSitePlan = this.props.sitePlan !== false;
		const scanningIncludedInPlan = [ 'is-premium-plan', 'is-business-plan' ].includes(
			this.props.planClass
		);

		// If this site doesn't have scanning services as part of its plan,
		// or if it has no plan, give the user a chance to upgrade
		if ( ! hasSitePlan || ! scanningIncludedInPlan ) {
			return renderCard( {
				className: 'jp-dash-item__is-inactive',
				status: 'no-pro-uninstalled-or-inactive',
				overrideContent: hasConnectedOwner ? this.getUpgradeBanner() : this.getConnectBanner(),
			} );
		}

		// VaultPress is installed, just not activated
		if ( this.props.isVaultPressInstalled ) {
			return renderCard( {
				className: 'jp-dash-item__is-inactive',
				status: 'pro-inactive',
				content: [
					<p className="jp-dash-item__description" key="inactive-scanning">
						{ createInterpolateElement(
							__(
								'VaultPress is not active, <a>please activate</a> to enable automatic scanning for security for threats.',
								'jetpack'
							),
							{
								a: <a href="javascript:void(0)" onClick={ this.onActivateVaultPressClick } />,
							}
						) }
					</p>,
				],
			} );
		}

		// By the process of elimination, we can assume now
		// that VaultPress isn't installed at all
		return renderCard( {
			className: 'jp-dash-item__is-inactive',
			status: 'pro-uninstalled',
			content: [
				<p className="jp-dash-item__description" key="inactive-scanning">
					{ createInterpolateElement(
						__(
							'VaultPress is not installed, <a>please install</a> to enable automatic scanning for security for threats.',
							'jetpack'
						),
						{
							a: (
								<a
									href={ getRedirectUrl( 'calypso-plugins-vaultpress' ) }
									target="_blank"
									rel="noopener noreferrer"
								/>
							),
						}
					) }
				</p>,
			],
		} );
	}

	getUpgradeBanner() {
		return (
			<JetpackBanner
				callToAction={ __( 'Upgrade', 'jetpack' ) }
				title={ __(
					'Purchase Jetpack Scan to protect your site from security threats with automated scanning.',
					'jetpack'
				) }
				disableHref="false"
				href={ this.props.upgradeUrl }
				eventFeature="scan"
				path="dashboard"
				plan={ getJetpackProductUpsellByFeature( FEATURE_SECURITY_SCANNING_JETPACK ) }
				trackBannerDisplay={ this.props.trackUpgradeButtonView }
			/>
		);
	}

	getConnectBanner() {
		return (
			<JetpackBanner
				callToAction={ __( 'Connect', 'jetpack' ) }
				title={ __(
					'Connect your WordPress.com account to upgrade to Jetpack Scan and protect your site from security threats with automated scanning.',
					'jetpack'
				) }
				disableHref="false"
				onClick={ this.props.connectUser }
				eventFeature="scan"
				path="dashboard"
				plan={ getJetpackProductUpsellByFeature( FEATURE_SECURITY_SCANNING_JETPACK ) }
			/>
		);
	}

	renderAction( url, message ) {
		if ( this.props.isAtomicSite ) {
			return null;
		}

		return (
			<Card
				compact
				key="manage-scan"
				className="jp-dash-item__manage-in-wpcom"
				href={ url }
				target="_blank"
				rel="noopener noreferrer"
				onClick={ this.trackScansClick }
			>
				{ message }
			</Card>
		);
	}

	renderThreatsFound( numberOfThreats, dashboardUrl ) {
		return (
			<>
				{ renderActiveCard( [
					<h2 className="jp-dash-item__count is-alert">{ numberFormat( numberOfThreats ) }</h2>,
					<p className="jp-dash-item__description">
						{ createInterpolateElement(
							_n(
								'Security threat found. <a>Click here</a> to fix them immediately.',
								'Security threats found. <a>Click here</a> to fix them immediately.',
								numberOfThreats,
								'jetpack'
							),
							{
								a: <a href={ dashboardUrl } target="_blank" rel="noopener noreferrer" />,
							}
						) }
					</p>,
				] ) }
				{ this.renderAction( dashboardUrl, __( 'View security scan details', 'jetpack' ) ) }
			</>
		);
	}

	getRewindContent() {
		const { scanStatus, siteRawUrl } = this.props;

		const scanDashboardUrl = getRedirectUrl( 'calypso-scanner', {
			site: siteRawUrl,
		} );

		if ( Array.isArray( scanStatus.threats ) && scanStatus.threats.length > 0 ) {
			return this.renderThreatsFound( scanStatus.threats.length, scanDashboardUrl );
		}

		if ( scanStatus.credentials && scanStatus.credentials.length === 0 ) {
			return (
				<>
					{ renderActiveCard(
						__( 'Add SSH, SFTP, or FTP credentials to enable one-click fixes', 'jetpack' )
					) }
					{ this.renderAction(
						getRedirectUrl( 'jetpack-scan-dash-credentials', { site: siteRawUrl } ),
						__( 'Enter credentials', 'jetpack' )
					) }
				</>
			);
		}

		switch ( scanStatus.state ) {
			case 'provisioning':
				return (
					<>{ renderActiveCard( __( 'We are configuring your site protection.', 'jetpack' ) ) }</>
				);
			case 'idle':
			case 'scanning':
				return (
					<>
						{ renderActiveCard(
							__(
								'No security threats found. Your site will continue to be monitored for future threats.',
								'jetpack'
							)
						) }
						{ this.renderAction(
							getRedirectUrl( 'calypso-scanner', { site: siteRawUrl } ),
							__( 'View security scan details', 'jetpack' )
						) }
					</>
				);
		}

		return false;
	}

	getUpgradeContent() {
		const { hasConnectedOwner } = this.props;

		return renderCard( {
			className: 'jp-dash-item__is-inactive',
			overrideContent: hasConnectedOwner ? this.getUpgradeBanner() : this.getConnectBanner(),
		} );
	}

	getContent() {
		const { scanStatus } = this.props;

		// If we have Rewind scan data, show information for that
		if ( scanStatus.state && scanStatus.state !== 'unavailable' ) {
			return <div className="jp-dash-item">{ this.getRewindContent() }</div>;
		}

		// If we're using VaultPress, Rewind will report that VaultPress is active;
		// show VaultPress-specific content here if that's the case.
		if ( scanStatus.reason === 'vp_active_on_site' ) {
			return this.getVPContent();
		}

		// Otherwise, give people the opportunity to add Scan to their site
		return this.getUpgradeContent();
	}

	render() {
		if ( ! this.props.showBackups ) {
			return null;
		}

		if ( this.props.isOfflineMode ) {
			return renderCard( {
				className: 'jp-dash-item__is-inactive',
				content: __( 'Unavailable in Offline Mode.', 'jetpack' ),
			} );
		}

		// Wait until we know everything about the site's VaultPress/Rewind scan
		// status before showing any "real" content

		// ASSUMPTION: QueryVaultPressData and QueryScanStatus have been invoked
		//             elsewhere on the page.
		const isLoading = this.props.fetchingScanStatus || this.props.fetchingVaultPressData;
		return (
			<div>
				{ isLoading ? renderCard( { content: __( 'Loading…', 'jetpack' ) } ) : this.getContent() }
			</div>
		);
	}
}

export default connect(
	state => {
		const sitePlan = getSitePlan( state );

		return {
			isAtomicSite: isAtomicSite( state ),
			isOfflineMode: isOfflineMode( state ),
			scanStatus: getScanStatus( state ),
			fetchingScanStatus: isFetchingScanStatus( state ),
			isVaultPressInstalled: isPluginInstalled( state, 'vaultpress/vaultpress.php' ),
			fetchingVaultPressData: isFetchingVaultPressData( state ),
			vaultPressData: getVaultPressData( state ),
			scanThreats: getVaultPressScanThreatCount( state ),
			fetchingSiteData: isFetchingSiteData( state ),
			sitePlan,
			planClass: getPlanClass( get( sitePlan, 'product_slug', '' ) ),
			showBackups: showBackups( state ),
			upgradeUrl: getProductDescriptionUrl( state, 'scan' ),
			hasConnectedOwner: hasConnectedOwnerSelector( state ),
		};
	},
	dispatch => ( {
		createNotice,
		removeNotice,
		connectUser: () => {
			return dispatch( connectUser() );
		},
	} )
)( DashScan );
