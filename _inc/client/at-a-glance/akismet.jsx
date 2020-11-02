/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Card from 'components/card';
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';
import DashItem from 'components/dash-item';
import { getAkismetData } from 'state/at-a-glance';
import getRedirectUrl from 'lib/jp-redirect';
import { getSitePlan } from 'state/site';
import { getApiNonce, getUpgradeUrl } from 'state/initial-state';
import { getJetpackProductUpsellByFeature, FEATURE_SPAM_AKISMET_PLUS } from 'lib/plans/constants';
import { isOfflineMode } from 'state/connection';
import JetpackBanner from 'components/jetpack-banner';
import { jetpackCreateInterpolateElement } from 'components/create-interpolate-element';
import { numberFormat } from 'components/number-format';
import restApi from 'rest-api';
import QueryAkismetData from 'components/data/query-akismet-data';

class DashAkismet extends Component {
	static propTypes = {
		siteRawUrl: PropTypes.string.isRequired,
		siteAdminUrl: PropTypes.string.isRequired,

		// Connected props
		akismetData: PropTypes.oneOfType( [ PropTypes.string, PropTypes.object ] ).isRequired,
		isOfflineMode: PropTypes.bool.isRequired,
		upgradeUrl: PropTypes.string.isRequired,
	};

	static defaultProps = {
		siteRawUrl: '',
		siteAdminUrl: '',
		akismetData: 'N/A',
		isOfflineMode: '',
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
			const description = jetpackCreateInterpolateElement(
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
				/>
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
						overrideContent={ getAkismetUpgradeBanner() }
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
						overrideContent={ getAkismetUpgradeBanner() }
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
						overrideContent={ getAkismetUpgradeBanner() }
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
				<h2 className="jp-dash-item__count">{ numberFormat( akismetData.all.spam ) }</h2>
				<p className="jp-dash-item__description">
					{ _x( 'Spam comments blocked.', 'Example: "412 Spam comments blocked"', 'jetpack' ) }
				</p>
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
			upgradeUrl: getUpgradeUrl( state, 'aag-akismet' ),
			nonce: getApiNonce( state ),
		};
	},
	{
		createNotice,
		removeNotice,
	}
)( DashAkismet );
