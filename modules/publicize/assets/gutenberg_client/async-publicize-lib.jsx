/**
 * Scripts for Gutenberg Publicize extension.
 *
 * @file Scripts for Gutenberg Publicize extension.
 * @since  5.9.1
 */

/**
 * Internal dependencies
 */
const { gutenberg_publicize_setup } = window;

/**
 * Get connection form set up data.
 *
 * Retrieves array of filtered connection UI data (labels, checked value,
 * URLs, etc.)
 *
 * @see ui.php
 *
 * @since 5.9.1
 *
 * @return {object} List of filtered connection UI data.
 */
export function getPublicizeConnections() {
	return JSON.parse( gutenberg_publicize_setup.connectionList );
}

/**
 * Gets list of all possible connections.
 *
 * Gets list of possible social sites ('twitter', 'facebook, etc..')
 *
 * @since 5.9.1
 *
 * @return {object} List of possible services that can be connected to
 */
export function getAllConnections() {
	return JSON.parse( gutenberg_publicize_setup.allServices );
}
