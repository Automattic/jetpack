import { getRedirectUrl, ToggleControl } from '@automattic/jetpack-components';
import { __, _x } from '@wordpress/i18n';
import Card from 'components/card';
import ConnectUserBar from 'components/connect-user-bar';
import { FormFieldset } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import React from 'react';
import { connect } from 'react-redux';
import { getModule } from 'state/modules';

const trackDashboardClick = () => {
	analytics.tracks.recordJetpackClick( 'blaze-dashboard' );
};

/**
 * Blaze settings component.
 *
 * @param {object} props - Component props.
 * @returns {React.Component} Blaze settings component.
 */
function Blaze( props ) {
	const {
		blazeActive,
		blazeDashboardEnabled,
		blazeModule: { description },
		getSettingCurrentValue,
		hasConnectedOwner,
		isOfflineMode,
		isSavingAnyOption,
		isUnavailableInOfflineMode,
		updateOptions,
		toggleModuleNow,
	} = props;

	const unavailableInOfflineMode = isUnavailableInOfflineMode( 'blaze' );

	const blazeCard = () => {
		return (
			<Card
				className="blaze-card"
				href="tools.php?page=advertising"
				onClick={ trackDashboardClick }
			>
				{ __( 'Manage your campaigns and view your earnings in the Blaze dashboard', 'jetpack' ) }
			</Card>
		);
	};

	/**
	 * Update the option that enables or disables the Blaze dashboard.
	 *
	 * @returns {*} the updated value
	 */
	const toggleBlazeDashboard = () => {
		const updateValue = ! getSettingCurrentValue( 'jetpack_blaze_dashboard_enable' );
		return updateOptions( { jetpack_blaze_dashboard_enable: updateValue } );
	};

	return (
		<SettingsCard
			{ ...props }
			header={ _x( 'Blaze', 'Settings header', 'jetpack' ) }
			module="blaze"
			hideButton
		>
			<SettingsGroup
				module={ { module: 'blaze' } }
				disableInOfflineMode
				disableInSiteConnectionMode
				support={ {
					text: description,
					link: getRedirectUrl( 'jetpack-support-blaze' ),
				} }
			>
				<ModuleToggle
					slug="blaze"
					activated={ blazeActive }
					disabled={ unavailableInOfflineMode || ! hasConnectedOwner }
					toggling={ isSavingAnyOption( 'blaze' ) }
					toggleModule={ toggleModuleNow }
				>
					{ __( 'Attract high-quality traffic to your site using Blaze.', 'jetpack' ) }
				</ModuleToggle>
				<FormFieldset className="jp-blaze-dashboard-toggle">
					<ToggleControl
						checked={ !! blazeDashboardEnabled }
						disabled={
							! blazeActive || unavailableInOfflineMode || isSavingAnyOption( [ 'blaze' ] )
						}
						toggling={ isSavingAnyOption( [ 'jetpack_blaze_dashboard_enable' ] ) }
						onChange={ toggleBlazeDashboard() }
						label={
							<>
								{ __( 'Manage your Blaze campaigns straight from your dashboard', 'jetpack' ) }
								<span className="jp-blaze-dashboard-badge">{ __( 'New', 'jetpack' ) }</span>
							</>
						}
					/>
				</FormFieldset>
			</SettingsGroup>
			{ blazeActive && hasConnectedOwner && ! isOfflineMode && blazeCard() }
			{ ! hasConnectedOwner && ! isOfflineMode && (
				<ConnectUserBar
					feature="blaze"
					featureLabel={ __( 'Blaze', 'jetpack' ) }
					text={ __( 'Connect to set up campaigns and promote your content.', 'jetpack' ) }
				/>
			) }
		</SettingsCard>
	);
}

export default withModuleSettingsFormHelpers(
	connect( ( state, ownProps ) => {
		return {
			blazeActive: ownProps.getOptionValue( 'blaze' ),
			blazeDashboardEnabled: ownProps.getOptionValue( 'jetpack_blaze_dashboard_enable' ),
			blazeModule: getModule( state, 'blaze' ),
		};
	} )( Blaze )
);
