<?php
/**
 * Stubs automatically generated from Gutenberg 24.0.0
 * using the definition file `tools/stubs/gutenberg-stub-defs.php` in the Jetpack monorepo.
 *
 * Do not edit this directly! Run tools/stubs/update-stubs.sh to regenerate it.
 */

/**
 * Retrieves the root plugin path.
 *
 * @since 0.1.0
 *
 * @return string Root path to the gutenberg plugin.
 */
function gutenberg_dir_path()
{
}
/**
 * Prints font-face styles for fonts on the frontend.
 *
 * @since Gutenberg 20.0.0
 */
function gutenberg_print_font_faces()
{
}
/**
 * Function to get the settings resulting of merging core, theme, and user data.
 *
 * @param array $path    Path to the specific setting to retrieve. Optional.
 *                       If empty, will return all settings.
 * @param array $context {
 *     Metadata to know where to retrieve the $path from. Optional.
 *
 *     @type string $block_name Which block to retrieve the settings from.
 *                              If empty, it'll return the settings for the global context.
 *     @type string $origin     Which origin to take data from.
 *                              Valid values are 'all' (core, theme, and user) or 'base' (core and theme).
 *                              If empty or unknown, 'all' is used.
 * }
 *
 * @return array The settings to retrieve.
 */
function gutenberg_get_global_settings($path = array(), $context = array())
{
}
/**
 * Gets the styles resulting of merging core, theme, and user data.
 *
 * @since 5.9.0
 * @since 6.3.0 the internal link format "var:preset|color|secondary" is resolved
 * to "var(--wp--preset--font-size--small)" so consumers don't have to.
 * @since 6.3.0 `transforms` is now usable in the `context` parameter. In case [`transforms`]['resolve_variables']
 * is defined, variables are resolved to their value in the styles.
 *
 * @param array $path    Path to the specific style to retrieve. Optional.
 *                       If empty, will return all styles.
 * @param array $context {
 *     Metadata to know where to retrieve the $path from. Optional.
 *
 *     @type string $block_name Which block to retrieve the styles from.
 *                              If empty, it'll return the styles for the global context.
 *     @type string $origin     Which origin to take data from.
 *                              Valid values are 'all' (core, theme, and user) or 'base' (core and theme).
 *                              If empty or unknown, 'all' is used.
 *     @type array $transforms Which transformation(s) to apply.
 *                              Valid value is array( 'resolve-variables' ).
 *                              If defined, variables are resolved to their value in the styles.
 * }
 * @return array The styles to retrieve.
 */
function gutenberg_get_global_styles($path = array(), $context = array())
{
}
