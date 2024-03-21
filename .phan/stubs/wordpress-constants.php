<?php
/**
 * Phan stubs for WordPress-defined constants.
 *
 * Unfortunately the php-stubs/wordpress-globals package is broken-as-designed,
 * because the maintainer doesn't actually want anyone to use it. Instead he
 * wants people to use PHPStan, which needs a bootstrap file for constants.
 *
 * But he does have a bit of a point. Before adding a constant here, please
 * consider whether you could use a function instead. This includes things like
 * cookie-related constants (you can probably use core's cookie-setting methods
 * instead) and things like DB_HOST (use `$wpdb` instead).
 *
 * Note the actual values shouldn't matter here, but getting the types right is
 * probably a good idea. Avoid `true` and `false`, as those are distinct from
 * "bool".
 *
 * @package automattic/jetpack-monorepo
 */

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable -- Don't care, this is stubs.

// There are no core functions to read these constants.
define( 'ABSPATH', './' );
define( 'WP_DEBUG', (bool) $v );
define( 'WP_DEBUG_LOG', (bool) $v );
define( 'WP_PLUGIN_DIR', './' );
define( 'WPMU_PLUGIN_DIR', './' );
define( 'EMPTY_TRASH_DAYS', 30 * 86400 );
define( 'SCRIPT_DEBUG', (bool) $v );
define( 'WP_LANG_DIR', './' );

// Constants for expressing human-readable intervals.
define( 'MINUTE_IN_SECONDS', 60 );
define( 'HOUR_IN_SECONDS', 60 * MINUTE_IN_SECONDS );
define( 'DAY_IN_SECONDS', 24 * HOUR_IN_SECONDS );
define( 'WEEK_IN_SECONDS', 7 * DAY_IN_SECONDS );
define( 'MONTH_IN_SECONDS', 30 * DAY_IN_SECONDS );
define( 'YEAR_IN_SECONDS', 365 * DAY_IN_SECONDS );

// Constants for expressing human-readable data sizes in their respective number of bytes.
define( 'KB_IN_BYTES', 1024 );
define( 'MB_IN_BYTES', 1024 * KB_IN_BYTES );
define( 'GB_IN_BYTES', 1024 * MB_IN_BYTES );
define( 'TB_IN_BYTES', 1024 * GB_IN_BYTES );
define( 'PB_IN_BYTES', 1024 * TB_IN_BYTES );
define( 'EB_IN_BYTES', 1024 * PB_IN_BYTES );
define( 'ZB_IN_BYTES', 1024 * EB_IN_BYTES );
define( 'YB_IN_BYTES', 1024 * ZB_IN_BYTES );

// wpdb method parameters.
define( 'OBJECT', 'OBJECT' );
define( 'OBJECT_K', 'OBJECT_K' );
define( 'ARRAY_A', 'ARRAY_A' );
define( 'ARRAY_N', 'ARRAY_N' );

// Constants from WP_Filesystem.
define( 'FS_CONNECT_TIMEOUT', 30 );
define( 'FS_TIMEOUT', 30 );
define( 'FS_CHMOD_DIR', 0755 );
define( 'FS_CHMOD_FILE', 0644 );

// Rewrite API Endpoint Masks.
define( 'EP_NONE', 0 );
define( 'EP_PERMALINK', 1 );
define( 'EP_ATTACHMENT', 2 );
define( 'EP_DATE', 4 );
define( 'EP_YEAR', 8 );
define( 'EP_MONTH', 16 );
define( 'EP_DAY', 32 );
define( 'EP_ROOT', 64 );
define( 'EP_COMMENTS', 128 );
define( 'EP_SEARCH', 256 );
define( 'EP_CATEGORIES', 512 );
define( 'EP_TAGS', 1024 );
define( 'EP_AUTHORS', 2048 );
define( 'EP_PAGES', 4096 );
define( 'EP_ALL_ARCHIVES', EP_DATE | EP_YEAR | EP_MONTH | EP_DAY | EP_CATEGORIES | EP_TAGS | EP_AUTHORS );
define( 'EP_ALL', EP_PERMALINK | EP_ATTACHMENT | EP_ROOT | EP_COMMENTS | EP_SEARCH | EP_PAGES | EP_ALL_ARCHIVES );

// Templating-related WordPress constants.
define( 'WP_DEFAULT_THEME', 'twentytwentywhenever' );
