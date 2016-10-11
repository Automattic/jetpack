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
import { userCanManageModules as _userCanManageModules } from 'state/initial-state';

export const Traffic = ( props ) => {
	let {
		toggleModule,
		isModuleActivated,
		isTogglingModule,
		getModule,
		userCanManageModules
	} = props,
		isAdmin = userCanManageModules,
		moduleList = Object.keys( props.moduleList );

	var unavailableInDevMode = props.isUnavailableInDevMode( 'sharedaddy' ),
		customClasses = unavailableInDevMode ? 'devmode-disabled' : '',
		toggle = '',
		adminAndNonAdmin = isAdmin || includes( nonAdminAvailable, 'sharedaddy' ),
		module = getModule( 'sharedaddy' );

	if ( unavailableInDevMode ) {
		toggle = __( 'Unavailable in Dev Mode' );
	} else if ( isAdmin ) {
		toggle = <ModuleToggle slug={ 'sharedaddy' }
							   activated={ isModuleActivated( 'sharedaddy' ) }
							   toggling={ isTogglingModule( 'sharedaddy' ) }
							   toggleModule={ toggleModule } />;
	}

	return (
		<div>
			<FoldableCard
				className={ customClasses }
				key="module-card_sharedaddy"
				header={ module.name }
				subheader={ module.description }
				summary={ toggle }
				expandedSummary={ toggle }
				clickableHeaderText={ true }
				onOpen={ () => analytics.tracks.recordEvent( 'jetpack_wpa_settings_card_open',
											 {
												 card: 'sharedaddy',
												 path: props.route.path
											 }
					) }
			>
				{ isModuleActivated( 'sharedaddy' ) ?
				  <AllModuleSettings module={ module } siteAdminUrl={ props.siteAdminUrl } /> :
				  // Render the long_description if module is deactivated
				  <div dangerouslySetInnerHTML={ renderLongDescription( module ) } />
				}
			<div className="jp-module-settings__read-more">
				<Button borderless compact href={ module.learn_more_button }>
					<Gridicon icon="help-outline" />
					<span className="screen-reader-text">{ __( 'Learn More' ) }</span>
				</Button>
			</div>
			</FoldableCard>
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
			isUnavailableInDevMode: ( module_name ) => isUnavailableInDevMode( state, module_name ),
			getModule: ( module_name ) => _getModule( state, module_name ),
			userCanManageModules: _userCanManageModules( state ),
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
