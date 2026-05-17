const WP_CONFIG = `<?php
/**
 * The base configuration for WordPress.
 *
 * (mocked sample for design review — not real config.)
 */

define( 'DB_NAME', 'wordpress' );
define( 'DB_USER', 'wordpress' );
define( 'DB_HOST', 'localhost' );
$table_prefix = 'wp_';
require_once ABSPATH . 'wp-settings.php';
`;

const STYLE_CSS = `/*
Theme Name: Twenty Twenty-Five (mock)
Version: 1.2
*/

body {
	font-family: system-ui, sans-serif;
}
`;

const DATABASE_SQL = `-- mocked sample for design review
CREATE TABLE wp_posts (
	ID bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
	post_title text NOT NULL,
	PRIMARY KEY (ID)
);
`;

export const MOCK_FILE_CONTENTS: Record< string, string > = {
	'/wp-config.php': WP_CONFIG,
	'/wp-content/themes/twentytwentyfive/style.css': STYLE_CSS,
	'/sql/database.sql': DATABASE_SQL,
};

/**
 * Returns the mocked text contents for a path, or null when no fixture is registered.
 *
 * @param path - Absolute path under the backup.
 * @return The text contents, or null.
 */
export function findContents( path: string ): string | null {
	return MOCK_FILE_CONTENTS[ path ] ?? null;
}
