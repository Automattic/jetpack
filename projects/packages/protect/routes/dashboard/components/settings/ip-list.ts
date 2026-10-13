/**
 * The entries of an IP list setting.
 *
 * @param list - The setting: addresses or ranges separated the ways the firewall accepts.
 * @return The entries.
 */
export const splitIps = ( list: unknown ): string[] =>
	typeof list === 'string' ? list.split( /[\s,;]+/ ).filter( Boolean ) : [];

/**
 * An IP list with one more address on its own line.
 *
 * @param list - The list being edited.
 * @param ip   - The address to add.
 * @return The new list.
 */
export const appendIp = ( list: string, ip: string ): string =>
	list.trim() ? `${ list.trim() }\n${ ip }` : ip;
