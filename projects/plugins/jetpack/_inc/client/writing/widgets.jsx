import { getRedirectUrl } from '@automattic/jetpack-components';
import { __, _x } from '@wordpress/i18n';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getModule } from 'state/modules';
import { isModuleFound } from 'state/search';

class Widgets extends Component {
	render() {
		const foundWidgets = this.props.isModuleFound( 'widgets' );
		const foundWidgetVisibility = this.props.isModuleFound( 'widget-visibility' );

		if ( ! foundWidgets && ! foundWidgetVisibility ) {
			return null;
		}

		return (
			<SettingsCard
				{ ...this.props }
				header={ _x( 'Widgets', 'Settings header', 'jetpack' ) }
				module="widgets"
				hideButton
			>
				{ foundWidgets && (
					<SettingsGroup
						module={ { module: 'widgets' } }
						support={ {
							text: this.props.widgetsModule.description,
							link: getRedirectUrl( 'jetpack-support-extra-sidebar-widgets' ),
						} }
					>
						<ModuleToggle
							slug="widgets"
							activated={ this.props.widgetsActive }
							toggling={ this.props.isSavingAnyOption( 'widgets' ) }
							toggleModule={ this.props.toggleModuleNow }
						>
							{ __(
								'Make extra widgets available for use on your site including subscription forms and Twitter streams',
								'jetpack'
							) }
						</ModuleToggle>
					</SettingsGroup>
				) }
				{ foundWidgetVisibility && (
					<SettingsGroup
						module={ { module: 'widget-visibility' } }
						support={ {
							text: __(
								'Widget visibility lets you decide which widgets appear on which pages, so you can finely tailor widget content.',
								'jetpack'
							),
							link: getRedirectUrl( 'jetpack-support-widget-visibility' ),
						} }
					>
						<ModuleToggle
							slug="widget-visibility"
							activated={ this.props.widgetVisibilityActive }
							toggling={ this.props.isSavingAnyOption( 'widget-visibility' ) }
							toggleModule={ this.props.toggleModuleNow }
						>
							{ __(
								'Enable widget visibility controls to display widgets only on particular posts or pages',
								'jetpack'
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
