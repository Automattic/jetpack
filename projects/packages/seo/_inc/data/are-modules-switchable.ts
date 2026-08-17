import getOverview from './get-overview';

/**
 * Whether this site can switch Jetpack modules on and off.
 *
 * Reads the `modules_switchable` signal from the Overview slice, which the server
 * bootstraps on every SEO route (see `Admin_Page::inject_script_data()`), so any
 * tab can gate a module control synchronously without loading its own data.
 *
 * False on WordPress.com Simple: it ships no Jetpack modules and `Modules::is_active()`
 * reports every module active there, so a module toggle would show "on", refuse the
 * write, and snap back. The controls are hidden instead.
 *
 * Treats a missing bootstrap as not switchable, so an unknown state never presents a
 * control that might not work.
 *
 * @return Whether Jetpack modules can be switched on this site.
 */
export default function areModulesSwitchable(): boolean {
	return getOverview()?.modules_switchable ?? false;
}
