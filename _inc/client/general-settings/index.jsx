/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import FoldableCard from 'components/foldable-card';
import Settings from 'components/settings';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import ConnectionSettings from './connection-settings';
import { disconnectSite } from 'state/connection';
import { isDevMode } from 'state/connection';
import {
	isModuleActivated as _isModuleActivated,
	activateModule,
	deactivateModule,
	isActivatingModule,
	isDeactivatingModule,
	getModule as _getModule
} from 'state/modules';
import { ModuleToggle } from 'components/module-toggle';

const GeneralSettings = React.createClass( {
	render() {
		let nonAdmin = ! window.Initial_State.userData.currentUser.permissions.manage_modules;
		const toggle = ( module_name ) =>
			<ModuleToggle
				slug={ module_name }
				activated={ this.props.isModuleActivated( module_name ) }
				toggling={ this.props.isTogglingModule( module_name ) }
				toggleModule={ this.props.toggleModule }
			/>;

		const moduleCard = ( module_slug, requires_connection = true ) =>
			<FoldableCard
				header={ this.props.getModule( module_slug ).name }
				subheader={ this.props.getModule( module_slug ).description }
				clickableHeaderText={ true }
				disabled={ ( isDevMode( this.props ) && requires_connection ) || nonAdmin }
				summary={ nonAdmin ? '' : toggle( module_slug ) }
				expandedSummary={ nonAdmin ? '' : toggle( module_slug ) }
			>
				<div dangerouslySetInnerHTML={ renderLongDescription( this.props.getModule( module_slug ) ) } />
				<a href={ this.props.getModule( module_slug ).learn_more_button } target="_blank">{ __( 'Learn More' ) }</a>
			</FoldableCard>;

		const maybeShowManage = this.props.isModuleActivated( 'manage' ) ? '' : moduleCard( 'manage' );

		return(
			<div>
				<FoldableCard
					header={ __( 'Connection Settings' ) }
					subheader={ __( 'Manage your connected user accounts or disconnect.' ) }
					clickableHeaderText={ true }
					disabled={ isDevMode( this.props ) }
				>
					<ConnectionSettings { ...this.props } />
				</FoldableCard>
				{ maybeShowManage }
				{ moduleCard( 'notes' ) }
				{ moduleCard( 'json-api' ) }
				<FoldableCard
					header={ __( 'Miscellaneous Settings' ) }
					subheader={ __( 'Manage Snow and other fun things for your site.' ) }
					clickableHeaderText={ true }
					disabled={ nonAdmin }
				>
					<Settings />
				</FoldableCard>
			</div>
		);
	}
} );

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
			isTogglingModule: ( module_name ) =>
			isActivatingModule( state, module_name ) || isDeactivatingModule( state, module_name )
		};
	},
	( dispatch ) => {
		return {
			toggleModule: ( module_name, activated ) => {
				return ( activated )
					? dispatch( deactivateModule( module_name ) )
					: dispatch( activateModule( module_name ) );
			},
			fetchPluginsData: () => dispatch( fetchPluginsData() ),
			disconnectSite: () => dispatch( disconnectSite )
		};
	}
)( GeneralSettings );