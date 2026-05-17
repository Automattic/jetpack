type Result = {
	isLoaded: boolean;
	isFullyConnected: boolean;
	isSecondaryAdminNotConnected: boolean;
	hasConnectionError: boolean;
};

type ConnectionStatus = {
	isRegistered?: boolean;
	isUserConnected?: boolean;
	hasConnectedOwner?: boolean;
};

/**
 * Read Jetpack's connection state from the `JP_CONNECTION_INITIAL_STATE`
 * global emitted by `Connection_Initial_State::render_script()` in PHP.
 *
 * We deliberately avoid `@automattic/jetpack-connection`'s store / hooks
 * because the package's barrel pulls in SCSS that wp-build's bundler
 * can't resolve. The global is set inline on `admin_print_scripts`
 * priority 1, well before any React bundle runs, so reading on every
 * render is a single property lookup — no need to memoize, and not
 * memoizing avoids any chance of capturing a pre-emit empty snapshot
 * if load order ever drifts.
 *
 * If the global is missing entirely (PHP failed to emit it), we treat
 * the connection as "loaded but not connected" so `<Gates>` falls
 * through to the not-connected screen instead of spinning forever.
 * `@automattic/jetpack-connection`'s `declarations.d.ts` already types
 * the global ambiently — and declares it non-optional — so we don't
 * redeclare it here, but we do keep that runtime guard because nothing
 * guarantees PHP emitted it.
 *
 * @return Connection state.
 */
export function useConnection(): Result {
	const state = typeof window !== 'undefined' ? window.JP_CONNECTION_INITIAL_STATE : undefined;
	const status: ConnectionStatus = state?.connectionStatus ?? {};
	const hasGlobal = Boolean( state );

	if ( ! hasGlobal && typeof window !== 'undefined' ) {
		// eslint-disable-next-line no-console
		console.warn(
			'[Jetpack Backup] JP_CONNECTION_INITIAL_STATE is missing — treating site as not connected.'
		);
	}

	const isFullyConnected = Boolean( status.isRegistered && status.hasConnectedOwner );
	const isSecondaryAdminNotConnected = Boolean( isFullyConnected && ! status.isUserConnected );

	return {
		// Always loaded: either the global is present (with whatever
		// keys it has, including `{}` for a disconnected site) or it's
		// missing and we've decided to render the not-connected screen.
		isLoaded: true,
		isFullyConnected,
		isSecondaryAdminNotConnected,
		hasConnectionError: false,
	};
}
