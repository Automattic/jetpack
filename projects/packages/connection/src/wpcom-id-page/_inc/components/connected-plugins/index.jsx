import { __ } from '@wordpress/i18n';

/**
 * Connected Plugins section listing all plugins using the Jetpack connection.
 *
 * @param {object} props                 - Component props.
 * @param {object} props.connectionState - JP_CONNECTION_INITIAL_STATE data.
 * @return {import('react').ReactNode} The rendered component.
 */
export default function ConnectedPlugins( { connectionState } ) {
	const plugins = connectionState?.connectedPlugins;
	const pluginList = Array.isArray( plugins ) ? plugins : Object.values( plugins || {} );

	return (
		<div className="wpcom-id-page__section">
			<h2>{ __( 'Connected Plugins', 'jetpack-connection' ) }</h2>

			{ pluginList.length > 0 ? (
				<table className="widefat">
					<thead>
						<tr>
							<th>{ __( 'Plugin', 'jetpack-connection' ) }</th>
							<th>{ __( 'Slug', 'jetpack-connection' ) }</th>
						</tr>
					</thead>
					<tbody>
						{ pluginList.map( plugin => (
							<tr key={ plugin.slug }>
								<td>{ plugin.name || plugin.slug }</td>
								<td>
									<code>{ plugin.slug }</code>
								</td>
							</tr>
						) ) }
					</tbody>
				</table>
			) : (
				<p className="wpcom-id-page__placeholder-text">
					{ __( 'No plugins are currently using the connection.', 'jetpack-connection' ) }
				</p>
			) }
		</div>
	);
}
