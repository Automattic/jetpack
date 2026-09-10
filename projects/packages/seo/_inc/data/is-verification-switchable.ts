import getOverview from './get-overview';

/**
 * Whether this site can switch the `verification-tools` module on and off.
 *
 * Reads the `verification_switchable` signal from the Overview slice, which the
 * server bootstraps on every SEO route (see `Admin_Page::inject_script_data()`), so
 * the Settings tab can gate the control synchronously without loading its own data.
 *
 * False where that module isn't present — WordPress.com Simple ships no Jetpack
 * modules and `Modules::is_active()` reports every module active there, so the toggle
 * would show "on", get refused, and snap back. The control is hidden instead.
 *
 * Treats a missing bootstrap as not switchable, so an unknown state never presents a
 * control that might not work.
 *
 * @return Whether the site-verification module can be switched on this site.
 */
export default function isVerificationSwitchable(): boolean {
	return getOverview()?.verification_switchable ?? false;
}
