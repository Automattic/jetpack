/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';

/**
 * Internal dependencies
 */
import { FEATURE_SEARCH_JETPACK } from 'lib/plans/constants';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { getSiteAdminUrl } from 'state/initial-state';
import { getSitePlan } from 'state/site';
import { isFetchingSiteData } from 'state/site';
import { FormFieldset } from 'components/forms';

class Search extends React.Component {
	render() {
		return (
			<SettingsCard
				{ ...this.props }
				module="search"
				feature={ FEATURE_SEARCH_JETPACK }
				hideButton
			>
				<SettingsGroup module={ { module: 'search' } } hasChild support="https://jetpack.com/support/search">
					<ModuleToggle
						slug="search"
						compact
						activated={ this.props.getOptionValue( 'search' ) }
						toggling={ this.props.isSavingAnyOption( 'search' ) }
						toggleModule={ this.props.toggleModuleNow }>
						{ __( 'Replace WordPress built-in search with an improved search experience' ) }
					</ModuleToggle>
					{ this.props.getOptionValue( 'search' ) && (
						<FormFieldset>
								<p className="jp-form-setting-explanation">
									{ __( 'Add the "Search (Jetpack)" widget to your sidebar to configure advanced search filters.' ) }
								</p>
							</FormFieldset>
					) }
				</SettingsGroup>
				{
					this.props.getOptionValue( 'search' ) && (
						<Card compact className="jp-settings-card__configure-link" href="customize.php">{ __( 'Add "Search (Jetpack)" Widget' ) }</Card>
					)
				}
			</SettingsCard>
		);
	}
}

export default connect(
	state => {
		return {
			siteAdminUrl: getSiteAdminUrl( state ),
			sitePlan: getSitePlan( state ),
			fetchingSiteData: isFetchingSiteData( state )
		};
	}
)( moduleSettingsForm( Search ) );

