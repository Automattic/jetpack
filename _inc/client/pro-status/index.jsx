/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import Button from 'components/button';
import SimpleNotice from 'components/notice';
import NoticeAction from 'components/notice/notice-action';
import { getPlanClass } from 'lib/plans/constants';

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
		proFeature: React.PropTypes.string,
		forceNotice: React.PropTypes.bool
	},

	getDefaultProps: function() {
		return {
			isCompact: true,
			proFeature: '',
			forceNotice: false
		};
	},

	render() {
		const pluginSlug = 'scan' === this.props.proFeature || 'backups' === this.props.proFeature || 'vaultpress' === this.props.proFeature
			? 'vaultpress/vaultpress.php'
			: 'akismet/akismet.php';

		return (
			<div>
				<QuerySitePlugins />
				<QueryAkismetData />
				<QueryVaultPressData />
				{ this.getStatus(
					this.props.proFeature,
					this.props.pluginActive( pluginSlug ),
					this.props.pluginInstalled( pluginSlug ),
					this.props.forceNotice
				) }
			</div>
		);
	},

	getStatusNotice( status, text, action, href ) {
		const notice = (
			<SimpleNotice showDismiss={ false } status={ status } isCompact={ true }>
				{ text }
				{ action }
			</SimpleNotice>
		);

		if ( href ) {
			return ( <a href={ href }>{ notice }</a> );
		}
		return notice;
	},

	getStatusButton( href, text ) {
		return (
			<Button compact={ true } primary={ true } href={ href }>
				{ text }
			</Button>
		);
	},

	getStatus( feature, active, installed, forceNotice ) {
		const vpData = this.props.getVaultPressData(),
			sitePlan = this.props.sitePlan(),
			planClass = getPlanClass( sitePlan.product_slug ),
			hasPremium = 'is-premium-plan' === planClass,
			hasBusiness = 'is-business-plan' === planClass;

		if ( this.props.isDevMode ) {
			return __( 'Unavailable in Dev Mode' );
		}

		if ( 'N/A' !== vpData && 'scan' === feature && 0 !== this.props.getScanThreats() ) {
			return this.getStatusNotice(
				'is-error',
				__( 'Threats found!', { context: 'Short warning message about new threats found.' } ),
				(
					<NoticeAction href="https://dashboard.vaultpress.com/">
						{ __(
							'FIX IT',
							{ context: 'A caption for a small button to fix security issues.' }
						) }
					</NoticeAction>
				)
			);
		}

		if ( 'akismet' === feature ) {
			const akismetData = this.props.getAkismetData();
			if ( 'invalid_key' === akismetData ) {
				return this.getStatusNotice(
					'is-warning',
					__(
						'Invalid key',
						{ context: 'Short warning message about an invalid key being used for Akismet.' }
					),
					null,
					this.props.siteAdminUrl + 'admin.php?page=akismet-key-config'
				);
			}
		}

		if ( 'seo-tools' === feature ) {
			if ( this.props.fetchingSiteData ) {
				return '';
			}

			return this.getStatusButton(
				'https://jetpack.com/redirect/?source=upgrade-seo&site=' + this.props.siteRawUrl + '&feature=advanced-seo',
				__( 'Upgrade', { context: 'Caption for a button to purchase a paid feature.' } )
			);
		}

		if ( 'wordads' === feature ) {
			if ( this.props.fetchingSiteData ) {
				return '';
			}

			return this.getStatusButton(
				'https://jetpack.com/redirect/?source=upgrade-ads&site=' + this.props.siteRawUrl + '&feature=jetpack-ads',
				__( 'Upgrade', { context: 'Caption for a button to purchase a paid feature.' } )
			);
		}

		if ( 'google-analytics' === feature && ! hasBusiness ) {
			if ( this.props.fetchingSiteData ) {
				return '';
			}

			return this.getStatusButton(
				'https://jetpack.com/redirect/?source=upgrade-google-analytics&site=' + this.props.siteRawUrl + '&feature=google-analytics',
				__( 'Upgrade', { context: 'Caption for a button to purchase a paid feature.' } )
			);
		}

		if ( sitePlan.product_slug ) {
			let btnVals = {};
			if ( 'is_free' !== planClass ) {
				btnVals = {
					href: `https://wordpress.com/plugins/setup/${ this.props.siteRawUrl }?only=${ feature }`,
					text: __( 'Set up', { context: 'Caption for a button to set up a feature.' } )
				};

				if ( 'scan' === feature && ! hasBusiness && ! hasPremium ) {
					if ( forceNotice ) {
						return this.getStatusNotice(
							'is-warning',
							__( 'Upgrade', { context: 'Caption for a button to purchase a paid feature.' } ),
							(
								<NoticeAction href={ 'https://jetpack.com/redirect/?source=upgrade&site=' + this.props.siteRawUrl }>
									{ __(
										'FIX IT',
										{ context: 'A caption for a small button to fix security issues.' }
									) }
								</NoticeAction>
							)
						);
					} else {
						return this.getStatusButton(
							'https://jetpack.com/redirect/?source=upgrade&site=' + this.props.siteRawUrl,
							__( 'Upgrade', { context: 'Caption for a button to purchase a paid feature.' } )
						);
					}
				}
			} else {
				btnVals = {
					href: 'https://jetpack.com/redirect/?source=upgrade&site=' + this.props.siteRawUrl,
					text: __( 'Upgrade', { context: 'Caption for a button to purchase a paid feature.' } )
				};
			}

			if ( active && installed ) {
				if ( forceNotice && 'scan' === feature ) {
					return this.getStatusNotice(
						'is-success',
						__( 'Secure', { context: 'Noun, a small message informing the user that their site is secure.' } )
					);
				}
				return (
					<span className="jp-dash-item__active-label">
						{ __( 'ACTIVE' ) }
					</span>
				);
			}

			return this.getStatusButton( btnVals.href, btnVals.text );
		}

		return active && installed && sitePlan.product_slug
			? <span className="jp-dash-item__active-label">{ __( 'ACTIVE' ) }</span>
			: '';
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
