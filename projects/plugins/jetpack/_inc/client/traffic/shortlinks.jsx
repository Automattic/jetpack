import { getRedirectUrl } from '@automattic/jetpack-components';
import { __, _x } from '@wordpress/i18n';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getModule } from 'state/modules';

class Shortlinks extends Component {
	render() {
		const { isSiteConnected } = this.props;

		return (
			<SettingsCard
				{ ...this.props }
				header={ _x( 'WP.me Shortlinks', 'Settings header', 'jetpack' ) }
				module="shortlinks"
				hideButton
			>
				<SettingsGroup
					module={ { module: 'shortlinks' } }
					support={ {
						text: this.props.shortlinksModule.description,
						link: getRedirectUrl( 'jetpack-support-shortlinks' ),
					} }
					disableInOfflineMode
				>
					<ModuleToggle
						slug="shortlinks"
						disabled={ ! isSiteConnected }
						activated={ this.props.shortlinksActive }
						toggling={ this.props.isSavingAnyOption( 'shortlinks' ) }
						toggleModule={ this.props.toggleModuleNow }
					>
						{ __( 'Generate shortened URLs for simpler sharing.', 'jetpack' ) }
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
