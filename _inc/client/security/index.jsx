/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import FoldableCard from 'components/foldable-card';
import Button from 'components/button';
import Gridicon from 'components/gridicon';
import { translate as __ } from 'i18n-calypso';
import SimpleNotice from 'components/notice';

/**
 * Internal dependencies
 */
import {
	isModuleActivated as _isModuleActivated,
	activateModule,
	deactivateModule,
	isActivatingModule,
	isDeactivatingModule,
	getModule as _getModule
} from 'state/modules';
import { ModuleToggle } from 'components/module-toggle';
import { SecurityModulesSettings } from 'components/module-settings/modules-per-tab-page';
import {
	fetchPluginsData,
	isFetchingPluginsData,
	isPluginActive,
	isPluginInstalled
} from 'state/site/plugins';
import QuerySitePlugins from 'components/data/query-site-plugins';
import QuerySite from 'components/data/query-site';
import {
	getSitePlan,
	isFetchingSiteData
} from 'state/site';
import QueryVaultPressData from 'components/data/query-vaultpress-data';
import {
	getVaultPressScanThreatCount as _getVaultPressScanThreatCount,
	getVaultPressData as _getVaultPressData
} from 'state/at-a-glance';
import { isUnavailableInDevMode } from 'state/connection';
import QueryAkismetData from 'components/data/query-akismet-data';
import {
	getAkismetData as _getAkismetData
} from 'state/at-a-glance';

export const Page = ( props ) => {
	let {
		toggleModule,
		isModuleActivated,
		isTogglingModule,
		getModule,
		getSitePlan,
		isFetchingSiteData
		} = props;
	var cards = [
		[ 'scan', __( 'Security Scanning' ), __( 'Automatically scan your site for common threats and attacks.' ) ],
		[ 'protect', getModule( 'protect' ).name, getModule( 'protect' ).description, getModule( 'protect' ).learn_more_button ],
		[ 'monitor', getModule( 'monitor' ).name, getModule( 'monitor' ).description, getModule( 'monitor' ).learn_more_button ],
		[ 'akismet', 'Akismet', __( 'Keep those spammers away!' ), 'https://akismet.com/jetpack/' ],
		[ 'backups', __( 'Site Backups' ), __( 'Keep your site backed up!' ), 'https://vaultpress.com/jetpack/' ],
		[ 'sso', getModule( 'sso' ).name, getModule( 'sso' ).description, getModule( 'sso' ).learn_more_button ]
	].map( ( element ) => {
		var unavailableInDevMode = isUnavailableInDevMode( props, element[0] ),
			toggle = (
				unavailableInDevMode ? __( 'Unavailable in Dev Mode' ) :
				<ModuleToggle slug={ element[0] } activated={ isModuleActivated( element[0] ) }
					toggling={ isTogglingModule( element[0] ) }
					toggleModule={ toggleModule } />
			),
			customClasses = unavailableInDevMode ? 'devmode-disabled' : '',
			isPro = 'scan' === element[0] || 'akismet' === element[0] || 'backups' === element[0],
			proProps = {};

		let getProToggle = ( active, installed ) => {
			let pluginSlug = 'scan' === element[0] || 'backups' === element[0] ?
				'vaultpress' :
				'akismet';

			let vpData = props.getVaultPressData();

			if ( 'N/A' !== vpData && 'scan' === element[0] ) {
				if ( 0 !== props.getScanThreats() ) {
					return(
						<SimpleNotice
							showDismiss={ false }
							status='is-error'
							isCompact={ true }
						>
							{ __( 'Threats found!' ) }
						</SimpleNotice>
					);
				}
			}

			if ( 'akismet' === element[0] ) {
				const akismetData = props.getAkismetData();
				if ( akismetData === 'invalid_key' ) {
					return(
						<SimpleNotice
							showDismiss={ false }
							status='is-warning'
							isCompact={ true }
						>
							{ __( 'Invalid Key' ) }
						</SimpleNotice>
					);
				}
			}

			if ( false !== getSitePlan() ) {
				if ( active && installed ) {
					return (
						__( 'ACTIVE' )
					);
				} else {
					return (
						<Button
							compact={ true }
							primary={ true }
							href={ 'https://wordpress.com/plugins/' + pluginSlug + '/' + window.Initial_State.rawUrl }
						>
							{ ! installed ? __( 'Install' ) : __( 'Activate' ) }
						</Button>
					);
				}
			} else {
				if ( active && installed ) {
					return (
						__( 'ACTIVE' )
					);
				} else {
					return (
						<Button
							compact={ true }
							primary={ true }
							href={ 'https://wordpress.com/plans/' + window.Initial_State.rawUrl }
						>
							{ __( 'Upgrade' ) }
						</Button>
					);
				}
			}
		};

		if ( isPro ) {
			proProps = {
				module: element[0],
				isFetchingPluginsData: props.isFetchingPluginsData,
				isProPluginInstalled: 'backups' === element[0] || 'scan' === element[0] ?
					props.isPluginInstalled( 'vaultpress/vaultpress.php' ) :
					props.isPluginInstalled( 'akismet/akismet.php' ),
				isProPluginActive: 'backups' === element[0] || 'scan' === element[0] ?
					props.isPluginActive( 'vaultpress/vaultpress.php' ) :
					props.isPluginActive( 'akismet/akismet.php' )
			};
			toggle = ! isFetchingSiteData ? getProToggle( proProps.isProPluginActive, proProps.isProPluginInstalled ) : '';

			// Add a "pro" button next to the header title
			element[1] = <span>
				{ element[1] }
				<Button
					compact={ true }
				    href="#professional"
				>
					{ __( 'Pro' ) }
				</Button>
			</span>
		}

		return (
			<FoldableCard
				className={ customClasses }
				key={ `module-card_${element[0]}` /* https://fb.me/react-warning-keys */ }
				header={ element[1] }
				subheader={ element[2] }
				summary={ toggle }
				expandedSummary={ toggle }
				clickableHeaderText={ true } >
				{
					isModuleActivated( element[0] ) || isPro ?
						<SecurityModulesSettings module={ isPro ? proProps : getModule( element[ 0 ] ) } /> :
						// Render the long_description if module is deactivated
						<div dangerouslySetInnerHTML={ renderLongDescription( getModule( element[0] ) ) } />
				}
				<div className="jp-module-settings__read-more">
					<Button borderless compact href={ element[3] }><Gridicon icon="help-outline" /><span className="screen-reader-text">{ __( 'Learn More' ) }</span></Button>
				</div>
			</FoldableCard>
		);
	} );

	return (
		<div>
			<QuerySite />
			<QuerySitePlugins />
			<QueryVaultPressData />
			<QueryAkismetData />
			{ cards }
		</div>
	);
};

