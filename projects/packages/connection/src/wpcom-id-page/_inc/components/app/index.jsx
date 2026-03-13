import { ConnectionError } from '@automattic/jetpack-connection';
import ConnectedPlugins from '../connected-plugins';
import DiagnosticTools from '../diagnostic-tools';
import MigrationTools from '../migration-tools';
import PageHeader from '../page-header';
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
			<PageHeader connectionState={ connectionState } />

			<ConnectionError />

			<SiteConnection initialState={ initialState } connectionState={ connectionState } />

			<UserConnection initialState={ initialState } connectionState={ connectionState } />

			<ConnectedPlugins connectionState={ connectionState } />

			<SyncSection />

			<DiagnosticTools />

			<MigrationTools />
		</div>
	);
}
