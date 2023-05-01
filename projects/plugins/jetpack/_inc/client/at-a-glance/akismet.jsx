import restApi from '@automattic/jetpack-api';
import { numberFormat } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import Button from 'components/button';
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
import { getApiNonce, isAtomicSite } from 'state/initial-state';
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
		const { akismetData, siteAdminUrl } = this.props;
		const labelName = __( 'Akismet Anti-spam', 'jetpack' );

		const support = {
			text: __(
				'Jetpack Anti-spam powered by Akismet. Comments and contact form submissions are checked against our global database of spam.',
				'jetpack'
			),
			// Hide the action link from Atomic sites because it promotes purchase of Jetpack product
			link: this.props.isAtomicSite ? null : 'https://akismet.com/',
			privacyLink: 'https://automattic.com/privacy/',
		};

		const getAkismetUpgradeBanner = () => {
			let description;

			if ( 'not_active' === akismetData ) {
				description = createInterpolateElement(
					__( 'Already have an API key? <Button>Activate Akismet Anti-spam</Button>.', 'jetpack' ),
					{
						Button: <Button className="jp-link-button" onClick={ this.onActivateClick } />,
					}
				);
			} else if ( 'invalid_key' === akismetData ) {
				description = createInterpolateElement(
					__( 'Already have an API key? <a>Get started</a>.', 'jetpack' ),
					{
						a: <a href={ siteAdminUrl + 'admin.php?page=akismet-key-config' } />,
					}
				);
			}

			return (
				<JetpackBanner
					callToAction={ _x( 'Upgrade', 'Call to action to buy a new plan', 'jetpack' ) }
					title={ __( 'Automatically clear spam from comments and forms.', 'jetpack' ) }
					description={ description }
					disableHref="false"
					href={ this.props.upgradeUrl }
					eventFeature="akismet"
					path="dashboard"
					plan={ getJetpackProductUpsellByFeature( FEATURE_SPAM_AKISMET_PLUS ) }
					trackBannerDisplay={ this.props.trackUpgradeButtonView }
					noIcon
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
			return this.props.hasConnectedOwner ? getAkismetUpgradeBanner() : getConnectBanner();
		};

		const getAkismetCounter = () => {
			if ( 0 !== this.props.akismetData ) {
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
							'Akismet is now monitoring all comments on your site. Data will display here soon!',
							'jetpack'
						) }
					</p>
				</div>
			);
		};

		// If we don't have data from Akismet yet, show a loading state.
		if ( 'N/A' === akismetData ) {
			return (
				<DashItem label={ labelName } module="akismet" support={ support } pro={ true }>
					<p className="jp-dash-item__description">{ __( 'Loading…', 'jetpack' ) }</p>
				</DashItem>
			);
		}

		// If Akismet is not installed or not configured yet, show a banner to install it.
		if ( [ 'not_installed', 'not_active', 'invalid_key' ].includes( akismetData ) ) {
			const commonProps = {
				label: labelName,
				module: 'akismet',
				support: support,
				className: 'jp-dash-item__is-inactive',
				pro: true,
			};

			// Akismet is not installed nor activated.
			if ( ! this.props.hasAntiSpam && ! this.props.hasAkismet ) {
				// In Offline Mode, we can't prompt to connect to WordPress.com
				// the site will not be able to communicate with Akismet servers,
				// and is very likely not to get any comments.
				// Akismet will not be useful for them.
				if ( this.props.isOfflineMode ) {
					return (
						<DashItem { ...commonProps }>
							<p className="jp-dash-item__description">
								{ __( 'Unavailable in Offline Mode.', 'jetpack' ) }
							</p>
						</DashItem>
					);
				}

				return <DashItem { ...commonProps } overrideContent={ getBanner() } />;
			}

			// The plugin is installed and activated, but not configured yet.
			return (
				<DashItem { ...commonProps }>
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
			isAtomicSite: isAtomicSite( state ),
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
