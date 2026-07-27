// The Activity Log dashboard deep-imports @automattic/jetpack-connection
// (e.g. `/use-connection`, `/use-connection-error-notice`) to keep wp-build's
// esbuild from bundling the connection barrel's `.jpg`-importing
// disconnect-dialog. Those deep source modules read ambient globals
// (`window.JP_CONNECTION_INITIAL_STATE`, `JetpackScriptData.connection`) that
// the connection package declares in its root `declarations.d.ts`, which only
// loads into the type program when the package is imported somewhere. This
// type-only side-effect import pulls those declarations in without adding the
// barrel to the runtime bundle (nothing imports this file at runtime).
import '@automattic/jetpack-connection';
