<?php
/**
 * Stubs automatically generated from WordPress.com Editing Toolkit 4.28277
 * using the definition file `tools/stubs/full-site-editing-stub-defs.php` in the Jetpack monorepo.
 *
 * Do not edit this directly! Run tools/stubs/update-stubs.sh to regenerate it.
 */

namespace A8C\FSE;

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
