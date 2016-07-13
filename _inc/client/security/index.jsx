/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import FoldableCard from 'components/foldable-card';
import { translate as __ } from 'i18n-calypso';

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
import { isUnavailableInDevMode } from 'state/connection';

export const Page = ( props ) => {
	let {
		toggleModule,
		isModuleActivated,
		isTogglingModule,
		getModule
		} = props;
	var cards = [
		[ 'scan', __( 'Security Scanning' ), __( 'Automatically scan your site for common threats and attacks.' ) ],
		[ 'protect', getModule( 'protect' ).name, getModule( 'protect' ).description, getModule( 'protect' ).learn_more_button ],
		[ 'monitor', getModule( 'monitor' ).name, getModule( 'monitor' ).description, getModule( 'monitor' ).learn_more_button ],
		[ 'akismet', 'Akismet', __( 'Keep those spammers away!' ) ],
		[ 'backups', __( 'Site Backups' ), __( 'Keep your site backed up!' ) ],
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
			isScan = 'scan' === element[0],
			scanProps = {};

		if ( isScan ) {
			toggle = '';
			scanProps = {
				module: 'scan',
				isFetchingPluginsData: props.isFetchingPluginsData,
				isVaultPressInstalled: props.isPluginInstalled( 'vaultpress/vaultpress.php' ),
				isVaultPressActive: props.isPluginActive( 'vaultpress/vaultpress.php' )
			};
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
					isModuleActivated( element[0] ) || isScan ?
						<SecurityModulesSettings module={ isScan ? scanProps : getModule( element[ 0 ] ) } /> :
						// Render the long_description if module is deactivated
						<div dangerouslySetInnerHTML={ renderLongDescription( getModule( element[0] ) ) } />
				}
				<br/>
				<a href={ element[3] } target="_blank">{ __( 'Learn More' ) }</a>
			</FoldableCard>
		);
	} );

	return (
		<div>
			<QuerySitePlugins />
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
			isPluginInstalled: ( plugin_slug ) => isPluginInstalled( state, plugin_slug )
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
