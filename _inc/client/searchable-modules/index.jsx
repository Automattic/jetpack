/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { includes, forEach } from 'lodash';
import { translate as __ } from 'i18n-calypso';
import Banner from 'components/banner';

/**
 * Internal dependencies
 */
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { getModules } from 'state/modules';
import { isModuleFound } from 'state/search';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { userCanManageModules } from 'state/initial-state';
import { isDevMode, isUnavailableInDevMode } from 'state/connection';

export const SearchableModules = withModuleSettingsFormHelpers(
	class extends Component {
		handleBannerClick = module => {
			return () => this.props.updateOptions( { [ module ]: true } );
		};

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
			const safelist = [ 'contact-form', 'enhanced-distribution', 'json-api', 'notes' ];

			const allModules = this.props.modules,
				results = [];
			forEach( allModules, ( moduleData, slug ) => {
				if ( this.props.isModuleFound( slug ) && includes( safelist, slug ) ) {
					// Not available in dev mode
					if ( this.props.isDevMode && this.props.isUnavailableInDevMode( moduleData.module ) ) {
						return results.push(
							<ActiveCard key={ slug } moduleData={ moduleData } devMode={ true } />
						);
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
								onClick={ this.handleBannerClick( moduleData.module ) }
								title={ moduleData.name }
							/>
						);
					}
				}
			} );

			return <div>{ results }</div>;
		}
	}
);

SearchableModules.propTypes = {
	searchTerm: PropTypes.string,
};

SearchableModules.defaultProps = {
	searchTerm: '',
};

class ActiveCard extends Component {
	render() {
		const m = this.props.moduleData,
			devMode = this.props.devMode;

		return (
			<SettingsCard module={ m.module } header={ m.name } action={ m.module } hideButton>
				<SettingsGroup
					disableInDevMode={ devMode }
					module={ { module: m.module } }
					support={ { link: m.learn_more_button } }
				>
					{ m.description }
				</SettingsGroup>
			</SettingsCard>
		);
	}
}

export default connect( state => {
	return {
		modules: getModules( state ),
		isModuleFound: module_name => isModuleFound( state, module_name ),
		canManageModules: userCanManageModules( state ),
		isUnavailableInDevMode: module_name => isUnavailableInDevMode( state, module_name ),
		isDevMode: isDevMode( state ),
	};
} )( SearchableModules );
