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

class Shortlinks extends Component {
	render() {
		const isLinked = this.props.isLinked;

		return (
			<SettingsCard
				{ ...this.props }
				header={ __( 'Shortlinks', { context: 'Settings header' } ) }
				module="shortlinks"
				hideButton
			>
				<SettingsGroup
					module={ { module: 'shortlinks' } }
					support={ {
						text: this.props.shortlinksModule.description,
						link: 'https://jetpack.com/support/shortlinks/',
					} }
				>
					<ModuleToggle
						slug="shortlinks"
						disabled={ ! isLinked }
						activated={ this.props.shortlinksActive }
						toggling={ this.props.isSavingAnyOption( 'shortlinks' ) }
						toggleModule={ this.props.toggleModuleNow }
					>
						{ __( 'Create short and simple links for all posts and pages' ) }
					</ModuleToggle>
				</SettingsGroup>
			</SettingsCard>
		);
	}
}

export default withModuleSettingsFormHelpers(
	connect( ( state, ownProps ) => {
		return {
			shortlinksActive: ownProps.getOptionValue( 'shortlinks' ),
			shortlinksModule: getModule( state, 'shortlinks' ),
		};
	} )( Shortlinks )
);
