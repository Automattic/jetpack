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

const Search = moduleSettingsForm(
	React.createClass( {
		render() {
			const search = this.props.getModule( 'search' );
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
						<SettingsGroup module={ { module: 'search' } } hasChild support={ search.learn_more_button }>
							<ModuleToggle
								slug="search"
								compact
								activated={ this.props.getOptionValue( 'search' ) }
								toggling={ this.props.isSavingAnyOption( 'search' ) }
								toggleModule={ this.props.toggleModuleNow }>
								{ __( 'Enhanced site-wide search, powered by Elasticsearch (Beta)' ) }
							</ModuleToggle>
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
