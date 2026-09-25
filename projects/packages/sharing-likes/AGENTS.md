# AGENTS.md

Guidance for AI coding agents working on the Sharing & Likes package.

## What this package is

Today it owns the wp-admin Settings > Sharing screen, under `src/settings/`: menu
registration, the three feature sections (Sharing buttons, Like buttons, Comment
Likes), the shared placement section, the extras section, and the form handling for all of
them. The Jetpack plugin hooks it up from the `is_admin()` block in
`load-jetpack.php`, so the screen and every section on it exist whichever
modules are active. The menu itself only registers where
`Environment::settings_screen_supported()` holds (Simple, a connected site, or
offline mode): anywhere else neither the modules nor their blocks load, so
the screen would have nothing to offer.

`Section_State` decides which of four variants a section renders. `Environment`
reads the site facts it needs. Everything else renders.

Every setting on the screen saves through one form and one Save button,
`Settings_Form`. The sections cannot share a `<form>` element, because the
services list nests the legacy forms its script submits over AJAX. So the form
renders empty at the end of the page, and `Settings_Form::render_fields()` points
each section's fields at it through the HTML `form` attribute, third-party fields
included. Each section also posts its name, and `Post_Handler` saves only the
sections named: a missing field reads as "off", so saving a section that was not
on screen would switch it off. The "Switch to…" and "Turn on…" buttons are actions
rather than settings, and keep their own single-button forms and nonces.

The two off variants are not symmetrical. `OFF` offers a form that turns the
module back on; `BLOCK_CALL_TO_ACTION` deliberately does not, because the
Jetpack dashboard drops its own module toggle on exactly those sites — see
`moduleAction()` in `_inc/client/sharing/share-buttons.jsx` and `likes.jsx`.
Adding a way back there reopens a door the dashboard closed on purpose.

`load-jetpack.php` does not run on WordPress.com Simple, so the registration
above does not happen there. `sharing_admin_init()` in
`modules/sharedaddy/sharing.php`, the one Sharing file wpcom loads, registers
the screen and `Post_Handler` under an `is_wpcom_simple()` guard instead. That
bridge goes once wpcom registers the screen itself (CM-913).

The screen is plain wp-admin chrome. It deliberately does not render inside
`Jetpack_Admin_Page::wrap_ui()`, which is what keeps this package free of the
plugin.

## What the package may depend on

Composer dependencies only: `jetpack-connection` (which also supplies
`Jetpack_Options`) and `jetpack-status` (which also supplies `Modules`). Never
`require` a plugin file or call a plugin function unguarded.

Two plugin classes are still used opportunistically because the code that defines
them has not moved here yet: `Sharing_Service` (sharedaddy's services,
`Services_Config`) and `Jetpack_Likes_Settings` (the Likes placement default,
`Placement_Section`). The render paths guard both with `class_exists()` and fall
back; `Services_Config`'s save and AJAX handlers do not, because only
`modules/sharedaddy/sharing.php` wires them up and it requires
`sharing-service.php` first. Register those handlers from anywhere else and they
fatal. Both
are declared to Phan through `parse_file_list` in `.phan/config.php`; that entry
is for static analysis only and creates no runtime dependency. Move those classes
here and both the guard and the Phan entry go away.

## Environment differences

This is where the screen gets its complexity, and most of it is invisible from
the Jetpack side alone.

**WordPress.com Simple has no modules.** `Modules::is_active()` returns `true`
unconditionally under `IS_WPCOM`, and wpcom loads both features regardless:
sharedaddy from `wp-content/admin-plugins/post-flair.php` on `plugins_loaded:5`,
likes from `wp-content/mu-plugins/likes.php` on `plugins_loaded:9`. So `OFF` is
unreachable there, and any "module inactive" behaviour you add is Jetpack and
Atomic only.

The "Switch to the … block" buttons still work on Simple, through settings
rather than modules: `Post_Handler` empties `sharing-services`, or sets
`disabled_likes` and `disabled_reblogs` (the legacy widget renders for either
button). `Environment::legacy_sharing_switched_off()` and
`legacy_likes_switched_off()` read them back, and `Section_State` treats that as
off wherever the block is a route, so the section lands on `BLOCK_CALL_TO_ACTION`
with no way back, as a deactivated module does. The same holds on Jetpack for an
active Sharing module with every service removed. Without a block route the
options stay, since they are then the only way back.

**Comment Likes are a section of their own, with no variants.** Comments have
no block to move to, and the module runs without the Likes module, so
`Comment_Likes_Section` renders wherever `Environment::likes_supported()` holds,
and the Like buttons section describes the Likes module alone. The two platforms
disagree on what Comment Likes read:

- Simple stores the switch in `jetpack_comment_likes_enabled`, and wpcom's
  `comment-likes-capture.php` shows them on single posts and pages whatever the
  placement says.
- On Jetpack and Atomic, the switch is the `comment-likes` module, which never
  reads that option. It only renders where `Jetpack_Likes_Settings::is_likes_visible()`
  holds, so it follows the sitewide Likes default and the placement.

`Environment::comment_likes_follow_likes_settings()` is that split. Where it
holds, the section states where Comment Likes appear, placement stays on screen
with both button features off, and once the Likes module is off the section
also carries the sitewide default (`Likes_Section::render_sitewide_default_row()`),
claiming `Settings_Form::SECTION_LIKES` so the Likes save handles it. That is
why Comment Likes do not hold back the Like block route.

**Simple reuses `Jetpack_Likes_Settings` without the Likes module.**
`wp-content/mu-plugins/likes/jetpack-likes-settings.php` is a shim that requires
the plugin's copy of that class. `modules/likes.php` never loads on Simple;
`wp-content/mu-plugins/likes/jetpack-likes.php` is its wpcom twin. Anything you
delete from `Jetpack_Likes_Settings` can therefore break Simple without a single
reference in this repo.

