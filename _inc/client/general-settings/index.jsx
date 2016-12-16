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
import ConnectionSettings from './connection-settings';
import { disconnectSite, isUnavailableInDevMode } from 'state/connection';
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
import { userCanManageModules } from 'state/initial-state';

export const GeneralSettings = ( props ) => {
	let {
		toggleModule,
		isModuleActivated,
		isTogglingModule,
		getModule
	} = props,
		isAdmin = props.userCanManageModules,
		moduleList = Object.keys( props.moduleList );

	const moduleCard = ( module_slug ) => {
		var unavailableInDevMode = props.isUnavailableInDevMode( module_slug ),
			customClasses = unavailableInDevMode ? 'devmode-disabled' : '',
			toggle = '';

		if ( unavailableInDevMode ) {
			toggle = () => __( 'Unavailable in Dev Mode' );
		} else if ( isAdmin ) {
			toggle = ( module_name ) =>
				<ModuleToggle
					slug={ module_name }
					activated={ isModuleActivated( module_name ) }
					toggling={ isTogglingModule( module_name ) }
					toggleModule={ toggleModule }
				/>;
		}

		if ( ! isAdmin || ! includes( moduleList, module_slug ) ) {
			return null;
		}

		return (
			<FoldableCard
				className={ customClasses }
				header={ getModule( module_slug ).name }
				subheader={ getModule( module_slug ).description }
				clickableHeaderText={ true }
				disabled={ ! isAdmin }
				summary={ isAdmin ? toggle( module_slug ) : '' }
				expandedSummary={ isAdmin ? toggle( module_slug ) : '' }
				onOpen={ () => analytics.tracks.recordEvent( 'jetpack_wpa_settings_card_open',
					{
						card: module_slug,
						path: props.route.path
					}
				) }
			>
				<div className="jp-form-setting-explanation"><div dangerouslySetInnerHTML={ renderLongDescription( getModule( module_slug ) ) } /></div>
				<div className="jp-module-settings__learn-more">
					<Button borderless compact href={ getModule( module_slug ).learn_more_button }><Gridicon icon="help-outline" /><span className="screen-reader-text">{ __( 'Learn More' ) }</span></Button>
				</div>
			</FoldableCard>
		);
	};

	return (
		<div>
			<FoldableCard
				header={ __( 'Connection Settings' ) }
				subheader={ __( 'Manage your Jetpack connection.' ) }
				clickableHeaderText={ true }
				onOpen={ () => analytics.tracks.recordEvent( 'jetpack_wpa_settings_card_open',
					{
						card: 'connection_settings',
						path: props.route.path
					}
				) }
			>
				<ConnectionSettings { ...props } />
			</FoldableCard>
			{ isModuleActivated( 'manage' ) ? '' : moduleCard( 'manage' ) }
			{ moduleCard( 'notes' ) }
			{ moduleCard( 'json-api' ) }
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
			getModule: ( module_name ) => _getModule( state, module_name ),
			isTogglingModule: ( module_name ) => isActivatingModule( state, module_name ) || isDeactivatingModule( state, module_name ),
			isUnavailableInDevMode: ( module_name ) => isUnavailableInDevMode( state, module_name ),
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
			},
			disconnectSite: () => dispatch( disconnectSite )
		};
	}
)( GeneralSettings );
