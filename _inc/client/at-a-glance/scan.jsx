/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { numberFormat, translate as __ } from 'i18n-calypso';
import { getPlanClass } from 'lib/plans/constants';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import QueryVaultPressData from 'components/data/query-vaultpress-data';
import { getSitePlan } from 'state/site';
import { isPluginInstalled } from 'state/site/plugins';
import {
	getVaultPressScanThreatCount,
	getVaultPressData
} from 'state/at-a-glance';
import { isDevMode } from 'state/connection';
import { isFetchingSiteData } from 'state/site';
import DashItem from 'components/dash-item';
import isArray from 'lodash/isArray';
import get from 'lodash/get';
import { showBackups } from 'state/initial-state';

/**
 * Displays a card for Security Scan based on the props given.
 *
 * @param   {object} props Settings to render the card.
 * @returns {object}       Security Scan card
 */
const renderCard = ( props ) => (
	<DashItem
		label={ __( 'Security Scanning' ) }
		module={ props.feature || 'scan' }
		support={ {
			text: __( 'Your site’s files are regularly scanned for unauthorized or suspicious modifications that could compromise your security and data.' ),
			link: 'https://jetpack.com/support/security/',
		} }
		className={ props.className || '' }
		status={ props.status || '' }
		pro={ true }
	>
		{
			isArray( props.content )
				? props.content
				: <p className="jp-dash-item__description">{ props.content }</p>
		}
	</DashItem>
);

class DashScan extends Component {
	static propTypes = {
		siteRawUrl: PropTypes.string.isRequired,

		// Connected props
		vaultPressData: PropTypes.any.isRequired,
		scanThreats: PropTypes.any.isRequired,
		sitePlan: PropTypes.object.isRequired,
		isDevMode: PropTypes.bool.isRequired,
		isPluginInstalled: PropTypes.bool.isRequired,
		fetchingSiteData: PropTypes.bool.isRequired
	};

	static defaultProps = {
		siteRawUrl: '',
		vaultPressData: '',
		scanThreats: 0,
		sitePlan: '',
		isDevMode: false,
		isPluginInstalled: false,
		fetchingSiteData: false
	};

	getVPContent() {
		const {
			sitePlan,
			siteRawUrl,
			fetchingSiteData,
		} = this.props;
		const hasSitePlan = false !== sitePlan;
		const vpData = this.props.vaultPressData;
		const scanEnabled = get( vpData, [ 'data', 'features', 'security' ], false );

		if ( this.props.getOptionValue( 'vaultpress' ) ) {
			if ( 'N/A' === vpData ) {
				return renderCard( {
					status: '',
					content: __( 'Loading…' )
				} );
			}

			if ( scanEnabled ) {
				// Check for threats
				const threats = this.props.scanThreats;
				if ( threats !== 0 ) {
					return renderCard( {
						content: [
							<h3>{
								__( 'Uh oh, %(number)s threat found.', 'Uh oh, %(number)s threats found.', {
									count: threats,
									args: { number: numberFormat( threats ) }
								} )
							}</h3>,
							<p className="jp-dash-item__description">
								{__( '{{a}}View details at VaultPress.com{{/a}}', { components: { a: <a href="https://dashboard.vaultpress.com/" /> } } )}
								<br />
								{__( '{{a}}Contact Support{{/a}}', { components: { a: <a href="https://jetpack.com/support" /> } } )}
							</p>
						]
					} );
				}

				// All good
				if ( vpData.code === 'success' ) {
					return renderCard( {
						status: 'is-working',
						content: __( "No threats found, you're good to go!" )
					} );
				}
			}
		}

		if ( fetchingSiteData ) {
			return renderCard( {
				status: '',
				content: __( 'Loading…' )
			} );
		}

		const inactiveOrUninstalled = this.props.isVaultPressInstalled ? 'pro-inactive' : 'pro-uninstalled';
		const planClass = getPlanClass( get( sitePlan, 'product_slug', '' ) );
		const hasPremium = 'is-premium-plan' === planClass;
		const hasBusiness = 'is-business-plan' === planClass;

		return renderCard( {
			className: 'jp-dash-item__is-inactive',
			status: hasSitePlan ? inactiveOrUninstalled : 'no-pro-uninstalled-or-inactive',
			content: ( hasPremium || hasBusiness || scanEnabled )
				? __( 'For automated, comprehensive scanning of security threats, please {{a}}install and activate{{/a}} VaultPress.', {
					components: {
						a: <a href="https://wordpress.com/plugins/vaultpress" target="_blank" rel="noopener noreferrer" />
					}
				} )
				: __( 'For automated, comprehensive scanning of security threats, please {{a}}upgrade your account{{/a}}.', {
					components: {
						a: <a href={ 'https://jetpack.com/redirect/?source=aag-scan&site=' + siteRawUrl } target="_blank" rel="noopener noreferrer" />
					}
				} )
		} );
	}

	render() {
		if ( ! this.props.showBackups ) {
			return null;
		}

		if ( this.props.isDevMode ) {
			return renderCard( {
				className: 'jp-dash-item__is-inactive',
				content: __( 'Unavailable in Dev Mode.' )
			} );
		}

		const data = get( this.props.vaultPressData, 'data', '' );
		const siteId = data && data.site_id;

		return (
			<div>
				<QueryVaultPressData />
				{
					this.props.isRewindActive
						? (
							<div className="jp-dash-item">
								{
									renderCard( {
										className: 'jp-dash-item__is-active',
										status: 'is-working',
										content: __( 'We are making sure your site stays free of security threats.' + ' ' +
											'You will be notified if we find one.' ),
										feature: 'rewind',
									} )

								}
								{
									<Card
										key="security-scanning"
										className="jp-dash-item__manage-in-wpcom"
										compact
										href={ `https://dashboard.vaultpress.com/${ siteId }/security/` }
									>
										{ __( 'View security scan details' ) }
									</Card>
								}
							</div>
						)
						: this.getVPContent()
				}
			</div>
		);
	}
}

export default connect(
	( state ) => {
		return {
			vaultPressData: getVaultPressData( state ),
			scanThreats: getVaultPressScanThreatCount( state ),
			sitePlan: getSitePlan( state ),
			isDevMode: isDevMode( state ),
			isVaultPressInstalled: isPluginInstalled( state, 'vaultpress/vaultpress.php' ),
			fetchingSiteData: isFetchingSiteData( state ),
			showBackups: showBackups( state ),
		};
	}
)( DashScan );
