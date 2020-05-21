/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { numberFormat, translate as __ } from 'i18n-calypso';
import { get } from 'lodash';
import getRedirectUrl from 'lib/jp-redirect';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import { PLAN_JETPACK_PREMIUM } from 'lib/plans/constants';
import Card from 'components/card';
import DashItem from 'components/dash-item';
import restApi from 'rest-api';
import QueryAkismetData from 'components/data/query-akismet-data';
import { getAkismetData } from 'state/at-a-glance';
import { getSitePlan } from 'state/site';
import { isDevMode } from 'state/connection';
import { getApiNonce, getUpgradeUrl } from 'state/initial-state';
import JetpackBanner from 'components/jetpack-banner';

class DashAkismet extends Component {
	static propTypes = {
		siteRawUrl: PropTypes.string.isRequired,
		siteAdminUrl: PropTypes.string.isRequired,

		// Connected props
		akismetData: PropTypes.oneOfType( [ PropTypes.string, PropTypes.object ] ).isRequired,
		isDevMode: PropTypes.bool.isRequired,
		upgradeUrl: PropTypes.string.isRequired,
	};

	static defaultProps = {
		siteRawUrl: '',
		siteAdminUrl: '',
		akismetData: 'N/A',
		isDevMode: '',
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

		restApi.activateAkismet().then( () => {
			window.location.href = this.props.siteAdminUrl + 'admin.php?page=akismet-key-config';
		} );

		return false;
	};

	getContent() {
		const akismetData = this.props.akismetData;
		const labelName = __( 'Anti-spam' );
		const isSiteOnFreePlan =
			'jetpack_free' === get( this.props.sitePlan, 'product_slug', 'jetpack_free' );

		const support = {
			text: __(
				'Jetpack Anti-spam powered by Akismet. Comments and contact form submissions are checked against our global database of spam.'
			),
			link: 'https://akismet.com/',
			privacyLink: 'https://automattic.com/privacy/',
		};

		const getAkismetUpgradeBanner = () => {
			const description = __( 'Already have a key? {{a}}Activate Akismet{{/a}}', {
				components: {
					a: <a href="javascript:void(0)" onClick={ this.onActivateClick } />,
				},
			} );

			return (
				<JetpackBanner
					callToAction={ __( 'Upgrade' ) }
					title={ __(
						'Automatically clear spam from your comments and forms so you can get back to your business.'
					) }
					description={ description }
					disableHref="false"
					href={ this.props.upgradeUrl }
					eventFeature="akismet"
					path="dashboard"
					plan={ PLAN_JETPACK_PREMIUM }
					icon="flag"
				/>
			);
		};

		if ( 'N/A' === akismetData ) {
			return (
				<DashItem label={ labelName } module="akismet" support={ support } pro={ true }>
					<p className="jp-dash-item__description">{ __( 'Loading…' ) }</p>
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
						"Your Jetpack plan provides anti-spam protection through Akismet. Click 'set up' to enable it on your site."
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
					{ __( 'Spam comments blocked.', {
						context: 'Example: "412 Spam comments blocked"',
					} ) }
				</p>
			</DashItem>,
			! this.props.isDevMode && (
				<Card
					key="moderate-comments"
					className="jp-dash-item__manage-in-wpcom"
					compact
					href={ getRedirectUrl( 'calypso-comments-all', { site: this.props.siteRawUrl } ) }
				>
					{ __( 'Moderate comments' ) }
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

export default connect( state => ( {
	akismetData: getAkismetData( state ),
	sitePlan: getSitePlan( state ),
	isDevMode: isDevMode( state ),
	upgradeUrl: getUpgradeUrl( state, 'aag-akismet' ),
	nonce: getApiNonce( state ),
} ) )( DashAkismet );