**`WP_SHARING_PLUGIN_URL` is not the same thing in both environments.** The
plugin defines it with `plugin_dir_url()`; wpcom hardcodes a sun/moon-aware path
in `post-flair.php`. Moving the admin assets out of `modules/sharedaddy/` is a
two-repo change, not a rename.

**Disconnected sites still report their modules active.**
`Modules::get_active()` intersects with `get_available()`, which is called with
no arguments, so nothing is filtered on connection. A site that cannot render a
Like button will still answer `true` to `is_active( 'likes' )`. That is what
`Environment::likes_supported()` is for. Sharing needs no connection, but
`Jetpack::load_modules()` includes nothing on a site that is neither connected
nor offline, so `Environment::legacy_sharing_supported()` applies the same guard
before `sharing_module_running()` reads the module: an active-but-unloaded module
has no `Sharing_Service` to configure.

## Hooks that must keep firing

Third parties extend this screen through these, so they fire from the new page
even though nothing here uses them to assemble it: `pre_admin_screen_sharing` at
the top of the page, `sharing_global_options` at the end of the services table,
`sharing_admin_update` on any save that rendered that action's fields, and
`sharing_show_buttons_on_row_start` / `_end` around the placement row. All four
are now documented here rather than in `modules/sharedaddy/sharing.php`, which no
longer fires any of them. Nothing in the monorepo hooks
`pre_admin_screen_sharing` either; it fires for third parties only.

`Services_Config::global_options()` is where that action fires. The rows it
returns close the services table: the screen's own two first, `Sharing_Resources`
("Disable CSS and JS") and `Twitter_Site_Tag`, then whatever third parties hang
off the action. `Post_Handler::save_global_options()` saves them the same way:
the screen's own fields under the screen's nonce, then `sharing_admin_update`.
Nothing in the monorepo hooks either action any more. A setting the screen shows
belongs in a class here with `is_available()`, `render()` and `save()`, not on a
hook.

Not every row depends on the Sharing module, which is what `Extras_Section` is
for: whenever the services list is hidden, it renders the same rows as a section
of its own. `Sharing_Resources` never reaches it, since it only affects legacy
buttons; `Twitter_Site_Tag` does. The Site Tag still drives output with both
Sharing and Publicize off. Open Graph is not the reason — `Jetpack::check_open_graph()`
only enables it for those two modules, so the `twitter:site` meta tag does go away.
The Sharing Buttons block is: `Sharing_Source_Block::sharing_x_via()` reads the same
`jetpack_twitter_cards_site_tag` filter for the X share URL's `via`, and that block is
registered on `init` whatever the modules are doing. Which is the route this screen
sends people down when it offers `BLOCK_CALL_TO_ACTION`. Simple shows the field
too, although its Twitter Cards read `twitter_via`: wpcom serves and saves
`jetpack-twitter-cards-site-tag` from `twitter_via` there, so the field manages
the value Simple uses. Do not give Simple a second field for `twitter_via`.

Each `save()` bails where its `render()` would have printed nothing: an unchecked
box posts nothing, so saving a field that was not on screen would switch it off.
That is also why `sharing_admin_update` only fires when one of its two hosts was
on screen. A `save()` alone is not enough for a field whose availability can move
between the two requests, though — a service added since the form was built flips
`Sharing_Resources::is_available()` on — so `Post_Handler` gates that one on the
services section having claimed the form too. Firing it under a nonce its consumers did not mint is not free, and the
rule is not "consumers verify their own nonces" — check before adding one. A
consumer that verifies the old screen's `sharing-options` nonce fails closed and
silently saves nothing. A consumer that
verifies nothing, relying on the caller having done it, writes whatever the
request carries.

## Placement defaults

`sharing-options['global']['show']` is frequently absent, and every renderer
applies its own default when it is: `Sharing_Service::get_global_options()` uses
posts and pages, `Jetpack_Likes_Settings::get_options()` adds public commentable
CPTs behind `jetpack_likes_default_post_types`. Read it raw and the checkboxes
render unchecked on a site where the buttons are live — and since the next save
posts those checkboxes back, a save the owner thinks is a no-op turns the feature
off. `Placement_Section::selected_post_types()` is the one way in; it also maps
the older scalar form (`posts`, `index`, `posts-index`), which is still live
data rather than history.

## Testing

`composer phpunit` from the package directory. The suite runs on WorDBless, so
test classes extend `WorDBless\BaseTestCase`; create users with `wp_insert_user()`
rather than a factory.

**`is_admin()` is false under WP-CLI**, so the init in `load-jetpack.php` never
runs there and `wp eval` will report the menu as absent whatever the code does.
Call `Settings_Page::init()` by hand to test the class; proving the wiring needs a
real authenticated admin request.

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

**A block theme is available to tests.** `tests/php/fixtures/themes/block-theme`
ships `templates/single.html`, which is what makes `wp_is_block_theme()` true and
gives `Environment::single_template_editor_url()` a real target. The `Section_Environment`
trait registers the directory and pins the stylesheet to it; the suite's default
theme is neither a block theme nor resolvable, so nothing reaches the block
variants without that pin.

## Moving more code in here

Escape global class names for the namespace. `new X` and `X::` are the obvious
cases; `instanceof X` is the one that gets missed, and neither `php -l` nor
PHPCS will catch it — it fatals at runtime on whichever path happens to hit it.

Grep the moved file directly rather than stripping comments and strings first.
A scrubbing pass can silently swallow the match and report the file clean.

Translate strings against the `jetpack-sharing-likes` text domain, not `jetpack`.
