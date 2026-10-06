// The shared header's data; the reference brings the page-state typings into a consuming plugin's program.
// eslint-disable-next-line @typescript-eslint/triple-slash-reference -- global.d.ts is a script, so it cannot be imported.
/// <reference path="../global.d.ts" />
export {
	getManageConnection,
	needsUserConnection,
	useConnectionState,
	type ConnectionState,
	type ConnectionStateId,
	type ManageConnection,
} from './hooks/use-connection-state';
export {
	filterLauncherDestinations,
	getLauncherDestinations,
	useLauncherDestinations,
	type LauncherDestination,
} from './hooks/use-launcher-destinations';
