import restApi from '@automattic/jetpack-api';
import { numberFormat } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import Card from 'components/card';
import DashItem from 'components/dash-item';
import QueryAkismetData from 'components/data/query-akismet-data';
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';
import JetpackBanner from 'components/jetpack-banner';
import analytics from 'lib/analytics';
import { getJetpackProductUpsellByFeature, FEATURE_SPAM_AKISMET_PLUS } from 'lib/plans/constants';
import { noop } from 'lodash';
import { getProductDescriptionUrl } from 'product-descriptions/utils';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getAkismetData } from 'state/at-a-glance';
import { hasConnectedOwner, isOfflineMode, connectUser } from 'state/connection';
import { getApiNonce } from 'state/initial-state';
import { siteHasFeature } from 'state/site';

class DashAkismet extends Component {
	static propTypes = {
		siteRawUrl: PropTypes.string.isRequired,
		siteAdminUrl: PropTypes.string.isRequired,
		trackUpgradeButtonView: PropTypes.func,

		// Connected props
		akismetData: PropTypes.oneOfType( [ PropTypes.string, PropTypes.object, PropTypes.number ] )
			.isRequired,
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

	trackModerateClick() {
		analytics.tracks.recordJetpackClick( {
			type: 'moderate-link',
			target: 'at-a-glance',
			feature: 'anti-spam',
		} );
	}

	onModerateClick = () => {
		this.trackModerateClick();
	};

	getContent() {
		const akismetData = this.props.akismetData;
		const labelName = __( 'Anti-spam', 'jetpack' );

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
						'Connect your Jetpack account to upgrade and automatically clear spam from comments and forms',
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
						<h2 className="jp-dash-item__count">{ numberFormat( this.props.akismetData ) }</h2>
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

		if ( ! this.props.hasAntiSpam && ! this.props.hasAkismet ) {
			if ( 'not_installed' === akismetData ) {
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

			if ( 'not_active' === akismetData ) {
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
					href={ `${ this.props.siteAdminUrl }edit-comments.php` }
					onClick={ this.onModerateClick }
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
			isOfflineMode: isOfflineMode( state ),
			upgradeUrl: getProductDescriptionUrl( state, 'akismet' ),
			nonce: getApiNonce( state ),
			hasConnectedOwner: hasConnectedOwner( state ),
			hasAntiSpam: siteHasFeature( state, 'antispam' ),
			hasAkismet: siteHasFeature( state, 'akismet' ),
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
