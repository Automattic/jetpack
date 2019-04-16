/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
/**
 * Internal dependencies
 */
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { getModule } from 'state/modules';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { ModuleToggle } from 'components/module-toggle';

class Widgets extends Component {
	render() {
		const isLinked = this.props.isLinked;

		return (
			<SettingsCard
				{ ...this.props }
				header={ __( 'Widgets', { context: 'Settings header' } ) }
				module="widgets"
				hideButton
			>
				<SettingsGroup
					module={ { module: 'widgets' } }
					support={ {
						text: this.props.widgetsModule.description,
						link: 'https://jetpack.com/support/extra-sidebar-widgets/',
					} }
				>
					<ModuleToggle
						slug="widgets"
						disabled={ ! isLinked }
						activated={ this.props.widgetsActive }
						toggling={ this.props.isSavingAnyOption( 'widgets' ) }
						toggleModule={ this.props.toggleModuleNow }
					>
						{ __(
							'Make extra widgets available for use on your site including subscription forms and Twitter streams'
						) }
					</ModuleToggle>
				</SettingsGroup>
				<SettingsGroup
					module={ { module: 'widget-visibility' } }
					support={ {
						text: __( 'Configure widgets to appear only on certain posts or pages.' ),
						link: 'https://jetpack.com/support/widget-visibility/',
					} }
				>
					<ModuleToggle
						slug="widget-visibility"
						disabled={ ! isLinked }
						activated={ this.props.widgetVisibilityActive }
						toggling={ this.props.isSavingAnyOption( 'widget-visibility' ) }
						toggleModule={ this.props.toggleModuleNow }
					>
						{ __( 'Control where widgets appear on your site with visibility settings' ) }
					</ModuleToggle>
				</SettingsGroup>
			</SettingsCard>
		);
	}
}

export default withModuleSettingsFormHelpers(
	connect( ( state, ownProps ) => {
		return {
			widgetVisibilityActive: ownProps.getOptionValue( 'widget-visibility' ),
			widgetsActive: ownProps.getOptionValue( 'widgets' ),
			widgetsModule: getModule( state, 'widgets' ),
		};
	} )( Widgets )
);
