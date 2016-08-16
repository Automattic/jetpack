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
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import QuerySite from 'components/data/query-site';
import ProStatus from 'pro-status';
import {
	isModuleActivated as _isModuleActivated,
	activateModule,
	deactivateModule,
	isActivatingModule,
	isDeactivatingModule,
	getModule as _getModule
} from 'state/modules';
import { ModuleToggle } from 'components/module-toggle';
import { AllModuleSettings } from 'components/module-settings/modules-per-tab-page';
import { isUnavailableInDevMode } from 'state/connection';
import {
	isFetchingPluginsData,
	isPluginActive,
	isPluginInstalled
} from 'state/site/plugins';

export const Page = ( props ) => {
	let {
		toggleModule,
		isModuleActivated,
		isTogglingModule,
		getModule
		} = props;
	var cards = [
		[ 'scan', __( 'Security Scanning' ), __( 'Automated, comprehensive protection from threats and attacks.' ), 'https://vaultpress.com/jetpack/' ],
		[ 'protect', getModule( 'protect' ).name, getModule( 'protect' ).description, getModule( 'protect' ).learn_more_button ],
		[ 'monitor', getModule( 'monitor' ).name, getModule( 'monitor' ).description, getModule( 'monitor' ).learn_more_button ],
		[ 'akismet', 'Akismet', __( 'State-of-the-art spam defense.' ), 'https://akismet.com/jetpack/' ],
		[ 'backups', __( 'Site Backups' ), __( 'Automatically backup your entire site.' ), 'https://vaultpress.com/jetpack/' ],
		[ 'sso', getModule( 'sso' ).name, getModule( 'sso' ).description, getModule( 'sso' ).learn_more_button ]
	].map( ( element ) => {
		var unavailableInDevMode = props.isUnavailableInDevMode( element[0] ),
			toggle = (
				unavailableInDevMode ? __( 'Unavailable in Dev Mode' ) :
				<ModuleToggle slug={ element[0] } activated={ isModuleActivated( element[0] ) }
					toggling={ isTogglingModule( element[0] ) }
					toggleModule={ toggleModule } />
			),
			customClasses = unavailableInDevMode ? 'devmode-disabled' : '',
			isPro = 'scan' === element[0] || 'akismet' === element[0] || 'backups' === element[0],
			proProps = {},
			moduleSettings;

		if ( isPro ) {
			// Add a "pro" button next to the header title
			element[1] = <span>
				{ element[1] }
				<Button
					compact={ true }
					href="#professional"
				>
					{ __( 'Pro' ) }
				</Button>
			</span>;

			toggle = <ProStatus proFeature={ element[0] } />;
		}

		if ( isModuleActivated( element[0] ) || isPro ) {
			proProps.module = element[0];
			if ( ! props.isFetchingPluginsData ) {
				if ( 'akismet' === element[0] && props.isPluginActive( 'akismet/akismet.php' ) ) {
					proProps.configure_url = props.siteAdminUrl + 'admin.php?page=akismet-key-config';
				} else if ( ( 'scan' === element[0] || 'vaultpress' === element[0] ) && props.isPluginActive( 'vaultpress/vaultpress.php' ) ) {
					proProps.configure_url = 'https://dashboard.vaultpress.com/';
				}
			}
			moduleSettings = <AllModuleSettings module={ isPro ? proProps : getModule( element[ 0 ] ) } />;
		} else {
			// Render the long_description if module is deactivated
			moduleSettings = <div dangerouslySetInnerHTML={ renderLongDescription( getModule( element[0] ) ) } />;
		}

		return (
			<FoldableCard
				className={ customClasses }
				key={ `module-card_${element[0]}` /* https://fb.me/react-warning-keys */ }
				header={ element[1] }
				subheader={ element[2] }
				summary={ toggle }
				expandedSummary={ toggle }
				clickableHeaderText={ true }
				onOpen={ () => analytics.tracks.recordEvent( 'jetpack_wpa_settings_card_open',
					{
						card: element[0],
						path: props.route.path
					}
				) }
			>
				{
					moduleSettings
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
			isUnavailableInDevMode: ( module_name ) => isUnavailableInDevMode( state, module_name ),
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
			}
		};
	}
)( Page );
