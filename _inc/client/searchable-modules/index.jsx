/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { Component } from 'react';
import { connect } from 'react-redux';
import forEach from 'lodash/forEach';
import includes from 'lodash/includes';
import { translate as __ } from 'i18n-calypso';
import Banner from 'components/banner';

/**
 * Internal dependencies
 */
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import { getModules } from 'state/modules';
import { isModuleFound } from 'state/search';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { userCanManageModules } from 'state/initial-state';
import { isDevMode, isUnavailableInDevMode } from 'state/connection';

export const SearchableModules = moduleSettingsForm(
	class extends Component {
		render() {
			// Only admins plz
			if ( ! this.props.canManageModules ) {
				return null;
			}

			// Only render if search terms present
			const searchTerms = this.props.searchTerm;
			if ( searchTerms.length < 3 ) {
				return null;
			}

			// Only should be features that don't already have a UI, and we want to reveal in search.
			const whitelist = [
				'contact-form',
				'custom-css',
				'enhanced-distribution',
				'json-api',
				'latex',
				'monitor',
				'notes',
				'shortcodes',
				'shortlinks',
				'widget-visibility',
				'widgets'
			];

			const allModules = this.props.modules,
				results = [];
			forEach( allModules, ( moduleData, slug ) => {
				if (
					this.props.isModuleFound( slug ) &&
					includes( whitelist, slug )
				) {
					// Not available in dev mode
					if ( this.props.isDevMode && this.props.isUnavailableInDevMode( moduleData.module ) ) {
						return results.push( <ActiveCard key={ slug } moduleData={ moduleData } devMode={ true } /> );
					}

					if ( this.props.getOptionValue( moduleData.module ) ) {
						results.push( <ActiveCard key={ slug } moduleData={ moduleData } /> );
					} else {
						results.push(
							<Banner
								className="jp-searchable-banner"
								key={ slug }
								callToAction={ __( 'Activate' ) }
								description={ moduleData.description }
								href="javascript:void( 0 )"
								icon="cog"
								onClick={ this.props.updateOptions.bind( null, { [ moduleData.module ]: true } ) }
								title={ moduleData.name }
							/>
						);
					}
				}
			} );

			return (
				<div>{ results }</div>
			);
		}
	}
);

SearchableModules.propTypes = {
	searchTerm: PropTypes.string
};

SearchableModules.defaultProps = {
	searchTerm: ''
};

class ActiveCard extends Component {
	render() {
		const m = this.props.moduleData,
			devMode = this.props.devMode;

		return (
			<SettingsCard
				header={ m.name }
				action={ m.module }
				hideButton>
				<SettingsGroup
					disableInDevMode={ devMode }
					module={ { module: m.module } }
					support={ m.learn_more_button }
				>
					{ m.description }
				</SettingsGroup>
			</SettingsCard>
		);
	}
}

export default connect(
	( state ) => {
		return {
			modules: getModules( state ),
			isModuleFound: ( module_name ) => isModuleFound( state, module_name ),
			canManageModules: userCanManageModules( state ),
			isUnavailableInDevMode: module_name => isUnavailableInDevMode( state, module_name ),
			isDevMode: isDevMode( state )
		};
	}
)( SearchableModules );
