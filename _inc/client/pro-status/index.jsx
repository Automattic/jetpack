/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import Button from 'components/button';
import SimpleNotice from 'components/notice';
import analytics from 'lib/analytics';
import get from 'lodash/get';

/**
 * Internal dependencies
 */
import { getSiteRawUrl, getSiteAdminUrl } from 'state/initial-state';
import QuerySitePlugins from 'components/data/query-site-plugins';
import QueryVaultPressData from 'components/data/query-vaultpress-data';
import QueryAkismetKeyCheck from 'components/data/query-akismet-key-check';
import { isDevMode } from 'state/connection';
import {
	isFetchingPluginsData,
	isPluginActive,
	isPluginInstalled
} from 'state/site/plugins';
import {
	getVaultPressScanThreatCount,
	getVaultPressData,
	isFetchingVaultPressData,
	getAkismetData,
	isAkismetKeyValid,
	isFetchingAkismetData
} from 'state/at-a-glance';
import {
	getSitePlan,
	isFetchingSiteData
} from 'state/site';

/**
 * Track click on Pro status badge.
 *
 * @param {string} type    Status of a certain feature.
 * @param {string} feature Slug of plugin or service.
 *
 * @returns {undefined}
 */
const trackProStatusClick = ( type, feature ) => analytics.tracks.recordJetpackClick( {
	target: 'pro-status',
	type: type,
	feature: feature
} );

/**
 * Build function to pass as onClick property.
 *
 * @param {string} type    Status of a certain feature.
 * @param {string} feature Slug of plugin or service.
 *
 * @returns {function} Function to track a click.
 */
const handleClickForTracking = ( type, feature ) => ( () => trackProStatusClick( type, feature ) );

class ProStatus extends React.Component {
	static propTypes = {
		isCompact: PropTypes.bool,
		proFeature: PropTypes.string
	};

	static defaultProps = {
		isCompact: true,
		proFeature: ''
	};

	getProActions = ( type, feature ) => {
		let status = '',
			message = false,
			action = false,
			actionUrl = '';
		switch ( type ) {
			case 'threats':
				status = 'is-error';
				if ( this.props.isCompact ) {
					action = __( 'Threats', { context: 'A caption for a small button to fix security issues.' } );
				} else {
					message = __( 'Threats found!', { context: 'Short warning message about new threats found.' } );
					action = __( 'FIX', { context: 'A caption for a small button to fix security issues.' } );
				}
				actionUrl = 'https://dashboard.vaultpress.com/';
				break;
			case 'free':
			case 'personal':
				type = 'upgrade';
				status = 'is-warning';
				if ( ! this.props.isCompact ) {
					message = __( 'No scanning', { context: 'Short warning message about site having no security scan.' } );
				}
				action = __( 'Upgrade', { context: 'Caption for a button to purchase a paid feature.' } );
				actionUrl = 'https://jetpack.com/redirect/?source=upgrade&site=' + this.props.siteRawUrl;
				break;
			case 'pro':
				type = 'upgrade';
				status = 'is-warning';
				action = __( 'Upgrade', { context: 'Caption for a button to purchase a pro plan.' } );
				actionUrl = 'https://jetpack.com/redirect/?source=plans-business&site=' + this.props.siteRawUrl;
				break;
			case 'secure':
				status = 'is-success';
				message = __( 'Secure', { context: 'Short message informing user that the site is secure.' } );
				break;
			case 'invalid_key':
				status = 'is-warning';
				action = __( 'Invalid key', { context: 'Short warning message about an invalid key being used for Akismet.' } );
				actionUrl = this.props.siteAdminUrl + 'admin.php?page=akismet-key-config';
				break;
			case 'rewind_connected':
				return (
					<SimpleNotice showDismiss={ false } status="is-success" isCompact>
						{ __( 'Connected' ) }
					</SimpleNotice>
				);
			case 'active':
				return <span className="jp-dash-item__active-label">{ __( 'ACTIVE' ) }</span>;
		}
		return (
			<SimpleNotice
				showDismiss={ false }
				status={ status }
				isCompact={ true }
			>
				{
					message
				}
				{
					action && <a className="dops-notice__text-no-underline" onClick={ handleClickForTracking( type, feature ) } href={ actionUrl }>{ action }</a>
				}
			</SimpleNotice>
		);
	};

