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
import { getPlanClass } from 'lib/plans/constants';
import { getSitePlan } from 'state/site';
import { isFetchingSiteData } from 'state/site';
import { FormFieldset } from 'components/forms';

const Search = moduleSettingsForm(
	React.createClass( {
		render() {
			let planClass = null;

			if ( this.props.sitePlan ) {
				planClass = getPlanClass( this.props.sitePlan.product_slug );
			}

			if ( 'is-business-plan' === planClass ) {
				return (
					<SettingsCard
						{ ...this.props }
						module="search"
						hideButton
					>
						<SettingsGroup module={ { module: 'search' } } hasChild support="https://jetpack.com/support/search">
							<ModuleToggle
								slug="search"
								compact
								activated={ this.props.getOptionValue( 'search' ) }
								toggling={ this.props.isSavingAnyOption( 'search' ) }
								toggleModule={ this.props.toggleModuleNow }>
								{ __( 'Replace WordPress built-in search with an improved search experience (Beta)' ) }
							</ModuleToggle>
							{ this.props.getOptionValue( 'search' ) && (
								<FormFieldset>
									<p className="jp-form-setting-explanation">
										{ __( 'To configure search filters add the {{link}}Jetpack Search widget to your sidebar{{/link}}.', {
											components: {
												link: <a href="widgets.php" />
											}
										} ) }
									</p>
									</FormFieldset>
							) }
						</SettingsGroup>
					</SettingsCard>
				);
			} else {
				// for now, no prompt to upgrade for missing search functionality
				return null;
			}
		}
	} )
);

export default connect(
	state => {
		return {
			siteAdminUrl: getSiteAdminUrl( state ),
			sitePlan: getSitePlan( state ),
			fetchingSiteData: isFetchingSiteData( state )
		};
	}
)( Search );
