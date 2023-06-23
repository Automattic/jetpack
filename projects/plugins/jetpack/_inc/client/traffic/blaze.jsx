import { getRedirectUrl } from '@automattic/jetpack-components';
import { __, _x } from '@wordpress/i18n';
import Card from 'components/card';
import ConnectUserBar from 'components/connect-user-bar';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import React from 'react';
import { connect } from 'react-redux';
import { isBlazeDashboardEnabled } from 'state/initial-state';
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
		blazeModule: { description },
		blazeDashboardEnabled,
		hasConnectedOwner,
		isOfflineMode,
		isSavingAnyOption,
		isUnavailableInOfflineMode,
		siteAdminUrl,
		toggleModuleNow,
	} = props;

	const unavailableInOfflineMode = isUnavailableInOfflineMode( 'blaze' );

	const blazeCard = () => {
		return (
			<Card
				compact
				className="jp-settings-card__configure-link"
				href={
					blazeDashboardEnabled
						? siteAdminUrl + 'tools.php?page=advertising'
						: getRedirectUrl( 'jetpack-blaze' )
				}
				onClick={ trackDashboardClick }
				{ ...( ! blazeDashboardEnabled ? { target: '_blank', rel: 'noopener noreferrer' } : {} ) }
			>
				{ __( 'Manage your campaigns and view your earnings in the Blaze dashboard', 'jetpack' ) }
			</Card>
		);
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
			blazeDashboardEnabled: isBlazeDashboardEnabled( state ),
			blazeModule: getModule( state, 'blaze' ),
		};
	} )( Blaze )
);
