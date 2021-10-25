/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { get, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Card from 'components/card';
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';
import DashItem from 'components/dash-item';
import { getAkismetData } from 'state/at-a-glance';
import { getSitePlan } from 'state/site';
import { getApiNonce } from 'state/initial-state';
import { getProductDescriptionUrl } from 'product-descriptions/utils';
import { getJetpackProductUpsellByFeature, FEATURE_SPAM_AKISMET_PLUS } from 'lib/plans/constants';
import { hasConnectedOwner, isOfflineMode, connectUser } from 'state/connection';
import JetpackBanner from 'components/jetpack-banner';
import restApi from '@automattic/jetpack-api';
import QueryAkismetData from 'components/data/query-akismet-data';

class DashAkismet extends Component {
	static propTypes = {
		siteRawUrl: PropTypes.string.isRequired,
		siteAdminUrl: PropTypes.string.isRequired,
		trackUpgradeButtonView: PropTypes.func,

		// Connected props
		akismetData: PropTypes.oneOfType( [ PropTypes.string, PropTypes.object ] ).isRequired,
		isOfflineMode: PropTypes.bool.isRequired,
		upgradeUrl: PropTypes.string.isRequired,
		hasConnectedOwner: PropTypes.bool.isRequired,
	};

	static defaultProps = {
		siteRawUrl: '',
		siteAdminUrl: '',
		akismetData: 'N/A',
		isOfflineMode: '',
		trackUpgradeButtonView: noop,
	};

	trackActivateClick() {
		analytics.tracks.recordJetpackClick( {
			type: 'activate-link',
			target: 'at-a-glance',
			feature: 'anti-spam',
		} );
	}

	onActivateClick = () => {
		this.trackActivateClick();

		this.props.createNotice( 'is-info', __( 'Activating Akismet…', 'jetpack' ), {
			id: 'activating-akismet',
		} );

		restApi
			.activateAkismet()
			.then( () => {
				this.props.removeNotice( 'activating-akismet' );
				window.location.href = this.props.siteAdminUrl + 'admin.php?page=akismet-key-config';
			} )
			.catch( () => {
				this.props.removeNotice( 'activating-akismet' );
				this.props.createNotice( 'is-error', __( 'Could not activate Akismet.', 'jetpack' ), {
					id: 'activate-akismet-failure',
				} );
			} );

		return false;
	};

	getContent() {
		const akismetData = this.props.akismetData;
		const labelName = __( 'Anti-spam', 'jetpack' );
		const isSiteOnFreePlan =
			'jetpack_free' === get( this.props.sitePlan, 'product_slug', 'jetpack_free' );

		const support = {
			text: __(
				'Jetpack Anti-spam powered by Akismet. Comments and contact form submissions are checked against our global database of spam.',
				'jetpack'
			),
			link: 'https://akismet.com/',
			privacyLink: 'https://automattic.com/privacy/',
		};

		const getAkismetUpgradeBanner = () => {
			const description = createInterpolateElement(
				__( 'Already have a key? <a>Activate Akismet</a>', 'jetpack' ),
				{
					a: <a href="javascript:void(0)" onClick={ this.onActivateClick } />,
				}
			);

			return (
				<JetpackBanner
					callToAction={ __( 'Upgrade', 'jetpack' ) }
					title={ __( 'Automatically clear spam from comments and forms.', 'jetpack' ) }
					description={ description }
					disableHref="false"
					href={ this.props.upgradeUrl }
					eventFeature="akismet"
					path="dashboard"
					plan={ getJetpackProductUpsellByFeature( FEATURE_SPAM_AKISMET_PLUS ) }
					trackBannerDisplay={ this.props.trackUpgradeButtonView }
				/>
			);
		};

		const getConnectBanner = () => {
			return (
				<JetpackBanner
					callToAction={ __( 'Connect', 'jetpack' ) }
					title={ __(
						'Connect your WordPress.com account to upgrade and automatically clear spam from comments and forms',
						'jetpack'
					) }
					disableHref="false"
					onClick={ this.props.connectUser }
					eventFeature="akismet"
					path="dashboard"
					plan={ getJetpackProductUpsellByFeature( FEATURE_SPAM_AKISMET_PLUS ) }
				/>
			);
		};

		const getBanner = () => {
			if ( this.props.isOfflineMode ) {
				return (
					<DashItem
						label={ labelName }
						module="akismet"
						support={ support }
						pro={ true }
						className="jp-dash-item__is-inactive"
					>
						<p className="jp-dash-item__description">
							{ __( 'Unavailable in Offline Mode.', 'jetpack' ) }
						</p>
					</DashItem>
				);
			}

			return this.props.hasConnectedOwner ? getAkismetUpgradeBanner() : getConnectBanner();
		};

		const getAkismetCounter = () => {
			if ( '0' !== this.props.akismetData ) {
				return (
					<>
						<h2 className="jp-dash-item__count">{ this.props.akismetData }</h2>
						<p className="jp-dash-item__description">
							{ _x( 'Spam comments blocked.', 'Example: "412 Spam comments blocked"', 'jetpack' ) }
						</p>
					</>
				);
			}

			return (
				<div className="jp-dash-item__recently-activated">
					<p className="jp-dash-item__description">
						{ __(
							'Jetpack and its Anti-spam currently monitor all comments on your site. Data will display here soon!',
							'jetpack'
						) }
					</p>
				</div>
			);
		};

		if ( 'N/A' === akismetData ) {
			return (
				<DashItem label={ labelName } module="akismet" support={ support } pro={ true }>
					<p className="jp-dash-item__description">{ __( 'Loading…', 'jetpack' ) }</p>
				</DashItem>
			);
		}

		const hasSitePlan = false !== this.props.sitePlan;

		if ( isSiteOnFreePlan ) {
			if ( 'not_installed' === akismetData ) {
				return (
					<DashItem
						label={ labelName }
						module="akismet"
						support={ support }
						className="jp-dash-item__is-inactive"
						status={ hasSitePlan ? 'pro-uninstalled' : 'no-pro-uninstalled-or-inactive' }
						pro={ true }
						overrideContent={ getBanner() }
					/>
				);
			}

			if ( 'not_active' === akismetData ) {
				return (
					<DashItem
						label={ labelName }
						module="akismet"
						support={ support }
						status={ hasSitePlan ? 'pro-inactive' : 'no-pro-uninstalled-or-inactive' }
						className="jp-dash-item__is-inactive"
						pro={ true }
						overrideContent={ getBanner() }
					/>
				);
			}

			if ( 'invalid_key' === akismetData ) {
				return (
					<DashItem
						label={ labelName }
						module="akismet"
						support={ support }
						className="jp-dash-item__is-inactive"
						pro={ true }
						overrideContent={ getBanner() }
					/>
				);
			}
		}

		if ( [ 'not_installed', 'not_active', 'invalid_key' ].includes( akismetData ) ) {
			return (
				<DashItem
					label={ labelName }
					module="akismet"
					support={ support }
					className="jp-dash-item__is-inactive"
					pro={ true }
				>
					{ __(
						"Your Jetpack plan provides anti-spam protection through Akismet. Click 'set up' to enable it on your site.",
						'jetpack'
					) }
				</DashItem>
			);
		}

		return [
			<DashItem
				key="comment-moderation"
				label={ labelName }
				module="akismet"
				support={ support }
				status="is-working"
				pro={ true }
			>
				{ getAkismetCounter( akismetData ) }
			</DashItem>,
			! this.props.isOfflineMode && (
				<Card
					key="moderate-comments"
					className="jp-dash-item__manage-in-wpcom"
					compact
					href={ getRedirectUrl( 'calypso-comments-all', { site: this.props.siteRawUrl } ) }
				>
					{ __( 'Moderate comments', 'jetpack' ) }
				</Card>
			),
		];
	}

	render() {
		return (
			<div className="jp-dash-item__interior">
				<QueryAkismetData />
				{ this.getContent() }
			</div>
		);
	}
}

export default connect(
	state => {
		return {
			akismetData: getAkismetData( state ),
			sitePlan: getSitePlan( state ),
			isOfflineMode: isOfflineMode( state ),
			upgradeUrl: getProductDescriptionUrl( state, 'akismet' ),
			nonce: getApiNonce( state ),
			hasConnectedOwner: hasConnectedOwner( state ),
		};
	},
	dispatch => ( {
		createNotice,
		removeNotice,
		connectUser: () => {
			return dispatch( connectUser() );
		},
	} )
)( DashAkismet );
