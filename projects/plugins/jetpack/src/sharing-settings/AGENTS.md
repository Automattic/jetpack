# AGENTS.md

Guidance for AI coding agents working on the Settings > Sharing screen.

## What this directory is

It owns the wp-admin Settings > Sharing screen: menu registration, the two
feature sections (Sharing buttons, Like buttons), the shared placement section,
the extras section, and the form handling for all of them. Registration happens
unconditionally from the `is_admin()` block in `load-jetpack.php`, so the screen
and every section on it exist whichever modules are active.

`Section_State` decides which of four variants a section renders. `Environment`
reads the site facts it needs. Everything else renders.

`load-jetpack.php` does not run on WordPress.com Simple, so the registration
above does not happen there. Simple's own registration is a wpcom-side change.

## Environment differences

This is where the screen gets its complexity, and most of it is invisible from
the Jetpack side alone.

**WordPress.com Simple has no modules.** `Modules::is_active()` returns `true`
unconditionally under `IS_WPCOM`, and wpcom loads both features regardless:
sharedaddy from `wp-content/admin-plugins/post-flair.php` on `plugins_loaded:5`,
likes from `wp-content/mu-plugins/likes.php` on `plugins_loaded:9`. So `OFF` and
`BLOCK_CALL_TO_ACTION` are unreachable there — Simple only ever reaches
`CONFIGURE` or `CONFIGURE_WITH_BLOCK_NUDGE`. Any "module inactive" behaviour you
add is Jetpack and Atomic only.

**Simple reuses `Jetpack_Likes_Settings` without the Likes module.**
`wp-content/mu-plugins/likes/jetpack-likes-settings.php` is a shim that requires
the plugin's copy of that class. `modules/likes.php` never loads on Simple;
`wp-content/mu-plugins/likes/jetpack-likes.php` is its wpcom twin. Anything you
delete from `Jetpack_Likes_Settings` can therefore break Simple without a single
reference in this repo.

**Simple still renders the Likes settings through `sharing_global_options`**,
hooked from `wp-content/mu-plugins/likes/jetpack-likes.php`. Until that hookup is
removed (CM-913), Simple renders the Likes settings twice — once in the services
table, once as this screen's section. Do not delete `admin_settings_init()` or
`admin_settings_callback()` from `Jetpack_Likes_Settings` before that lands, or
the settings vanish from Simple entirely.

**`WP_SHARING_PLUGIN_URL` is not the same thing in both environments.** The
plugin defines it with `plugin_dir_url()`; wpcom hardcodes a sun/moon-aware path
in `post-flair.php`. Moving the admin assets out of `modules/sharedaddy/` is a
two-repo change, not a rename.

**Disconnected sites still report their modules active.**
`Modules::get_active()` intersects with `get_available()`, which is called with
no arguments, so nothing is filtered on connection. A site that cannot render a
Like button will still answer `true` to `is_active( 'likes' )`. That is what
`Environment::likes_supported()` is for.

## Hooks that must keep firing

Third parties extend this screen through these, so they fire from the new page
even though nothing here uses them to assemble it: `pre_admin_screen_sharing` at
the top of the page, `sharing_global_options` at the end of the services table,
`sharing_admin_update` on a services save, and
`sharing_show_buttons_on_row_start` / `_end` around the placement row.

`sharing_global_options` is the one with a gap to watch. It normally fires from
`Services_Config`, which only renders when the Sharing module is on, but its
consumers are not all gated on that module — `Twitter_Cards` hangs the Twitter
Site Tag there and is gated only on `jetpack_disable_twitter_cards`. That is what
`Extras_Section` is for: with Sharing off it renders the same action in its own
form and fires `sharing_admin_update` on save. Consumers verify their own nonces,
so firing it from a form they did not render into is safe.

## Placement defaults

`sharing-options['global']['show']` is frequently absent, and every renderer
applies its own default when it is: `Sharing_Service::get_global_options()` uses
posts and pages, `Jetpack_Likes_Settings::get_options()` adds public commentable
CPTs behind `jetpack_likes_default_post_types`. Read it raw and the checkboxes
render unchecked on a site where the buttons are live — and since the next save
posts those checkboxes back, a save the owner thinks is a no-op turns the feature
off. `Placement_Section::selected_post_types()` is the one way in; it also maps
the pre-2.x scalar form (`posts`, `index`, `posts-index`), which is still live
data rather than history.

## Testing

**`is_admin()` is false under WP-CLI**, so the init in `load-jetpack.php` never
runs there and `wp eval` will report the menu as absent whatever the code does.
Call `Sharing_Settings_Page::init()` by hand to test the class; proving the
wiring needs a real authenticated admin request.

**wp-admin over SSL needs two cookies**, `SECURE_AUTH_COOKIE` and
`LOGGED_IN_COOKIE`, generated from the same session token. The logged-in cookie
alone gets you a redirect with `reauth=1`.

**`src` is classmap-autoloaded**, so a new class needs `composer dump-autoload`
before it resolves. On a host without composer, the file to patch is
`vendor/composer/jetpack_autoload_classmap.php` — the Jetpack autoloader's map,
whose entries are `array( 'version' => …, 'path' => … )`. Composer's own
`autoload_classmap.php` sits next to it and is *not* what resolves these classes.

**Keep `Section_State` free of WordPress calls.** That is what lets every state
be asserted without a bootstrapped site. Environment lookups belong in
`Environment`.

## Moving more code in here

Escape global class names for the namespace. `new X` and `X::` are the obvious
cases; `instanceof X` is the one that gets missed, and neither `php -l` nor
PHPCS will catch it — it fatals at runtime on whichever path happens to hit it.

Grep the moved file directly rather than stripping comments and strings first.
A scrubbing pass can silently swallow the match and report the file clean.
