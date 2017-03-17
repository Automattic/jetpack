/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import includes from 'lodash/includes';
import Button from 'components/button';
import SimpleNotice from 'components/notice';
import NoticeAction from 'components/notice/notice-action';

/**
 * Internal dependencies
 */
import { getSiteRawUrl } from 'state/initial-state';
import QuerySitePlugins from 'components/data/query-site-plugins';
import QueryVaultPressData from 'components/data/query-vaultpress-data';
import QueryAkismetData from 'components/data/query-akismet-data';
import { isDevMode } from 'state/connection';
import {
	isFetchingPluginsData,
	isPluginActive,
	isPluginInstalled
} from 'state/site/plugins';
import {
	getVaultPressScanThreatCount as _getVaultPressScanThreatCount,
	getVaultPressData as _getVaultPressData,
	getAkismetData as _getAkismetData
} from 'state/at-a-glance';
import {
	getSitePlan,
	isFetchingSiteData
} from 'state/site';

const ProStatus = React.createClass( {
	propTypes: {
		isCompact: React.PropTypes.bool,
		proFeature: React.PropTypes.string
	},

	getDefaultProps: function() {
		return {
			isCompact: true,
			proFeature: ''
		};
	},

	getScanActions( type ) {
		let status = '',
			message = false,
			action = false,
			actionUrl = '';
		switch ( type ) {
			case 'threats':
				status = 'is-error';
				if ( this.props.isCompact ) {
					action = __( 'FIX THREATS', { context: 'A caption for a small button to fix security issues.' } );
				} else {
					message = __( 'Threats found!', { context: 'Short warning message about new threats found.' } );
					action = __( 'FIX', { context: 'A caption for a small button to fix security issues.' } );
				}
				actionUrl = 'https://dashboard.vaultpress.com/';
				break;
			case 'free':
			case 'personal':
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
					action && <NoticeAction href={ actionUrl }>{ action }</NoticeAction>
				}
			</SimpleNotice>
		);
	},

	render() {
		const sitePlan = this.props.sitePlan(),
			vpData = this.props.getVaultPressData(),
			pluginSlug = 'scan' === this.props.proFeature || 'backups' === this.props.proFeature || 'vaultpress' === this.props.proFeature
				? 'vaultpress/vaultpress.php'
				: 'akismet/akismet.php';

		const hasPremium = /jetpack_premium*/.test( sitePlan.product_slug ),
			hasBusiness = /jetpack_business*/.test( sitePlan.product_slug ),
			hasPersonal = /jetpack_personal*/.test( sitePlan.product_slug ),
			hasFree = /jetpack_free*/.test( sitePlan.product_slug ),
			hasBackups = (
				'undefined' !== typeof vpData.data &&
				'undefined' !== typeof vpData.data.features &&
				'undefined' !== typeof vpData.data.features.backups &&
				vpData.data.features.backups
			),
			hasScan = (
				'undefined' !== typeof vpData.data &&
				'undefined' !== typeof vpData.data.features &&
				'undefined' !== typeof vpData.data.features.security &&
				vpData.data.features.security
			);
		
		const getStatus = ( feature, active, installed ) => {
			if ( this.props.isDevMode ) {
				return '';
			}

			if ( 'backups' === feature ) {
				if ( hasFree && ! hasBackups ) {
					if ( this.props.isCompact ) {
						return this.getScanActions( 'free' );
					}
				}
			}

			if ( 'scan' === feature ) {
				if ( ( hasFree || hasPersonal ) && ! hasScan ) {
					if ( this.props.isCompact ) {
						return this.getScanActions( 'free' );
					}
					return '';
				}
				if ( 'N/A' !== vpData ) {
					const threatsCount = this.props.getScanThreats();
					if ( 0 !== threatsCount ) {
						return this.getScanActions( 'threats' );
					}
					if ( 0 === threatsCount ) {
						return this.getScanActions( 'secure' );
					}
				}
			}

			if ( 'akismet' === feature ) {
				const akismetData = this.props.getAkismetData();
				if ( 'invalid_key' === akismetData ) {
					return (
						<a href={ this.props.siteAdminUrl + 'admin.php?page=akismet-key-config' } >
							<SimpleNotice
								showDismiss={ false }
								status='is-warning'
								isCompact={ true }
							>
								{ __( 'Invalid key', { context: 'Short warning message about an invalid key being used for Akismet.' } ) }
							</SimpleNotice>
						</a>
					);
				}
			}

			if ( 'seo-tools' === feature ) {
				if ( this.props.fetchingSiteData ) {
					return '';
				}

				return (
					<Button
						compact={ true }
						primary={ true }
						href={ 'https://jetpack.com/redirect/?source=upgrade-seo&site=' + this.props.siteRawUrl + '&feature=advanced-seo' }
					>
						{ __( 'Upgrade', { context: 'Caption for a button to purchase a paid feature.' } ) }
					</Button>
				);
			}

			if ( 'wordads' === feature ) {
				if ( this.props.fetchingSiteData ) {
					return '';
				}

				return (
					<Button
						compact={ true }
						primary={ true }
						href={ 'https://jetpack.com/redirect/?source=upgrade-ads&site=' + this.props.siteRawUrl + '&feature=jetpack-ads' }
					>
						{ __( 'Upgrade', { context: 'Caption for a button to purchase a paid feature.' } ) }
					</Button>
				);
			}

			if ( 'google-analytics' === feature && ! includes( [ 'jetpack_business', 'jetpack_business_monthly' ], sitePlan.product_slug ) ) {
				if ( this.props.fetchingSiteData ) {
					return '';
				}

				return (
					<Button
						compact={ true }
						primary={ true }
						href={ 'https://jetpack.com/redirect/?source=upgrade-google-analytics&site=' + this.props.siteRawUrl + '&feature=google-analytics' }
					>
						{ __( 'Upgrade', { context: 'Caption for a button to purchase a paid feature.' } ) }
					</Button>
				);
			}

			if ( sitePlan.product_slug ) {
				let btnVals = {};
				if ( 'jetpack_free' !== sitePlan.product_slug ) {
					btnVals = {
						href: `https://wordpress.com/plugins/setup/${ this.props.siteRawUrl }?only=${ feature }`,
						text: __( 'Set up', { context: 'Caption for a button to set up a feature.' } )
					}

					if ( 'scan' === feature && ! hasBusiness && ! hasPremium ) {
						return (
							<Button
								compact={ true }
								primary={ true }
								href={ 'https://jetpack.com/redirect/?source=upgrade&site=' + this.props.siteRawUrl }
							>
								{ __( 'Upgrade', { context: 'Caption for a button to purchase a paid feature.' } ) }
							</Button>
						);
					}
				} else {
					btnVals = {
						href: 'https://jetpack.com/redirect/?source=upgrade&site=' + this.props.siteRawUrl,
						text: __( 'Upgrade', { context: 'Caption for a button to purchase a paid feature.' } )
					}
				}

				if ( active && installed ) {
					return <span className="jp-dash-item__active-label">{ __( 'ACTIVE' ) }</span>;
				}

				return (
					<Button
						compact={ true }
						primary={ true }
						href={ btnVals.href }
					>
						{ btnVals.text }
					</Button>
				);
			}

			return active && installed && sitePlan.product_slug ?
				<span className="jp-dash-item__active-label">{ __( 'ACTIVE' ) }</span>
				: '';
		};

		return(
			<div>
				<QuerySitePlugins />
				<QueryAkismetData />
				<QueryVaultPressData />
				{ getStatus(
					this.props.proFeature,
					this.props.pluginActive( pluginSlug ),
					this.props.pluginInstalled( pluginSlug )
				) }
			</div>
		)
	}
} );

export default connect(
	( state ) => {
		return {
			siteRawUrl: getSiteRawUrl( state ),
			getScanThreats: () => _getVaultPressScanThreatCount( state ),
			getVaultPressData: () => _getVaultPressData( state ),
			getAkismetData: () => _getAkismetData( state ),
			sitePlan: () => getSitePlan( state ),
			fetchingPluginsData: isFetchingPluginsData( state ),
			pluginActive: ( plugin_slug ) => isPluginActive( state, plugin_slug ),
			pluginInstalled: ( plugin_slug ) => isPluginInstalled( state, plugin_slug ),
			isDevMode: isDevMode( state ),
			fetchingSiteData: isFetchingSiteData( state )
		};
	}
)( ProStatus );
