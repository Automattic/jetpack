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
import { isModuleFound } from 'state/search';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { ModuleToggle } from 'components/module-toggle';

class Widgets extends Component {
	render() {
		const isLinked = this.props.isLinked;
		const foundWidgets = this.props.isModuleFound( 'widgets' );
		const foundWidgetVisibility = this.props.isModuleFound( 'widget-visibility' );

		if ( ! foundWidgets && ! foundWidgetVisibility ) {
			return null;
		}

		return (
			<SettingsCard
				{ ...this.props }
				header={ __( 'Widgets', { context: 'Settings header' } ) }
				module="widgets"
				hideButton
			>
				{ foundWidgets && (
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
				) }
				{ foundWidgetVisibility && (
					<SettingsGroup
						module={ { module: 'widget-visibility' } }
						support={ {
							text: __(
								'Widget visibility lets you decide which widgets appear on which pages, so you can finely tailor widget content.'
							),
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
							{ __(
								'Enable widget visibility controls to display widgets only on particular posts or pages'
							) }
						</ModuleToggle>
					</SettingsGroup>
				) }
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
			isModuleFound: module_name => isModuleFound( state, module_name ),
		};
	} )( Widgets )
);