function renderLongDescription( module ) {
	// Rationale behind returning an object and not just the string
	// https://facebook.github.io/react/tips/dangerously-set-inner-html.html
	return { __html: module.long_description };
}

export default connect(
	( state ) => {
		return {
			isModuleActivated: ( module_name ) => _isModuleActivated( state, module_name ),
			isTogglingModule: ( module_name ) =>
				isActivatingModule( state, module_name ) || isDeactivatingModule( state, module_name ),
			getModule: ( module_name ) => _getModule( state, module_name ),
			isFetchingPluginsData: isFetchingPluginsData( state ),
			isPluginActive: ( plugin_slug ) => isPluginActive( state, plugin_slug ),
			isPluginInstalled: ( plugin_slug ) => isPluginInstalled( state, plugin_slug ),
			getSitePlan: () => getSitePlan( state ),
			isFetchingSiteData: isFetchingSiteData( state ),
			getScanThreats: () => _getVaultPressScanThreatCount( state ),
			getVaultPressData: () => _getVaultPressData( state ),
			getAkismetData: () => _getAkismetData( state ),
		};
	},
	( dispatch ) => {
		return {
			toggleModule: ( module_name, activated ) => {
				return ( activated )
					? dispatch( deactivateModule( module_name ) )
					: dispatch( activateModule( module_name ) );
			},
			fetchPluginsData: () => dispatch( fetchPluginsData() )
		};
	}
)( Page );
