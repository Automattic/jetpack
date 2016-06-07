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
import {
	fetchPluginsData,
	isFetchingPluginsData,
	isPluginActive,
	isPluginInstalled
} from 'state/site/plugins';
import QuerySitePlugins from 'components/data/query-site-plugins';

export const Page = ( props ) => {
	let {
		toggleModule,
		isModuleActivated,
		isTogglingModule,
		getModule
		} = props;
	var cards = [
		[ 'manage', getModule( 'manage' ).name, getModule( 'manage' ).description, getModule( 'manage' ).learn_more_button ],
		[ 'backups', __( 'Site Backups' ), __( 'Keep your site backed up!' ) ],
		[ 'akismet', 'Akismet', __( 'Keep those spammers away!' ) ]
	].map( ( element ) => {
		var toggle = (
			<ModuleToggle slug={ element[0] } activated={ isModuleActivated( element[0] ) }
				toggling={ isTogglingModule( element[0] ) }
				toggleModule={ toggleModule } />
		);

		if ( 'backups' === element[0] || 'akismet' === element[0] ) {
			toggle = '';
		}

		return (
			<FoldableCard key={ `module-card_${element[0]}` /* https://fb.me/react-warning-keys */ }
				header={ element[1] }
				subheader={ element[2] }
				summary={ toggle }
				expandedSummary={ toggle }
				clickableHeaderText={ true }
			>
				{ isModuleActivated( element[0] ) || 'akismet' === element[0] || 'backups' === element[0] ? renderSettings( element[0], props ) :
					// Render the long_description if module is deactivated
					<div dangerouslySetInnerHTML={ renderLongDescription( getModule( element[0] ) ) } />
				}
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

function renderSettings( module, props ) {
	switch ( module ) {
		case 'manage':
			return <div>{ __( 'This module has no configuration options' ) } </div>;
		case 'akismet':
			if ( props.isFetchingPluginsData ) {
				return ( __( 'Loading...' ) );
			}
			var slug = 'akismet/akismet.php';
			return (
				<div>{
					props.isPluginActive( slug ) ?
						__( 'Please go to {{a}}Akismet Settings{{/a}} to configure.', {
							components: {
								a: <a href={ Initial_State.adminUrl + 'admin.php?page=akismet-key-config' } />
							}
						} )
						:
						props.isPluginInstalled( slug ) ?
							__( 'Please go to {{a}}Plugins{{/a}} and activate Akismet.', {
								components: {
									a: <a href={ Initial_State.adminUrl + 'plugins.php' } />
								}
							} )
							:
							__( 'Please go to {{a}}Plugins{{/a}}, install Akismet and activate it.', {
								components: {
									a: <a href={ Initial_State.adminUrl + 'plugins.php' } />
								}
							} )
				}
				</div> );
		case 'backups':
			if ( props.isFetchingPluginsData ) {
				return ( __( 'Loading...' ) );
			}
			var slug = 'vaultpress/vaultpress.php';
			return (
				<div>{
					props.isPluginActive( slug ) ?
						__( 'Please go to {{a}}VaultPress Settings{{/a}} to configure', {
							components: {
								a: <a href={ Initial_State.adminUrl + 'admin.php?page=vaultpress' } />
							}
						} )
						:
						props.isPluginInstalled( slug ) ?
							__( 'Please go to {{a}}Plugins{{/a}} and activate VaultPress.', {
								components: {
									a: <a href={ Initial_State.adminUrl + 'plugins.php' } />
								}
							} )
							:
							__( 'Please go to {{a}}Plugins{{/a}}, install VaultPress and activate it.', {
								components: {
									a: <a href={ Initial_State.adminUrl + 'plugins.php' } />
								}
							} )
				}
				</div> );
		default:
			return (
				<div>
					<a href={ module.configure_url }>{ __( 'Link to old settings' ) }</a>
				</div>
			);
	}
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
