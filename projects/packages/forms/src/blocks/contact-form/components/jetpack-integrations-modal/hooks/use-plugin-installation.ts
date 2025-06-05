/**
 * External dependencies
 */
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { useState, useCallback } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { installAndActivatePlugin, activatePlugin } from '../../../util/plugin-management';

type PluginInstallation = {
	isInstalling: boolean;
	installPlugin: () => Promise< boolean >;
};

/**
 * Custom hook to handle plugin installation and activation flows.
 *
 * @param {string}  slug            - The plugin slug (e.g., 'akismet')
 * @param {string}  pluginPath      - The plugin path (e.g., 'akismet/akismet')
 * @param {boolean} isInstalled     - Whether the plugin is installed
 * @param {string}  tracksEventName - The name of the tracks event to record
 * @return {object} Plugin installation states and handlers
 */
export const usePluginInstallation = (
	slug: string,
	pluginPath: string,
	isInstalled: boolean,
	tracksEventName: string
): PluginInstallation => {
	const [ isInstalling, setIsInstalling ] = useState( false );
	const { tracks } = useAnalytics();

	const installPlugin = useCallback( async () => {
		setIsInstalling( true );

		if ( tracksEventName ) {
			tracks.recordEvent( tracksEventName, {
				screen: 'block-editor',
				intent: isInstalled ? 'activate-plugin' : 'install-plugin',
			} );
		}

		try {
			if ( isInstalled ) {
				await activatePlugin( pluginPath );
			} else {
				await installAndActivatePlugin( slug );
			}
			return true;
		} catch {
			// Let the component handle the error state
			return false;
		} finally {
			setIsInstalling( false );
		}
	}, [ slug, pluginPath, isInstalled, tracks, tracksEventName ] );

	return {
		isInstalling,
		installPlugin,
	};
};
