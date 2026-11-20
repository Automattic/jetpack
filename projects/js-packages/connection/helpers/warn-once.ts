// The bundler replaces `process.env.NODE_ENV` at build time; declared so this type-checks without Node types.
declare const process: { env: Record< string, string | undefined > };

const warned = new Set< string >();

/**
 * Warns a developer once per page, and never in production.
 *
 * @param key     - Identifies the problem, so repeated calls with the same mistake warn once.
 * @param message - What the caller got wrong and what happens instead.
 */
export const warnOnce = ( key: string, message: string ): void => {
	if ( warned.has( key ) || process.env.NODE_ENV === 'production' ) {
		return;
	}

	warned.add( key );
	// eslint-disable-next-line no-console
	console.warn( `[Jetpack Connection] ${ message }` );
};
