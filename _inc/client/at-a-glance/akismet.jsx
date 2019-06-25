/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { numberFormat, translate as __ } from 'i18n-calypso';
import { PLAN_JETPACK_PREMIUM } from 'lib/plans/constants';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Card from 'components/card';
import DashItem from 'components/dash-item';
import QueryAkismetData from 'components/data/query-akismet-data';
import { getAkismetData } from 'state/at-a-glance';
import { getSitePlan } from 'state/site';
import { isDevMode } from 'state/connection';
import { getUpgradeUrl } from 'state/initial-state';
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

	trackInstallClick() {
		analytics.tracks.recordJetpackClick( {
			type: 'install-link',
			target: 'at-a-glance',
			feature: 'akismet',
		} );
	}

	trackActivateClick() {
		analytics.tracks.recordJetpackClick( {
			type: 'activate-link',
			target: 'at-a-glance',
			feature: 'akismet',
		} );
	}

	getContent() {
		const akismetData = this.props.akismetData;
		const labelName = __( 'Anti-spam' );

		const support = {
			text: __(
				'Jetpack Anti-spam powered by Akismet. Comments and contact form submissions are checked against our global database of spam.'
			),
			link: 'https://akismet.com/',
			privacyLink: 'https://automattic.com/privacy/',
		};

		if ( 'N/A' === akismetData ) {
			return (
				<DashItem label={ labelName } module="akismet" support={ support } pro={ true }>
					<p className="jp-dash-item__description">{ __( 'Loading…' ) }</p>
				</DashItem>
			);
		}

		const hasSitePlan = false !== this.props.sitePlan;

		if ( 'not_installed' === akismetData ) {
			return (
				<DashItem
					label={ labelName }
					module="akismet"
					support={ support }
					className="jp-dash-item__is-inactive"
					status={ hasSitePlan ? 'pro-uninstalled' : 'no-pro-uninstalled-or-inactive' }
					pro={ true }
				>
					<p className="jp-dash-item__description">
						{ __( 'For state-of-the-art spam defense, please {{a}}install Akismet{{/a}}.', {
							components: {
								a: (
									<a
										href={ 'https://wordpress.com/plugins/akismet/' + this.props.siteRawUrl }
										onClick={ this.trackInstallClick }
										target="_blank"
										rel="noopener noreferrer"
									/>
								),
							},
						} ) }
					</p>
				</DashItem>
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
				>
					<p className="jp-dash-item__description">
						{ __( 'For state-of-the-art spam defense, please {{a}}activate Akismet{{/a}}.', {
							components: {
								a: (
									<a
										href={ 'https://wordpress.com/plugins/akismet/' + this.props.siteRawUrl }
										onClick={ this.trackActivateClick }
										target="_blank"
										rel="noopener noreferrer"
									/>
								),
							},
						} ) }
					</p>
				</DashItem>
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
					overrideContent={
						<JetpackBanner
							callToAction={ __( 'Upgrade' ) }
							title={ __(
								'Automatically clear spam from your comments and forms so you can get back to your business.'
							) }
							disableHref="false"
							href={ this.props.upgradeUrl }
							eventFeature="akismet"
							path="dashboard"
							plan={ PLAN_JETPACK_PREMIUM }
							icon="flag"
						/>
					}
				/>
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
					href={ `https://wordpress.com/comments/all/${ this.props.siteRawUrl }` }
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
} ) )( DashAkismet );
