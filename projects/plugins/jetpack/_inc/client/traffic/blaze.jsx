import { getRedirectUrl } from '@automattic/jetpack-components';
import { isWoASite } from '@automattic/jetpack-script-data';
import { ToggleControl } from '@wordpress/components';
import { Card } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import { connect } from 'react-redux';
// Jetpack composite helpers — kept as-is because they wrap Redux state,
// analytics, module-override gating, and shared form infrastructure that
// must not be duplicated inline.
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import { isBlazeDashboardEnabled, shouldInitializeBlaze } from 'state/initial-state';
import { getModule } from 'state/modules';
import { FEATURE_JETPACK_BLAZE } from '../lib/plans/constants';

const trackDashboardClick = () => {
	analytics.tracks.recordJetpackClick( 'blaze-dashboard' );
};

/**
 * Blaze settings component.
 *
 * @param {object} props - Component props.
 * @return {import('react').Component} Blaze settings component.
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
		siteAdminUrl,
		toggleModuleNow,
	} = props;

	const { can_init: canInit, reason } = blazeAvailable;

	if ( isWoASite() ) {
		return null;
	}

	const unavailableInOfflineMode = isUnavailableInOfflineMode( 'blaze' );

	const blazeDashboardLink = () => {
		const href = blazeDashboardEnabled
			? siteAdminUrl + 'tools.php?page=advertising'
			: getRedirectUrl( 'jetpack-blaze' );
		const externalAttrs = ! blazeDashboardEnabled
			? { target: '_blank', rel: 'noopener noreferrer' }
			: {};

		return (
			<Card.Root className="jp-settings-card__configure-link">
				<Card.Content>
					<a href={ href } onClick={ trackDashboardClick } { ...externalAttrs }>
						{ __(
							'Manage your campaigns and view your earnings in the Blaze dashboard',
							'jetpack'
						) }
					</a>
				</Card.Content>
			</Card.Root>
		);
	};

	const blazeToggle = () => {
		if ( ! canInit && reason === 'user_not_connected' ) {
			return (
				<ToggleControl
					__nextHasNoMarginBottom
					checked={ false }
					disabled={ true }
					onChange={ () => {} }
					label={ __( 'Attract high-quality traffic to your site using Blaze.', 'jetpack' ) }
				/>
			);
		}

		if ( ! canInit ) {
			return (
				<ToggleControl
					__nextHasNoMarginBottom
					checked={ false }
					disabled={ true }
					onChange={ () => {} }
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
		};
	} )( Blaze )
);
