/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { numberFormat, translate as __ } from 'i18n-calypso';
import { getPlanClass, PLAN_JETPACK_PREMIUM } from 'lib/plans/constants';
import getRedirectUrl from 'lib/jp-redirect';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import QueryVaultPressData from 'components/data/query-vaultpress-data';
import { getSitePlan, isFetchingSiteData } from 'state/site';
import { isPluginInstalled } from 'state/site/plugins';
import { getVaultPressScanThreatCount, getVaultPressData } from 'state/at-a-glance';
import { isDevMode } from 'state/connection';
import DashItem from 'components/dash-item';
import { get, isArray } from 'lodash';
import { getUpgradeUrl, showBackups } from 'state/initial-state';
import JetpackBanner from 'components/jetpack-banner';

/**
 * Displays a card for Security Scan based on the props given.
 *
 * @param   {object} props Settings to render the card.
 * @returns {object}       Security Scan card
 */
const renderCard = props => (
	<DashItem
		label={ __( 'Scan' ) }
		module={ props.feature || 'scan' }
		support={ {
			text: __(
				'Your site’s files are regularly scanned for unauthorized or suspicious modifications that could compromise your security and data.'
			),
			link: getRedirectUrl( 'jetpack-support-security' ),
		} }
		className={ props.className || '' }
		status={ props.status || '' }
		pro={ true }
		overrideContent={ props.overrideContent }
	>
		{ isArray( props.content ) ? (
			props.content
		) : (
			<p className="jp-dash-item__description">{ props.content }</p>
		) }
	</DashItem>
);

class DashScan extends Component {
	static propTypes = {
		siteRawUrl: PropTypes.string.isRequired,
		rewindStatus: PropTypes.string.isRequired,

		// Connected props
		vaultPressData: PropTypes.any.isRequired,
		scanThreats: PropTypes.any.isRequired,
		sitePlan: PropTypes.object.isRequired,
		isDevMode: PropTypes.bool.isRequired,
		isPluginInstalled: PropTypes.bool.isRequired,
		fetchingSiteData: PropTypes.bool.isRequired,
		upgradeUrl: PropTypes.string.isRequired,
	};

	static defaultProps = {
		siteRawUrl: '',
		vaultPressData: '',
		scanThreats: 0,
		sitePlan: '',
		isDevMode: false,
		isPluginInstalled: false,
		fetchingSiteData: false,
		rewindStatus: '',
	};

	getVPContent() {
		const { sitePlan, planClass, fetchingSiteData } = this.props;
		const hasSitePlan = false !== sitePlan;
		const vpData = this.props.vaultPressData;
		const scanEnabled = get( vpData, [ 'data', 'features', 'security' ], false );

		if ( this.props.getOptionValue( 'vaultpress' ) ) {
			if ( 'N/A' === vpData ) {
				return renderCard( {
					status: '',
					content: __( 'Loading…' ),
				} );
			}

			if ( scanEnabled ) {
				// Check for threats
				const threats = this.props.scanThreats;
				if ( threats !== 0 ) {
					return renderCard( {
						content: [
							<h3 className="jp-dash-item__title jp-dash-item__title_fullwidth jp-dash-item__title_top">
								{ __( 'Uh oh, %(number)s threat found.', 'Uh oh, %(number)s threats found.', {
									count: threats,
									args: { number: numberFormat( threats ) },
								} ) }
							</h3>,
							<p className="jp-dash-item__description">
								{ __( '{{a}}View details at VaultPress.com{{/a}}', {
									components: { a: <a href={ getRedirectUrl( 'vaultpress-dashboard' ) } /> },
								} ) }
								<br />
								{ __( '{{a}}Contact Support{{/a}}', {
									components: { a: <a href={ getRedirectUrl( 'jetpack-support' ) } /> },
								} ) }
							</p>,
						],
					} );
				}

				// All good
				if ( vpData.code === 'success' ) {
					return renderCard( {
						status: 'is-working',
						content: __( "No threats found, you're good to go!" ),
					} );
				}
			}
		}

		if ( fetchingSiteData ) {
			return renderCard( {
				status: '',
				content: __( 'Loading…' ),
			} );
		}

		const inactiveOrUninstalled = this.props.isVaultPressInstalled
			? 'pro-inactive'
			: 'pro-uninstalled';
		const hasPremium = 'is-premium-plan' === planClass;
		const hasBusiness = 'is-business-plan' === planClass;

		const scanContent =
			hasPremium || hasBusiness || scanEnabled ? (
				<p className="jp-dash-item__description" key="inactive-scanning">
					{ __(
						'For automated, comprehensive scanning of security threats, please {{a}}install and activate{{/a}} VaultPress.',
						{
							components: {
								a: (
									<a
										href={ getRedirectUrl( 'calypso-plugins-vaultpress' ) }
										target="_blank"
										rel="noopener noreferrer"
									/>
								),
							},
						}
					) }
				</p>
			) : null;

		const overrideContent = null === scanContent ? this.getUpgradeBanner() : null;

		return renderCard( {
			className: 'jp-dash-item__is-inactive',
			status: hasSitePlan ? inactiveOrUninstalled : 'no-pro-uninstalled-or-inactive',
			content: [ scanContent ],
			overrideContent,
		} );
	}

