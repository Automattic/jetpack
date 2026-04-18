import { __ } from '@wordpress/i18n';
import { Button, Card } from '@wordpress/ui';
import { Component } from 'react';
import { connect } from 'react-redux';
// Jetpack composite helpers — kept as-is because they wrap Redux state,
// module-override gating, connection flow, and shared settings layout
// that must not be duplicated inline.
// NOTE: ConnectUserBar renders the user-connection prompt and wraps
// analytics + connectUser action dispatch; preserve as-is.
import ConnectUserBar from 'components/connect-user-bar';
// NOTE: withModuleSettingsFormHelpers injects getOptionValue / updateOptions
// and the rest of the settings-form API; preserve as-is.
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
// NOTE: SettingsCard wraps module-header layout, module-override banner,
// and the save-button footer; preserve as-is.
import SettingsCard from 'components/settings-card';
// NOTE: SettingsGroup wraps offline/site-connection gating and support
// link rendering around grouped settings content; preserve as-is.
import SettingsGroup from 'components/settings-group';
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
			const searchTerms = this.props.searchTerm || '';
			if ( searchTerms.length < 3 ) {
				return null;
			}

			// Only should be features that don't already have a UI, and we want to reveal in search.
			const safelist = [ 'contact-form', 'json-api', 'notes' ];

			const allModules = this.props.modules,
				results = [];
			for ( const [ slug, moduleData ] of Object.entries( allModules ) ) {
				if ( this.props.isModuleFound( slug ) && safelist.includes( slug ) ) {
					const isModuleUnavailableInOfflineMode =
						this.props.isOfflineMode && this.props.isUnavailableInOfflineMode( moduleData.module );
					const isModuleUnavailableInSiteConnectionMode =
						! this.props.hasConnectedOwner &&
						this.props.isUnavailableInSiteConnectionMode( moduleData.module );

					// Not available in offline or SiteConnection mode.
					if ( isModuleUnavailableInOfflineMode || isModuleUnavailableInSiteConnectionMode ) {
						results.push(
							<ActiveCard
								key={ slug }
								moduleData={ moduleData }
								offlineMode={ isModuleUnavailableInOfflineMode }
								siteConnectionMode={ isModuleUnavailableInSiteConnectionMode }
							/>
						);
						continue;
					}

					if ( this.props.getOptionValue( moduleData.module ) ) {
						results.push( <ActiveCard key={ slug } moduleData={ moduleData } /> );
					} else {
						results.push(
							<Card.Root key={ slug } className="jp-searchable-banner">
								<Card.Content>
									<div className="jp-searchable-banner__content">
										<div className="jp-searchable-banner__info">
											<div className="jp-searchable-banner__title">{ moduleData.name }</div>
											<div className="jp-searchable-banner__description">
												{ moduleData.description }
											</div>
										</div>
										<div className="jp-searchable-banner__action">
											<Button
												variant="solid"
												tone="brand"
												size="compact"
												onClick={ this.handleBannerClick( moduleData.module ) }
											>
												{ __( 'Activate', 'jetpack' ) }
											</Button>
										</div>
									</div>
								</Card.Content>
							</Card.Root>
						);
					}
				}
			}

			return <div>{ results }</div>;
		}
	}
);

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
