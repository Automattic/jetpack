import { getScriptData } from '@automattic/jetpack-script-data';

/**
 * Return whether to use internal Jetpack admin links or not.
 *
 * @return {boolean} True if Jetpack admin links are available and should be used, false otherwise.
 */
export default function shouldUseInternalLinks() {
	const { connectedPlugins, connectionStatus } = getScriptData()?.connection ?? {};
	return (
		// Some admin pages require the site to be connected (e.g. Privacy)
		connectionStatus?.isActive &&
		// Admin pages are part of the Jetpack plugin and require it to be installed
		connectedPlugins?.some( ( { slug } ) => 'jetpack' === slug )
	);
}
