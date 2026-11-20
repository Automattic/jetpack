/**
 * `process.env.NODE_ENV` is replaced by the bundler at build time. Declare a
 * minimal `process` locally so this file type-checks as source under `jetpack:src`.
 */
declare const process: { env: Record< string, string | undefined > };

const warned = new Set< string >();

/**
 * Warns about a host-supplied value once per process, and never in production.
 *
 * @param key     - Identifies the value, so a bad prop on every point warns once.
 * @param message - What the host got wrong and what happens instead.
 */
export const warnOnce = ( key: string, message: string ): void => {
	if ( warned.has( key ) || process.env.NODE_ENV === 'production' ) {
		return;
	}

	warned.add( key );
	// eslint-disable-next-line no-console
	console.warn( `[Charts] ${ message }` );
};
