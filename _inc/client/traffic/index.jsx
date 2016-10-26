/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import FoldableCard from 'components/foldable-card';
import Button from 'components/button';
import Gridicon from 'components/gridicon';
import { translate as __ } from 'i18n-calypso';
import includes from 'lodash/includes';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import {
	isModuleActivated as _isModuleActivated,
	activateModule,
	deactivateModule,
	isActivatingModule,
	isDeactivatingModule,
	getModule as _getModule,
	getModules
} from 'state/modules';
import { ModuleToggle } from 'components/module-toggle';
import { AllModuleSettings } from 'components/module-settings/modules-per-tab-page';
import { isUnavailableInDevMode } from 'state/connection';
import {
	getSiteAdminUrl,
	userCanManageModules,
	isSitePublic
} from 'state/initial-state';
import Settings from 'components/settings';

export const Traffic = ( props ) => {
	let {
		toggleModule,
		isModuleActivated,
		isTogglingModule,
		getModule
	} = props,
		isAdmin = props.userCanManageModules,
		sitemapsDesc = getModule( 'sitemaps' ).description,
		moduleList = Object.keys( props.moduleList );

	if ( ! props.isSitePublic() ) {
		sitemapsDesc = <span>
			{ sitemapsDesc }
			{ <p className="jp-form-setting-explanation">
				{ __( 'Your site must be accessible by search engines for this feature to work properly. You can change this in {{a}}Reading Settings{{/a}}.', {
					  components: {
						  a: <a href={ props.getSiteAdminUrl() + 'options-reading.php#blog_public' } className="jetpack-js-stop-propagation" />
					  }
				  } ) }
			</p> }
		</span>;
	}

	var cards = [
		[ 'sitemaps', getModule( 'sitemaps' ).name, sitemapsDesc, getModule( 'sitemaps' ).learn_more_button ],
		[ 'stats', getModule( 'stats' ).name, getModule( 'stats' ).description, getModule( 'stats' ).learn_more_button ],
		[ 'related-posts', getModule( 'related-posts' ).name, getModule( 'related-posts' ).description, getModule( 'related-posts' ).learn_more_button ],
		[ 'verification-tools', getModule( 'verification-tools' ).name, getModule( 'verification-tools' ).description, getModule( 'verification-tools' ).learn_more_button ]
	].map( ( element ) => {
		if ( ! includes( moduleList, element[0] ) ) {
			return null;
		}
		var unavailableInDevMode = props.isUnavailableInDevMode( element[0] ),
			toggle = (
				unavailableInDevMode ? __( 'Unavailable in Dev Mode' ) :
					<ModuleToggle slug={ element[0] } activated={ isModuleActivated( element[0] ) }
								toggling={ isTogglingModule( element[0] ) }
								toggleModule={ toggleModule } />
			),
			customClasses = unavailableInDevMode ? 'devmode-disabled' : '';

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
					isModuleActivated( element[0] ) ?
						<AllModuleSettings module={ getModule( element[0] ) } /> :
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
			getSiteAdminUrl: () => getSiteAdminUrl( state ),
			isSitePublic: () => isSitePublic( state ),
			userCanManageModules: userCanManageModules( state ),
			moduleList: getModules( state )
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
)( Traffic );
