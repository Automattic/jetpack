type Result = {
	isFullyConnected: boolean;
	isSecondaryAdminNotConnected: boolean;
};

type ConnectionStatus = {
	isRegistered?: boolean;
	isUserConnected?: boolean;
	hasConnectedOwner?: boolean;
};

// The missing-global warning is a one-off diagnostic about how the page
// was rendered, not about this render. Latch it so it doesn't repeat on
// every re-render (or twice per mount under StrictMode).
let hasWarnedAboutMissingGlobal = false;

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
 * Because the read is synchronous there is no loading state to report:
 * either the global is present (with whatever keys it has, including
 * `{}` for a disconnected site) or it's missing, in which case we treat
 * the site as not connected so `<Gates>` shows the not-connected screen
 * instead of spinning forever.
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

	if ( ! state && typeof window !== 'undefined' && ! hasWarnedAboutMissingGlobal ) {
		hasWarnedAboutMissingGlobal = true;
		// eslint-disable-next-line no-console
		console.warn(
			'[Jetpack Backup] JP_CONNECTION_INITIAL_STATE is missing — treating site as not connected.'
		);
	}

	const isFullyConnected = Boolean( status.isRegistered && status.hasConnectedOwner );

	return {
		isFullyConnected,
		isSecondaryAdminNotConnected: Boolean( isFullyConnected && ! status.isUserConnected ),
	};
}

/**
 * Whether this browser session can usefully call the Backup bridges.
 *
 * Every bridge route runs `Rest_Controller::permission_check()`, which
 * needs a user-level WPCOM connection — so without one the only
 * possible answer is a 403. Hooks can't be called conditionally, so
 * query hooks that may mount above `<Gates>` pass this as their
 * `enabled` flag instead of skipping the call.
 *
 * @return True when the bridges can answer.
 */
export function useCanQueryWpcom(): boolean {
	const { isFullyConnected, isSecondaryAdminNotConnected } = useConnection();
	return isFullyConnected && ! isSecondaryAdminNotConnected;
}
