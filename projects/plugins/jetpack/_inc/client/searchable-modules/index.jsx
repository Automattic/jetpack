import { __ } from '@wordpress/i18n';
import Banner from 'components/banner';
import ConnectUserBar from 'components/connect-user-bar';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { includes, forEach } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
	isOfflineMode,
	isUnavailableInOfflineMode,
	isUnavailableInSiteConnectionMode,
} from 'state/connection';
import { userCanManageModules } from 'state/initial-state';
import { getModules } from 'state/modules';
import { isModuleFound } from 'state/search';

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
					const isModuleUnavailableInOfflineMode =
						this.props.isOfflineMode && this.props.isUnavailableInOfflineMode( moduleData.module );
					const isModuleUnavailableInSiteConnectionMode =
						! this.props.hasConnectedOwner &&
						this.props.isUnavailableInSiteConnectionMode( moduleData.module );

					// Not available in offline or SiteConnection mode.
					if ( isModuleUnavailableInOfflineMode || isModuleUnavailableInSiteConnectionMode ) {
						return results.push(
							<ActiveCard
								key={ slug }
								moduleData={ moduleData }
								offlineMode={ isModuleUnavailableInOfflineMode }
								siteConnectionMode={ isModuleUnavailableInSiteConnectionMode }
							/>
						);
					}

					if ( this.props.getOptionValue( moduleData.module ) ) {
						results.push( <ActiveCard key={ slug } moduleData={ moduleData } /> );
					} else {
						results.push(
							<Banner
								className="jp-searchable-banner"
								key={ slug }
								callToAction={ __( 'Activate', 'jetpack' ) }
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
			offlineMode = this.props.offlineMode,
			siteConnectionMode = this.props.siteConnectionMode;

		return (
			<SettingsCard module={ m.module } header={ m.name } action={ m.module } hideButton>
				<SettingsGroup
					disableInOfflineMode={ offlineMode }
					disableInSiteConnectionMode={ siteConnectionMode }
					module={ { module: m.module } }
					support={ { link: m.learn_more_button } }
				>
					{ m.description }
				</SettingsGroup>

				{ siteConnectionMode && (
					<ConnectUserBar
						feature={ m.module }
						featureLabel={ m.name }
						text={ __( 'Connect to configure.', 'jetpack' ) }
					/>
				) }
			</SettingsCard>
		);
	}
}

export default connect( state => {
	return {
		modules: getModules( state ),
		isModuleFound: module_name => isModuleFound( state, module_name ),
		canManageModules: userCanManageModules( state ),
		isUnavailableInOfflineMode: module_name => isUnavailableInOfflineMode( state, module_name ),
		isOfflineMode: isOfflineMode( state ),
		isUnavailableInSiteConnectionMode: module_name =>
			isUnavailableInSiteConnectionMode( state, module_name ),
	};
} )( SearchableModules );
