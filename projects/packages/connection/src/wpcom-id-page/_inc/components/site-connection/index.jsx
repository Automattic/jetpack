import { __ } from '@wordpress/i18n';

/**
 * Site Connection section displaying blog ID, site/home URLs, and alternate URLs.
 *
 * @param {object} props                 - Component props.
 * @param {object} props.initialState    - Localized initial state from PHP.
 * @param {object} props.connectionState - JP_CONNECTION_INITIAL_STATE data.
 * @return {import('react').ReactNode} The rendered component.
 */
export default function SiteConnection( { initialState, connectionState } ) {
	const blogId = connectionState?.userConnectionData?.currentUser?.blogId ?? initialState?.blogId;
	const isRegistered = connectionState?.connectionStatus?.isRegistered;

	return (
		<div className="wpcom-id-page__section">
			<h2>{ __( 'Site Connection', 'jetpack-connection' ) }</h2>

			{ ! isRegistered && (
				<p>
					{ __( 'This site is not currently connected to WordPress.com.', 'jetpack-connection' ) }
				</p>
			) }

			<table className="wpcom-id-page__kv-table">
				<tbody>
					<tr>
						<th>{ __( 'Blog ID', 'jetpack-connection' ) }</th>
						<td>
							{ blogId ?? (
								<span className="wpcom-id-page__placeholder-text">
									{ __( 'Not available', 'jetpack-connection' ) }
								</span>
							) }
						</td>
					</tr>
					<tr>
						<th>{ __( 'Site URL', 'jetpack-connection' ) }</th>
						<td>{ initialState?.siteUrl || '—' }</td>
					</tr>
					<tr>
						<th>{ __( 'Home URL', 'jetpack-connection' ) }</th>
						<td>{ initialState?.homeUrl || '—' }</td>
					</tr>
					<tr>
						<th>{ __( 'Alternate URLs', 'jetpack-connection' ) }</th>
						<td>
							<span className="wpcom-id-page__placeholder-text">
								{ __( 'No alternate URLs configured.', 'jetpack-connection' ) }
							</span>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
}
