/**
 * External Dependencies
 */
import React, { useEffect, useMemo } from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import DisconnectCard from '../disconnect-card';

/**
 * Render a list of connected plugins.
 *
 * @param props
 * @returns {React.Component} - The ConnectedPlugins React component
 */

const ConnectedPlugins = props => {
	const { connectedPlugins, disconnectingPlugin } = props;

	/**
	 * Add a slug property to each ConnectedPlugins object so they can be converted to an array.
	 * This allows the connected plugins to be iterated over more easily for display.
	 */
	useEffect( () => {
		if ( connectedPlugins ) {
			const keys = Object.keys( connectedPlugins );
			keys.forEach( key => ( connectedPlugins[ key ].slug = key ) );
		}
	}, [ connectedPlugins ] );

	const connectedPluginsArray = useMemo( () => {
		return connectedPlugins
			? Object.values( connectedPlugins ).filter( plugin => {
					return disconnectingPlugin ? plugin.slug !== disconnectingPlugin : true;
			  } )
			: [];
	}, [ connectedPlugins, disconnectingPlugin ] );

	if ( connectedPlugins && connectedPluginsArray.length > 0 ) {
		return (
			<React.Fragment>
				<div className="jp-disconnect-dialog__step-copy">
					<p className="jp-disconnect-dialog__large-text">
						{ __(
							'Jetpack is powering other plugins on your site. If you disconnect, these plugins will no longer work.',
							'jetpack'
						) }
					</p>
				</div>
				{ connectedPluginsArray.map( plugin => {
					return <DisconnectCard title={ plugin.name } />;
				} ) }
			</React.Fragment>
		);
	}

	// Default to null if there are no connected plugins passed on the props
	return null;
};

export default ConnectedPlugins;
