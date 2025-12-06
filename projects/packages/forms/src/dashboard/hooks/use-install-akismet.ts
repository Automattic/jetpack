/**
 * External dependencies
 */
import { isSimpleSite } from '@automattic/jetpack-script-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
/**
 * Internal dependencies
 */
import {
	installAndActivatePlugin,
	activatePlugin,
} from '../../blocks/contact-form/util/plugin-management.js';
import useConfigValue from '../../hooks/use-config-value.ts';
import { INTEGRATIONS_STORE } from '../../store/integrations/index.ts';
/**
 * Types
 */
import type { SelectIntegrations, IntegrationsDispatch } from '../../store/integrations/index.ts';
import type { Integration } from '../../types/index.ts';

export const useInstallAkismet = () => {
	const canInstallPlugins = useConfigValue( 'canInstallPlugins' );
	const canActivatePlugins = useConfigValue( 'canActivatePlugins' );

	const { akismetIntegration, isIntegrationsLoading } = useSelect(
		( select: SelectIntegrations ) => {
			const store = select( INTEGRATIONS_STORE );
			const integrations = store.getIntegrations() || [];

			return {
				akismetIntegration: integrations.find(
					( integration: Integration ) => integration.id === 'akismet'
				),
				isIntegrationsLoading: store.isIntegrationsLoading(),
			};
		},
		[]
	) as { akismetIntegration?: Integration; isIntegrationsLoading: boolean };

	const { refreshIntegrations } = useDispatch( INTEGRATIONS_STORE ) as IntegrationsDispatch;
	const { createErrorNotice, createSuccessNotice } = useDispatch( noticesStore );
	const [ isInstallingAkismet, setIsInstallingAkismet ] = useState( false );

	const akismetIntegrationReady = useMemo(
		() => !! akismetIntegration && ! akismetIntegration.__isPartial,
		[ akismetIntegration ]
	);

	const isAkismetActive =
		akismetIntegrationReady &&
		!! akismetIntegration?.isInstalled &&
		!! akismetIntegration?.isActive;

	const shouldShowAkismetCta = akismetIntegrationReady && ! isAkismetActive && ! isSimpleSite();

	const akismetPluginFile = useMemo(
		() => akismetIntegration?.pluginFile ?? 'akismet/akismet',
		[ akismetIntegration?.pluginFile ]
	);

	const canPerformAkismetAction =
		akismetIntegration?.isInstalled && akismetIntegrationReady
			? canActivatePlugins !== false
			: canInstallPlugins !== false;

	const handleAkismetSetup = useCallback( async () => {
		if ( isInstallingAkismet || ! akismetIntegrationReady || ! canPerformAkismetAction ) {
			return;
		}

		setIsInstallingAkismet( true );

		try {
			if ( akismetIntegration?.isInstalled ) {
				await activatePlugin( akismetPluginFile );
			} else {
				await installAndActivatePlugin( 'akismet' );
			}

			const activatedMessage = __( 'Akismet activated.', 'jetpack-forms' );
			const installedAndActivatedMessage = __(
				'Akismet installed and activated.',
				'jetpack-forms'
			);

			createSuccessNotice(
				akismetIntegration?.isInstalled ? activatedMessage : installedAndActivatedMessage,
				{ type: 'snackbar', id: 'akismet-install-success' }
			);

			await refreshIntegrations();
		} catch ( error ) {
			const message =
				error instanceof Error
					? error.message
					: __( 'Could not set up Akismet. Please try again.', 'jetpack-forms' );

			createErrorNotice( message, {
				type: 'snackbar',
				id: 'akismet-install-error',
			} );
		} finally {
			setIsInstallingAkismet( false );
		}
	}, [
		akismetIntegration?.isInstalled,
		akismetIntegrationReady,
		akismetPluginFile,
		canPerformAkismetAction,
		createErrorNotice,
		createSuccessNotice,
		isInstallingAkismet,
		refreshIntegrations,
	] );

	return {
		shouldShowAkismetCta,
		handleAkismetSetup,
		isInstallingAkismet,
		isIntegrationsLoading,
		canPerformAkismetAction,
		...akismetIntegration,
	};
};

export default useInstallAkismet;