	/**
	 * Return a button to Set Up a feature.
	 *
	 * @param {string} feature Slug of the feature to set up.
	 *
	 * @return {component} A Button component.
	 */
	getSetUpButton = feature => {
		return (
			<Button
				onClick={ handleClickForTracking( 'set_up', feature ) }
				compact={ true }
				primary={ true }
				href={ `https://wordpress.com/plugins/setup/${ this.props.siteRawUrl }?only=${ feature }` }
			>
				{ __( 'Set up', { context: 'Caption for a button to set up a feature.' } ) }
			</Button>
		);
	};

	render() {
		const sitePlan = this.props.sitePlan(),
			vpData = this.props.getVaultPressData();
		let pluginSlug = '';
		if ( 'scan' === this.props.proFeature || 'backups' === this.props.proFeature || 'vaultpress' === this.props.proFeature ) {
			pluginSlug = 'vaultpress/vaultpress.php';
		}
		if ( 'akismet' === this.props.proFeature ) {
			pluginSlug = 'akismet/akismet.php';
		}

		const hasPersonal = /jetpack_personal*/.test( sitePlan.product_slug ),
			hasFree = /jetpack_free*/.test( sitePlan.product_slug ),
			hasPremium = /jetpack_premium*/.test( sitePlan.product_slug ),
			hasBackups = get( vpData, [ 'data', 'features', 'backups' ], false ),
			hasScan = get( vpData, [ 'data', 'features', 'security' ], false );

		const getStatus = ( feature, active, installed ) => {
			switch ( feature ) {
				case 'rewind':
					return this.getProActions( 'rewind_connected', 'rewind' );

				case 'backups':
					if ( hasFree && ! hasBackups && this.props.isCompact ) {
						return this.getProActions( 'free', 'backups' );
					}
					break;

				case 'scan':
					if ( this.props.fetchingSiteData || this.props.isFetchingVaultPressData ) {
						return '';
					}
					if ( ( hasFree || hasPersonal ) && ! hasScan ) {
						if ( this.props.isCompact ) {
							return this.getProActions( 'free', 'scan' );
						} else if ( hasPersonal && ! hasBackups ) {
							// Personal plans doesn't have scan but it does have backups.
							return this.getSetUpButton( 'backups' );
						}
						return '';
					}
					if ( 'N/A' !== vpData ) {
						if ( ! hasScan ) {
							return this.getSetUpButton( 'scan' );
						}

						return this.getProActions( 0 === this.props.getScanThreats() ? 'secure' : 'threats', 'scan' );
					}
					break;

				case 'search':
					if ( hasFree || hasPersonal || hasPremium ) {
						return this.getProActions( 'pro' );
					}
					return '';

				case 'akismet':
					if ( hasFree && ! ( active && installed ) ) {
						return this.props.isCompact
							? this.getProActions( 'free', 'anti-spam' )
							: '';
					}

					if ( ! this.props.isAkismetKeyValid && ! this.props.fetchingAkismetData && active && installed ) {
						return this.getProActions( 'invalid_key', 'anti-spam' );
					}
					break;
			}

			// Show set up or active status only for paid features that depend on a plugin, and only under a paid plan
			if ( sitePlan.product_slug && pluginSlug && ! hasFree ) {
				return active && installed
					? this.getProActions( 'active' )
					: this.getSetUpButton( feature );
			}

			return '';
		};

		return (
			<div>
				<QuerySitePlugins />
				<QueryAkismetKeyCheck />
				<QueryVaultPressData />
				{ ! this.props.isDevMode && getStatus(
					this.props.proFeature,
					this.props.pluginActive( pluginSlug ),
					this.props.pluginInstalled( pluginSlug )
				) }
			</div>
		);
	}
}

export default connect(
	( state ) => {
		return {
			siteRawUrl: getSiteRawUrl( state ),
			siteAdminUrl: getSiteAdminUrl( state ),
			getScanThreats: () => getVaultPressScanThreatCount( state ),
			getVaultPressData: () => getVaultPressData( state ),
			getAkismetData: () => getAkismetData( state ),
			isFetchingVaultPressData: isFetchingVaultPressData( state ),
			sitePlan: () => getSitePlan( state ),
			fetchingPluginsData: isFetchingPluginsData( state ),
			pluginActive: ( plugin_slug ) => isPluginActive( state, plugin_slug ),
			pluginInstalled: ( plugin_slug ) => isPluginInstalled( state, plugin_slug ),
			isDevMode: isDevMode( state ),
			fetchingSiteData: isFetchingSiteData( state ),
			isAkismetKeyValid: isAkismetKeyValid( state ),
			fetchingAkismetData: isFetchingAkismetData( state )
		};
	}
)( ProStatus );
