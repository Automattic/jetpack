import { __ } from '@wordpress/i18n';
import ConnectedPlugins from '../connected-plugins';
import DiagnosticTools from '../diagnostic-tools';
import MigrationTools from '../migration-tools';
import SiteConnection from '../site-connection';
import SyncSection from '../sync-section';
import UserConnection from '../user-connection';

const getInitialState = () => window.wpcomIdInitialState || {};
const getConnectionState = () => window.JP_CONNECTION_INITIAL_STATE || {};

/**
 * WordPress.com ID page root component.
 *
 * @return {import('react').ReactNode} The rendered component.
 */
export default function App() {
	const initialState = getInitialState();
	const connectionState = getConnectionState();

	return (
		<div className="wpcom-id-page">
			<p>
				{ __(
					"This page displays your site's WordPress.com connection and sync information.",
					'jetpack-connection'
				) }
			</p>

			<SiteConnection initialState={ initialState } connectionState={ connectionState } />

			<UserConnection initialState={ initialState } connectionState={ connectionState } />

			<ConnectedPlugins connectionState={ connectionState } />

			<SyncSection />

			<DiagnosticTools />

			<MigrationTools />
		</div>
	);
}
