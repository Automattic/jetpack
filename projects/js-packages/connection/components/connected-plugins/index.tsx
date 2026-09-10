import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import { Fragment, useMemo } from 'react';
import DisconnectCard from '../disconnect-card';

interface ConnectedPlugin {
	/** The display name of the connected plugin. */
	name: string;
	/** The plugin slug. */
	slug: string;
}

/**
 * Legacy shape for connected plugins: an object keyed by plugin slug, where the
 * slug lives on the key rather than in each value. Still emitted by the classic
 * Jetpack dashboard (initialState.connectedPlugins -> Plugin_Storage::get_all()),
 * which reaches this component via ConnectButton's DisconnectDialog. Superseded
 * by ConnectedPlugin[] (the connection-package store + REST return an array).
 */
type ConnectedPluginsMap = Record< string, Omit< ConnectedPlugin, 'slug' > >;

interface ConnectedPluginsProps {
	/**
	 * Plugins that are using the Jetpack connection. Accepts either an array of
	 * plugins (modern) or a legacy object keyed by slug (classic dashboard).
	 */
	connectedPlugins?: ConnectedPlugin[] | ConnectedPluginsMap;
	/** Slug of the plugin that has initiated the disconnect. */
	disconnectingPlugin?: string;
}

/**
 * Render a list of connected plugins.
 *
 * @param {ConnectedPluginsProps} props - The properties.
 * @return {import('react').ReactNode} - The ConnectedPlugins React component.
 */
const ConnectedPlugins = ( { connectedPlugins, disconnectingPlugin }: ConnectedPluginsProps ) => {
	/**
	 * Filter out the plugin that initiated the disconnect so it is not listed
	 * amongst the other plugins still using the connection.
	 */
	const connectedPluginsArray = useMemo( () => {
		if ( ! connectedPlugins ) {
			// No connected plugins.
			return [];
		}

		// Normalize the legacy slug-keyed object (classic dashboard) into an array.
		const plugins = Array.isArray( connectedPlugins )
			? connectedPlugins
			: Object.entries( connectedPlugins ).map( ( [ slug, plugin ] ) => ( { slug, ...plugin } ) );

		return plugins.filter( plugin => disconnectingPlugin !== plugin.slug );
	}, [ connectedPlugins, disconnectingPlugin ] );

	if ( connectedPluginsArray.length > 0 ) {
		return (
			<Fragment>
				<div className="jp-connection__disconnect-dialog__step-copy">
					<Text className="jp-connection__disconnect-dialog__large-text">
						{ __(
							'Jetpack is powering other plugins on your site. If you disconnect, these plugins will no longer work.',
							'jetpack-connection-js'
						) }
					</Text>
				</div>
				<div className="jp-connection__disconnect-card__group">
					{ connectedPluginsArray.map( plugin => {
						return <DisconnectCard title={ plugin.name } key={ plugin.slug } />;
					} ) }
				</div>
			</Fragment>
		);
	}

	// Default to null if there are no connected plugins passed on the props
	return null;
};

export default ConnectedPlugins;
