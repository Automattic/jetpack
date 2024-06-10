<?php
/**
 * Stubs automatically generated from AMP 2.5.3 and AMP for WP 1.0.95
 * using the definition file `tools/stubs/amp-stub-defs.php` in the Jetpack monorepo.
 *
 * Do not edit this directly! Run tools/stubs/update-stubs.sh to regenerate it.
 */

/**
 * Whether this is in 'canonical mode'.
 *
 * Themes can register support for this with `add_theme_support( AMP_Theme_Support::SLUG )`:
 *
 * ```php
 * add_theme_support( AMP_Theme_Support::SLUG );
 * ```
 *
 * This will serve templates in AMP-first, allowing you to use AMP components in your theme templates.
 * If you want to make available in transitional mode, where templates are served in AMP or non-AMP documents, do:
 *
 * ```php
 * add_theme_support( AMP_Theme_Support::SLUG, array(
 *     'paired' => true,
 * ) );
 * ```
 *
 * Transitional mode is also implied if you define a `template_dir`:
 *
 * ```php
 * add_theme_support( AMP_Theme_Support::SLUG, array(
 *     'template_dir' => 'amp',
 * ) );
 * ```
 *
 * If you want to have AMP-specific templates in addition to serving AMP-first, do:
 *
 * ```php
 * add_theme_support( AMP_Theme_Support::SLUG, array(
 *     'paired'       => false,
 *     'template_dir' => 'amp',
 * ) );
 * ```
 *
 * @see AMP_Theme_Support::read_theme_support()
 * @return boolean Whether this is in AMP 'canonical' mode, that is whether it is AMP-first and there is not a separate (paired) AMP URL.
 */
function amp_is_canonical()
{
}
/**
 * Determines whether the legacy AMP post templates are being used.
 *
 * @since 2.0
 * @return bool
 */
function amp_is_legacy()
{
}
/**
 * Determine whether AMP is available for the current URL.
 *
 * @since 2.0
 *
 * @return bool Whether there is an AMP version for the provided URL.
 * @global string $pagenow
 * @global WP_Query $wp_query
 */
function amp_is_available()
{
}
/**
 * Retrieves the full AMP-specific permalink for the given post ID.
 *
 * On a site in Standard mode, this is the same as `get_permalink()`.
 *
 * @since 0.1
 *
 * @param int $post_id Post ID.
 * @return string AMP permalink.
 */
function amp_get_permalink($post_id)
{
}
/**
 * Determine whether the current request is for an AMP page.
 *
 * This function cannot be called before the parse_query action because it needs to be able
 * to determine the queried object is able to be served as AMP. If 'amp' theme support is not
 * present, this function returns true just if the query var is present. If theme support is
 * present, then it returns true in transitional mode if an AMP template is available and the query
 * var is present, or else in standard mode if just the template is available.
 *
 * @since 2.0 Formerly known as is_amp_endpoint().
 *
 * @return bool Whether it is the AMP endpoint.
 * @global WP_Query $wp_query
 */
function amp_is_request()
{
}
/**
 * Determine whether the current response being served as AMP.
 *
 * This function cannot be called before the parse_query action because it needs to be able
 * to determine the queried object is able to be served as AMP. If 'amp' theme support is not
 * present, this function returns true just if the query var is present. If theme support is
 * present, then it returns true in transitional mode if an AMP template is available and the query
 * var is present, or else in standard mode if just the template is available.
 *
 * @since 0.1
 * @since 2.0 Renamed to AMP-prefixed version, amp_is_request().
 * @deprecated Use amp_is_request() instead.
 *
 * @return bool Whether it is the AMP endpoint.
 */
function is_amp_endpoint()
{
}
/**
 * Class AMP_Options_Manager
 *
 * @internal
 */
class AMP_Options_Manager
{
    /**
     * Get plugin option.
     *
     * @param string $option  Plugin option name.
     * @param bool   $default Default value.
     *
     * @return mixed Option value.
     */
    public static function get_option($option, $default = \false)
    {
    }
}
/**
 * Registers a submenu page to access the AMP template editor panel in the Customizer.
 *
 * @internal
 */
function amp_add_customizer_link()
{
}
// AMP endpoint Verifier
/**
 * @phan-return mixed Dummy doc for stub.
 */
function ampforwp_is_amp_endpoint()
{
}
