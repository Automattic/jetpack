/** The Jetpack settings holding the firewall's IP lists and automatic rules. */
export const IP_BLOCK_LIST = 'jetpack_waf_ip_block_list';
export const IP_ALLOW_LIST = 'jetpack_waf_ip_allow_list';
export const AUTOMATIC_RULES = 'jetpack_waf_automatic_rules';

/**
 * The setting that turns an IP list on or off.
 *
 * @param list - The setting holding the list.
 * @return The on/off setting's name.
 */
export const enabledKey = ( list: string ) => `${ list }_enabled`;
