import { getRedirectUrl } from '@automattic/jetpack-components';
import { __, _x } from '@wordpress/i18n';
import { Component } from 'react';
import { connect } from 'react-redux';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import { FeaturesPointer } from 'components/pointer-card';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import {
	WIDGET_MODULES,
	isDeprecatedInFeatures as _isDeprecatedInFeatures,
	isMovedOut,
	isSwitchedInFeatures as _isSwitchedInFeatures,
} from 'lib/settings-consolidation';
import { getModule, isModuleActivated as _isModuleActivated } from 'state/modules';
import { getSearchTerm, isModuleFound as _isModuleFound } from 'state/search';

class Widgets extends Component {
	render() {
		const { isModuleFound, isSwitchedInFeatures } = this.props,
			isFound = module => ! isSwitchedInFeatures( module ) && isModuleFound( module ),
			foundWidgets = isFound( 'widgets' ),
			foundWidgetVisibility = isFound( 'widget-visibility' ),
			pointedModules = this.props.searchTerm
				? WIDGET_MODULES.filter(
						module => isSwitchedInFeatures( module ) && isModuleFound( module )
					)
				: [];

		// Features switches both or neither.
		if ( ! foundWidgets && ! foundWidgetVisibility ) {
			return pointedModules.map( module => {
				const { name } = this.props.module( module );
				// Features links Extra Sidebar Widgets to the Customizer only while it is on, off a block theme.
				return (
					<FeaturesPointer
						key={ module }
						header={ name }
						name={ name }
						search={ name }
						linksToSettings={
							module === 'widgets' &&
							this.props.isModuleActivated( module ) &&
							! this.props.isDeprecatedInFeatures( module )
						}
					/>
				);
			} );
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
							wpcomLink: 'https://wordpress.com/support/widgets/',
						} }
					>
						<ModuleToggle
							slug="widgets"
							disabled={ this.props.isSavingAnyOption( 'widgets' ) }
							activated={ this.props.widgetsActive }
							toggleModule={ this.props.toggleModuleNow }
						>
							<span className="jp-form-toggle-explanation">
								{ __(
									'Make extra widgets available for use on your site including subscription forms and more',
									'jetpack'
								) }
							</span>
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
							wpcomLink: 'https://wordpress.com/support/widgets/',
						} }
					>
						<ModuleToggle
							slug="widget-visibility"
							disabled={ this.props.isSavingAnyOption( 'widget-visibility' ) }
							activated={ this.props.widgetVisibilityActive }
							toggleModule={ this.props.toggleModuleNow }
						>
							<span className="jp-form-toggle-explanation">
								{ __(
									'Enable widget visibility controls to display widgets only on particular posts or pages',
									'jetpack'
								) }
							</span>
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
			module: module_name => getModule( state, module_name ),
			isModuleFound: module_name =>
				! isMovedOut( module_name, state ) && _isModuleFound( state, module_name ),
			isModuleActivated: module_name => _isModuleActivated( state, module_name ),
			isSwitchedInFeatures: module_name => _isSwitchedInFeatures( state, module_name ),
			isDeprecatedInFeatures: module_name => _isDeprecatedInFeatures( state, module_name ),
			searchTerm: getSearchTerm( state ),
		};
	} )( Widgets )
);
