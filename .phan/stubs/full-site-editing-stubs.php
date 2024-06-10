<?php
/**
 * Stubs automatically generated from WordPress.com Editing Toolkit 4.25065
 * using the definition file `tools/stubs/full-site-editing-stub-defs.php` in the Jetpack monorepo.
 *
 * Do not edit this directly! Run tools/stubs/update-stubs.sh to regenerate it.
 */

namespace {
    /**
     * Limit Global Styles on WP.com to paid plans.
     *
     * @package full-site-editing-plugin
     */
    /**
     * Checks if Global Styles should be limited on the given site.
     *
     * @param  int $blog_id Blog ID.
     * @return bool Whether Global Styles are limited.
     */
    function wpcom_should_limit_global_styles($blog_id = 0)
    {
    }
    /**
     * Checks if the current blog has custom styles in use.
     *
     * @return bool Returns true if custom styles are in use.
     */
    function wpcom_global_styles_in_use()
    {
    }
}
namespace A8C\FSE {
    /**
     * Whether or not FSE is active.
     * If false, FSE functionality should be disabled.
     *
     * @returns bool True if FSE is active, false otherwise.
     * @phan-return mixed Dummy doc for stub.
     */
    function is_full_site_editing_active()
    {
    }
    /**
     * Whether or not the site is eligible for FSE. This is essentially a feature
     * gate to disable FSE on some sites which could theoretically otherwise use it.
     *
     * By default, sites should not be eligible.
     *
     * @return bool True if current site is eligible for FSE, false otherwise.
     */
    function is_site_eligible_for_full_site_editing()
    {
    }
}
