/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { get, isEmpty, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import DashItem from 'components/dash-item';
import JetpackBanner from 'components/jetpack-banner';
import QueryVaultPressData from 'components/data/query-vaultpress-data';
import {
	getPlanClass,
	getJetpackProductUpsellByFeature,
	FEATURE_SITE_BACKUPS_JETPACK,
} from 'lib/plans/constants';
import { getProductDescriptionUrl } from 'product-descriptions/utils';
import { getSitePlan } from 'state/site';
import { isPluginInstalled } from 'state/site/plugins';
import { getVaultPressData } from 'state/at-a-glance';
import { hasConnectedOwner, isOfflineMode, connectUser } from 'state/connection';
import { showBackups } from 'state/initial-state';

/**
 * Displays a card for Backups based on the props given.
 *
 * @param   {object} props Settings to render the card.
 * @returns {object}       Backups card
 */
const renderCard = props => (
	<DashItem
		label={ __( 'Backup', 'jetpack' ) }
		module={ props.feature || 'backups' }
		support={ {
			text: __(
				'Jetpack Backups allow you to easily restore or download a backup from a specific moment.',
				'jetpack'
			),
			link: getRedirectUrl( 'jetpack-support-backup' ),
		} }
		className={ props.className }
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

		// Connected props
		vaultPressData: PropTypes.any.isRequired,
		sitePlan: PropTypes.object.isRequired,
		isOfflineMode: PropTypes.bool.isRequired,
		isVaultPressInstalled: PropTypes.bool.isRequired,
		upgradeUrl: PropTypes.string.isRequired,
		hasConnectedOwner: PropTypes.bool.isRequired,
	};

	static defaultProps = {
		siteRawUrl: '',
		getOptionValue: noop,
		vaultPressData: '',
		sitePlan: '',
		isOfflineMode: false,
		isVaultPressInstalled: false,
		rewindStatus: '',
	};

	getVPContent() {
		const {
			sitePlan,
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

		if ( ! isEmpty( sitePlan ) ) {
			// If site has a paid plan
			if ( 'jetpack_free' !== get( sitePlan, 'product_slug', 'jetpack_free' ) ) {
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
				overrideContent: this.props.hasConnectedOwner ? (
					<JetpackBanner
						callToAction={ __( 'Upgrade', 'jetpack' ) }
						title={ __(
							'Never worry about losing your site – automatic backups keep your content safe.',
							'jetpack'
						) }
						disableHref="false"
						href={ this.props.upgradeUrl }
						eventFeature="backups"
						path="dashboard"
						plan={ getJetpackProductUpsellByFeature( FEATURE_SITE_BACKUPS_JETPACK ) }
					/>
				) : (
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
				),
			} );
		}

		return renderCard( {
			className: '',
			status: '',
			content: __( 'Loading…', 'jetpack' ),
		} );
	}

	getRewindContent() {
		const { planClass, rewindStatus, siteRawUrl } = this.props;
		const buildAction = ( url, message ) => (
			<Card compact key="manage-backups" className="jp-dash-item__manage-in-wpcom" href={ url }>
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
							__( "You need to enter your server's credentials to finish the setup.", 'jetpack' )
						) }
						{ buildAction(
							getRedirectUrl( 'jetpack-backup-dash-credentials', { site: siteRawUrl } ),
							__( 'Enter credentials', 'jetpack' )
						) }
					</React.Fragment>
				);
			case 'active':
				const message = [ 'is-business-plan', 'is-realtime-backup-plan' ].includes( planClass )
					? __( 'We are backing up your site in real-time.', 'jetpack' )
					: __( 'We are backing up your site daily.', 'jetpack' );

				return (
					<React.Fragment>
						{ buildCard( message ) }
						{ buildAction(
							getRedirectUrl( 'calypso-activity-log', { site: siteRawUrl, query: 'group=rewind' } ),
							__( "View your site's backups", 'jetpack' )
						) }
					</React.Fragment>
				);
		}

		return false;
	}

	renderFromRewindStatus() {
		if (
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

		return (
			<div>
				<QueryVaultPressData />
				{ this.renderFromRewindStatus() }
			</div>
		);
	}
}

export default connect(
	state => {
		const sitePlan = getSitePlan( state );

		return {
			vaultPressData: getVaultPressData( state ),
			sitePlan,
			planClass: getPlanClass( sitePlan ),
			isOfflineMode: isOfflineMode( state ),
			isVaultPressInstalled: isPluginInstalled( state, 'vaultpress/vaultpress.php' ),
			showBackups: showBackups( state ),
			upgradeUrl: getProductDescriptionUrl( state, 'backups' ),
			hasConnectedOwner: hasConnectedOwner( state ),
		};
	},
	dispatch => ( {
		connectUser: () => {
			return dispatch( connectUser() );
		},
	} )
)( DashBackups );