	getUpgradeBanner() {
		return (
			<JetpackBanner
				callToAction={ __( 'Upgrade' ) }
				title={ __( 'Find threats early so we can help fix them fast.' ) }
				disableHref="false"
				href={ this.props.upgradeUrl }
				eventFeature="scan"
				path="dashboard"
				plan={ PLAN_JETPACK_PREMIUM }
				icon="lock"
			/>
		);
	}

	getRewindContent() {
		const { rewindStatus, siteRawUrl } = this.props;
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
						{ buildCard( __( 'We are configuring your site protection.' ) ) }
					</React.Fragment>
				);
			case 'awaiting_credentials':
				return (
					<React.Fragment>
						{ buildCard(
							__( "You need to enter your server's credentials to finish the setup." )
						) }
						{ buildAction(
							getRedirectUrl( 'calypso-settings-security', { site: siteRawUrl } ),
							__( 'Enter credentials' )
						) }
					</React.Fragment>
				);
			case 'active':
				return (
					<React.Fragment>
						{ buildCard(
							__(
								'We are making sure your site stays free of security threats.' +
									' ' +
									'You will be notified if we find one.'
							)
						) }
						{ buildAction(
							getRedirectUrl( 'calypso-activity-log', { site: siteRawUrl } ),
							__( 'View security scan details' )
						) }
					</React.Fragment>
				);
		}

		return false;
	}

	getUpgradeContent() {
		return renderCard( {
			className: 'jp-dash-item__is-inactive',
			overrideContent: this.getUpgradeBanner(),
		} );
	}

	render() {
		if ( ! this.props.showBackups ) {
			return null;
		}

		if ( this.props.isDevMode ) {
			return renderCard( {
				className: 'jp-dash-item__is-inactive',
				content: __( 'Unavailable in Dev Mode.' ),
			} );
		}

		// If the plan class does not support Scan, prompt an upgrade
		// Otherwise, use either VaultPress or Rewind to determine what to show
		let content;
		if (
			[
				'is-free-plan',
				'is-personal-plan',
				'is-daily-backup-plan',
				'is-realtime-backup-plan',
			].includes( this.props.planClass )
		) {
			content = this.getUpgradeContent();
		} else if ( 'unavailable' === this.props.rewindStatus ) {
			content = this.getVPContent( this.props.planClass );
		} else {
			content = <div className="jp-dash-item">{ this.getRewindContent() }</div>;
		}

		return (
			<div>
				<QueryVaultPressData />
				{ content }
			</div>
		);
	}
}

export default connect( state => {
	const sitePlan = getSitePlan( state );

	return {
		vaultPressData: getVaultPressData( state ),
		scanThreats: getVaultPressScanThreatCount( state ),
		sitePlan,
		planClass: getPlanClass( get( sitePlan, 'product_slug', '' ) ),
		isDevMode: isDevMode( state ),
		isVaultPressInstalled: isPluginInstalled( state, 'vaultpress/vaultpress.php' ),
		fetchingSiteData: isFetchingSiteData( state ),
		showBackups: showBackups( state ),
		upgradeUrl: getUpgradeUrl( state, 'aag-scan' ),
	};
} )( DashScan );
