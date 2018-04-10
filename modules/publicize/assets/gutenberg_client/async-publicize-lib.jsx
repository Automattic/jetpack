/**
 * Scripts for Gutenberg Publicize extension.
 *
 * @file Scripts for Gutenberg Publicize extension.
 * @since  5.9.1
 */


/**
 * Get connection form set up data.
 *
 * Set up hooks to extend legacy Publicize behavior.
 *
 * @since 5.9.1
 *
 * @global gutenberg_publicize_setup Generated via localization in {@see class-jetpack-publicize-gutenberg.php}
 */
export function getPublicizeConnections() {
	return JSON.parse( gutenberg_publicize_setup.connectionList );
}


