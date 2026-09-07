/**
 * Ambient declarations for the globals and DOM attributes the AI Launchpad uses but its
 * dependencies do not type.
 */

export {};

declare global {
	interface Window {
		/**
		 * Printed by `Connection_Initial_State::render_script()` on the launchpad page. Typed here
		 * rather than imported from `@automattic/jetpack-connection`, which this package does not
		 * depend on, so only the two fields `requestJwt()` reads are declared.
		 */
		JP_CONNECTION_INITIAL_STATE?: {
			apiNonce?: string;
			siteSuffix?: string;
		};
	}
}

declare module 'react' {
	interface HTMLAttributes< T > {
		/**
		 * `inert` is a standard HTML attribute that @types/react only added in its React 19 typings;
		 * this package is pinned to 18. Declared as a string because that is what React 18 renders it
		 * from — React 19's boolean handling is not in play here.
		 */
		inert?: string;
	}
}
