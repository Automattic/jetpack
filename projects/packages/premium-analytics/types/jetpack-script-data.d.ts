/**
 * Type `getScriptData().connection` by augmenting `JetpackScriptData` with the
 * connection package's `ConnectionScriptData`. The PHP connection package injects
 * this data for free (premium-analytics already requires `automattic/jetpack-connection`).
 *
 * `import type` keeps this erasable so we don't pull the connection package's
 * transitive types into the build; mirrors how other packages reference it.
 */
import type { ConnectionScriptData } from '@automattic/jetpack-connection';

declare module '@automattic/jetpack-script-data' {
	interface JetpackScriptData {
		connection: ConnectionScriptData;
	}
}
