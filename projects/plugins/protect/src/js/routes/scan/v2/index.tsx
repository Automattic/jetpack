/**
 * Protect Scan v2 — root route.
 *
 * Stage 1 of the migration spelled out in
 * `projects/plugins/protect/docs/scan-v2/design.md`.
 *
 * This route only renders when the user has either:
 * - the URL flag `?protect-scan-v2=1`, or
 * - the PHP constant `JETPACK_PROTECT_SCAN_V2` defined truthy.
 *
 * The dispatch lives in `routes/scan/index.jsx` (the legacy entry); we
 * keep this file focused on the new shell.
 */
import { useEffect } from 'react';
import ThreatsScreen from './screens/threats';

/**
 * Protect Scan v2 root route component.
 *
 * @return The v2 scan UI shell.
 */
export default function ScanV2Route() {
	useEffect( () => {
		// Sanity log so engineers verifying the flag in dev can see they
		// landed on v2. Remove in Stage 2 when this becomes the default.
		// eslint-disable-next-line no-console
		console.log( '[Protect] Scan v2 route mounted.' );
	}, [] );

	return <ThreatsScreen />;
}
