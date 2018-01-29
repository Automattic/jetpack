/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import Button from 'components/button';
import SimpleNotice from 'components/notice';
import NoticeAction from 'components/notice/notice-action';
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
	getAkismetData
} from 'state/at-a-glance';
import {
	getSitePlan,
	isFetchingSiteData
} from 'state/site';
import {
	isAkismetKeyValid,
	isFetchingAkismetData
} from 'state/at-a-glance';

const ProStatus = React.createClass( {
	propTypes: {
		isCompact: PropTypes.bool,
		proFeature: PropTypes.string
	},

	getDefaultProps: function() {
		return {
			isCompact: true,
			proFeature: ''
		};
	},

	trackProStatusClick: function( type, feature ) {
		analytics.tracks.recordJetpackClick( {
			target: 'pro-status',
			type: type,
			feature: feature
		} );
	},

	getProActions( type, feature ) {
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
					action && <NoticeAction onClick={ () => this.trackProStatusClick( type, feature ) } href={ actionUrl }>{ action }</NoticeAction>
				}
			</SimpleNotice>
		);
	},

	/**
	 * Return a button to Set Up a feature.
	 *
	 * @param {string} feature Slug of the feature to set up.
	 *
	 * @return {component} A Button component.
	 */
	getSetUpButton( feature ) {
		return (
			<Button
				onClick={ () => this.trackProStatusClick( 'set_up', feature ) }
				compact={ true }
				primary={ true }
				href={ `https://wordpress.com/plugins/setup/${ this.props.siteRawUrl }?only=${ feature }` }
			>
				{ __( 'Set up', { context: 'Caption for a button to set up a feature.' } ) }
			</Button>
		);
	},

	render() {
		const sitePlan = this.props.sitePlan(),
			vpData = this.props.getVaultPressData(),
			pluginSlug = 'scan' === this.props.proFeature || 'backups' === this.props.proFeature || 'vaultpress' === this.props.proFeature
				? 'vaultpress/vaultpress.php'
				: 'akismet/akismet.php';

		const hasPersonal = /jetpack_personal*/.test( sitePlan.product_slug ),
			hasFree = /jetpack_free*/.test( sitePlan.product_slug ),
			hasBackups = get( vpData, [ 'data', 'features', 'backups' ], false ),
			hasScan = get( vpData, [ 'data', 'features', 'security' ], false );

		const getStatus = ( feature, active, installed ) => {
			if ( this.props.isDevMode ) {
				return '';
			}

			if ( 'rewind' === feature ) {
				return this.getProActions( 'rewind_connected', 'rewind' );
			}

			if ( 'backups' === feature ) {
				if ( hasFree && ! hasBackups ) {
					if ( this.props.isCompact ) {
						return this.getProActions( 'free', 'backups' );
					}
				}
			}

			if ( 'scan' === feature ) {
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

					const threatsCount = this.props.getScanThreats();
					if ( 0 !== threatsCount ) {
						return this.getProActions( 'threats', 'scan' );
					}
					if ( 0 === threatsCount ) {
						return this.getProActions( 'secure', 'scan' );
					}
				}
			}

			if ( 'akismet' === feature ) {
				if ( hasFree && ! ( active && installed ) ) {
					if ( this.props.isCompact ) {
						return this.getProActions( 'free', 'anti-spam' );
					}
					return '';
				}

				if ( ! this.props.isAkismetKeyValid && ! this.props.fetchingAkismetData && active && installed ) {
					return this.getProActions( 'invalid_key', 'anti-spam' );
				}
			}

			if ( sitePlan.product_slug ) {
				if ( ! hasFree ) {
					if ( active && installed ) {
						return this.getProActions( 'active' );
					}

					return this.getSetUpButton( feature );
				}
			}

			return '';
		};

		return (
			<div>
				<QuerySitePlugins />
				<QueryAkismetKeyCheck />
				<QueryVaultPressData />
				{ getStatus(
					this.props.proFeature,
					this.props.pluginActive( pluginSlug ),
					this.props.pluginInstalled( pluginSlug )
				) }
			</div>
		);
	}
} );

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
