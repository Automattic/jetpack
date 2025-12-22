/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useDispatch } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
/**
 * Internal dependencies
 */
import {
	installAndActivatePlugin,
	activatePlugin,
} from '../blocks/contact-form/util/plugin-management.js';
import useConfigValue from './use-config-value.ts';

type NoticeOptions = Record< string, unknown >;

type NoticeConfig = {
	message?: string;
	options?: NoticeOptions;
};

type SuccessNotices = {
	install?: NoticeConfig;
	activate?: NoticeConfig;
};

type UsePluginInstallationArgs = {
	slug: string;
	pluginPath: string;
	isInstalled: boolean;
	trackEventName?: string;
	trackEventProps?: Record< string, unknown >;
	onSuccess?: () => void | Promise< void >;
	successNotices?: SuccessNotices;
	errorNotice?: NoticeConfig;
};

type PluginInstallation = {
	isInstalling: boolean;
	installPlugin: () => Promise< boolean >;
	canInstallPlugins: boolean;
	canActivatePlugins: boolean;
};

/**
 * Custom hook to handle plugin installation and activation flows.
 *
 * @param {UsePluginInstallationArgs} args - Hook arguments.
 * @return {PluginInstallation} Plugin installation states and handlers.
 */
export const usePluginInstallation = ( {
	slug,
	pluginPath,
	isInstalled,
	trackEventName,
	trackEventProps = {},
	onSuccess,
	successNotices,
	errorNotice,
}: UsePluginInstallationArgs ): PluginInstallation => {
	const [ isInstalling, setIsInstalling ] = useState( false );
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const canInstallPlugins = useConfigValue( 'canInstallPlugins' );
	const canActivatePlugins = useConfigValue( 'canActivatePlugins' );

	const installPlugin = useCallback( async () => {
		setIsInstalling( true );

		if ( trackEventName ) {
			jetpackAnalytics.tracks.recordEvent( trackEventName, {
				intent: isInstalled ? 'activate-plugin' : 'install-plugin',
				...( trackEventProps ?? {} ),
			} );
		}

		try {
			if ( isInstalled ) {
				if ( ! canActivatePlugins ) {
					return false;
				}

				await activatePlugin( pluginPath );
			} else {
				if ( ! canInstallPlugins ) {
					return false;
				}

				await installAndActivatePlugin( slug );
			}

			const successNoticeConfig = isInstalled ? successNotices?.activate : successNotices?.install;

			if ( successNoticeConfig?.message ) {
				createSuccessNotice( successNoticeConfig.message, successNoticeConfig.options );
			}

			if ( onSuccess ) {
				await onSuccess();
			}

			return true;
		} catch ( error ) {
			if ( errorNotice ) {
				const noticeMessage =
					errorNotice.message || ( error instanceof Error ? error.message : undefined );

				if ( noticeMessage ) {
					createErrorNotice( noticeMessage, errorNotice.options );
				}
			}

			return false;
		} finally {
			setIsInstalling( false );
		}
	}, [
		trackEventName,
		isInstalled,
		trackEventProps,
		successNotices?.activate,
		successNotices?.install,
		onSuccess,
		canActivatePlugins,
		pluginPath,
		canInstallPlugins,
		slug,
		createSuccessNotice,
		errorNotice,
		createErrorNotice,
	] );

	return {
		isInstalling,
		installPlugin,
		canInstallPlugins,
		canActivatePlugins,
	};
};
