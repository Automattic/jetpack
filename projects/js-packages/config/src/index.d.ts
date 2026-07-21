/**
 * Check whether a Jetpack Config key is defined.
 *
 * @param key - The config key to look up.
 * @return Whether the key is defined in the Jetpack Config.
 */
export function jetpackConfigHas( key: string ): boolean;

/**
 * Get the value of a defined Jetpack Config key.
 *
 * Config values are injected via webpack and are almost always strings, so the
 * return type defaults to `string`. Callers reading a non-string config value
 * can override it, e.g. `jetpackConfigGet< boolean >( 'some_flag' )`.
 *
 * @param  key - The config key to look up.
 * @return The config value.
 * @throws {string} A message (note: a string, not an Error) if the key is not defined.
 */
export function jetpackConfigGet< T = string >( key: string ): T;
