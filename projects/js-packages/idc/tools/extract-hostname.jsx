/**
 * Extract hostname from an URL if needed.
 *
 * @param {string} url - The URL to extract hostname from.
 * @returns {string} The hostname extracted from the URL.
 */
const extractHostname = url => ( /^https?:\/\//.test( url ) ? new URL( url ).hostname : url );

export default extractHostname;
