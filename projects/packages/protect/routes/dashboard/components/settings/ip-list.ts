import type { ProtectSettings } from '../../data/use-protect-settings';

/**
 * An IP list setting's saved value.
 *
 * @param settings - Jetpack settings.
 * @param name     - The setting holding the list.
 * @return The list, or an empty string when it isn't set.
 */
export const getIpList = ( settings: ProtectSettings | null, name: string ): string => {
	const list = settings?.[ name ];
	return typeof list === 'string' ? list : '';
};

/**
 * The entries of an IP list setting.
 *
 * @param list - The setting: addresses or ranges separated the ways the firewall accepts.
 * @return The entries.
 */
export const splitIps = ( list: string ): string[] => list.split( /[\s,;]+/ ).filter( Boolean );

/**
 * An IP list with one more address on its own line.
 *
 * @param list - The list being edited.
 * @param ip   - The address to add.
 * @return The new list.
 */
export const appendIp = ( list: string, ip: string ): string =>
	list.trim() ? `${ list.trim() }\n${ ip }` : ip;
