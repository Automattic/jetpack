import { getRedirectUrl } from '@automattic/jetpack-components';
import { isWoASite } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	Modal,
	ToggleControl,
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
import { connect } from 'react-redux';
import Card from 'components/card';
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

const trackModuleToggle = ( module, currentlyActivated ) => {
	analytics.tracks.recordEvent( 'jetpack_wpa_module_toggle', {
		module,
		toggled: currentlyActivated ? 'off' : 'on',
	} );
};

const disableWarningModalStyle = {
	alignSelf: 'center',
	borderRadius: '8px',
	height: 'auto',
	margin: 'auto',
	maxHeight: 'calc(100% - 32px)',
	maxWidth: '512px',
	width: 'calc(100% - 32px)',
};

/**
 * Blaze settings component.
 *
 * @param {object} props - Component props.
 * @return {import('react').Component} Blaze settings component.
 */
export function Blaze( props ) {
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
	const [ showDisableWarning, setShowDisableWarning ] = useState( false );
	const [ checkingActiveCampaigns, setCheckingActiveCampaigns ] = useState( false );

	const { can_init: canInit, reason } = blazeAvailable;

	const getBlazeDashboardUrl = () => {
		return blazeDashboardEnabled
			? siteAdminUrl + 'tools.php?page=advertising'
			: getRedirectUrl( 'jetpack-blaze' );
	};

	const getBlazeDashboardLinkProps = () => {
		return ! blazeDashboardEnabled ? { target: '_blank', rel: 'noopener noreferrer' } : {};
	};

	const closeDisableWarning = useCallback( () => {
		setShowDisableWarning( false );
	}, [] );

	const manageCampaigns = useCallback( () => {
		setShowDisableWarning( false );
		trackDashboardClick();
	}, [] );

	const toggleBlazeModule = useCallback(
		( module, currentlyActivated ) => {
			trackModuleToggle( module, currentlyActivated );
			toggleModuleNow( module );
		},
		[ toggleModuleNow ]
	);

	const disableBlaze = useCallback( () => {
		setShowDisableWarning( false );
		toggleBlazeModule( 'blaze', true );
	}, [ toggleBlazeModule ] );

	const handleToggleModule = useCallback(
		async ( module, currentlyActivated ) => {
			if ( checkingActiveCampaigns ) {
				return;
			}

			if ( ! currentlyActivated ) {
				toggleBlazeModule( module, currentlyActivated );
				return;
			}

			setCheckingActiveCampaigns( true );

			try {
				const activeCampaignsStatus = await apiFetch( {
					path: '/jetpack/v4/blaze/active-campaigns',
				} );

				if ( activeCampaignsStatus?.status === 'none' ) {
					toggleBlazeModule( module, currentlyActivated );
					return;
				}
			} catch {
				// Warn conservatively when the status check is unavailable.
			} finally {
				setCheckingActiveCampaigns( false );
			}

			setShowDisableWarning( true );
		},
		[ checkingActiveCampaigns, toggleBlazeModule ]
	);

	if ( isWoASite() ) {
		return null;
	}

	const unavailableInOfflineMode = isUnavailableInOfflineMode( 'blaze' );

	const blazeDashboardLink = () => {
		return (
			<Card
				compact
				className="jp-settings-card__configure-link"
				href={ getBlazeDashboardUrl() }
				onClick={ trackDashboardClick }
				{ ...getBlazeDashboardLinkProps() }
			>
				{ __( 'Manage your campaigns and view your earnings in the Blaze dashboard', 'jetpack' ) }
			</Card>
		);
	};

	const blazeToggle = () => {
		if ( ! canInit && reason === 'user_not_connected' ) {
			return (
				<ToggleControl
					__nextHasNoMarginBottom={ true }
					disabled={ true }
					label={ __( 'Attract high-quality traffic to your site using Blaze.', 'jetpack' ) }
				/>
			);
		}

		if ( ! canInit ) {
			return (
				<ToggleControl
					__nextHasNoMarginBottom={ true }
					disabled={ true }
					label={ __( 'Blaze is not available on your site.', 'jetpack' ) }
				/>
			);
		}

		return (
			<ModuleToggle
				slug="blaze"
				activated={ blazeActive }
				disabled={
					unavailableInOfflineMode ||
					! hasConnectedOwner ||
					isSavingAnyOption( 'blaze' ) ||
					checkingActiveCampaigns
				}
				trackToggle={ false }
				toggleModule={ handleToggleModule }
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
			{ showDisableWarning && (
				<Modal
					title={ __( 'Active Blaze campaigns are still running', 'jetpack' ) }
					onRequestClose={ closeDisableWarning }
					className="jp-blaze-disable-warning-modal"
					size="medium"
					style={ disableWarningModalStyle }
				>
					<VStack spacing="4">
						<Text as="p">
							{ __(
								'Disabling this setting only hides the Blaze interface. Your campaigns will continue to serve ads, and you will continue to be charged. To stop your campaigns, open campaign management.',
								'jetpack'
							) }
						</Text>
						<HStack justify="start" spacing="3" wrap>
							<Button variant="primary" onClick={ closeDisableWarning }>
								{ __( 'Keep Blaze enabled', 'jetpack' ) }
							</Button>
							<Button
								variant="secondary"
								href={ getBlazeDashboardUrl() }
								onClick={ manageCampaigns }
								{ ...getBlazeDashboardLinkProps() }
							>
								{ __( 'Manage campaigns', 'jetpack' ) }
							</Button>
							<Button variant="tertiary" isDestructive onClick={ disableBlaze }>
								{ __( 'Disable anyway', 'jetpack' ) }
							</Button>
						</HStack>
					</VStack>
				</Modal>
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
			blazeAvailable: shouldInitializeBlaze( state ),
		};
	} )( Blaze )
);
