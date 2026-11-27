/**
 * Whether the site's host said it sells nothing here, which leaves out Jetpack's own offers too.
 *
 * @param url - The host's purchase address: a URL, '' for nothing to sell, or null or undefined when no host answered.
 * @return True for ''.
 */
export const hostSellsNothing = ( url?: string | null ): boolean => url === '';
