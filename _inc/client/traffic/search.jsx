/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { getSiteAdminUrl } from 'state/initial-state';

export const Search = moduleSettingsForm(
	React.createClass( {
		render() {
			const search = this.props.getModule( 'search' );

			return (
				<SettingsCard
					{ ...this.props }
					module="search"
					hideButton
				>
					<SettingsGroup module={ { module: 'search' } } hasChild support={ search.learn_more_button }>
						<ModuleToggle
							slug="search"
							compact
							activated={ this.props.getOptionValue( 'search' ) }
							toggling={ this.props.isSavingAnyOption( 'search' ) }
							toggleModule={ this.props.toggleModuleNow }>
							{ __( 'Enhanced site-wide search, powered by ElasticSearch (Beta)' ) }
						</ModuleToggle>
					</SettingsGroup>
				</SettingsCard>
			);
		}
	} )
);

export default connect(
	state => {
		return {
			siteAdminUrl: getSiteAdminUrl( state )
		};
	}
)( Search );
