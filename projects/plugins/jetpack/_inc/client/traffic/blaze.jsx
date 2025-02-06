import { getRedirectUrl, ToggleControl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { connect } from 'react-redux';
import Card from 'components/card';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import {
	isBlazeDashboardEnabled,
	isWoASite as getIsWoASite,
	shouldInitializeBlaze,
} from 'state/initial-state';
import { getModule } from 'state/modules';
import { FEATURE_JETPACK_BLAZE } from '../lib/plans/constants';

const trackDashboardClick = () => {
	analytics.tracks.recordJetpackClick( 'blaze-dashboard' );
};

/**
 * Blaze settings component.
 *
 * @param {object} props - Component props.
 * @return {React.Component} Blaze settings component.
 */
function Blaze( props ) {
	const {
		blazeActive,
		blazeAvailable,
		blazeModule: { description },
		blazeDashboardEnabled,
		hasConnectedOwner,
		isOfflineMode,
		isSavingAnyOption,
		isUnavailableInOfflineMode,
		isWoASite,
		siteAdminUrl,
		toggleModuleNow,
	} = props;

	const { can_init: canInit, reason } = blazeAvailable;

	if ( isWoASite && ! blazeDashboardEnabled ) {
		return null;
	}

	const unavailableInOfflineMode = isUnavailableInOfflineMode( 'blaze' );

	const blazeDashboardLink = () => {
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

	const blazeToggle = () => {
		if ( ! canInit && reason === 'user_not_connected' ) {
			return (
				<ToggleControl
					disabled={ true }
					label={ __( 'Attract high-quality traffic to your site using Blaze.', 'jetpack' ) }
				/>
			);
		}

		if ( ! canInit ) {
			return (
				<ToggleControl
					disabled={ true }
					label={ __( 'Blaze is not available on your site.', 'jetpack' ) }
				/>
			);
		}

		return (
			<ModuleToggle
				slug="blaze"
				activated={ blazeActive }
				disabled={ unavailableInOfflineMode || ! hasConnectedOwner }
				toggling={ isSavingAnyOption( 'blaze' ) }
				toggleModule={ toggleModuleNow }
			>
				<span className="jp-form-toggle-explanation">
					{ __( 'Attract high-quality traffic to your site using Blaze.', 'jetpack' ) }
				</span>
			</ModuleToggle>
		);
	};

	return (
		<SettingsCard
			{ ...props }
			header={ __( 'Blaze', 'jetpack' ) }
			module="blaze"
			hideButton
			feature={ FEATURE_JETPACK_BLAZE }
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
				{ blazeToggle() }
			</SettingsGroup>
			{ canInit && blazeActive && ! isOfflineMode && blazeDashboardLink() }
		</SettingsCard>
	);
}

export default withModuleSettingsFormHelpers(
	connect( ( state, ownProps ) => {
		return {
			blazeActive: ownProps.getOptionValue( 'blaze' ),
			blazeDashboardEnabled: isBlazeDashboardEnabled( state ),
			blazeModule: getModule( state, 'blaze' ),
			blazeAvailable: shouldInitializeBlaze( state ),
			isWoASite: getIsWoASite( state ),
		};
	} )( Blaze )
);
