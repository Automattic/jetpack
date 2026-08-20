# Jetpack Comments

Replaces the default WordPress comment form with social login, subscription options, and block editing. This is the successor to Highlander Comments, and the new home for the feature WordPress.com currently ships as **Verbum**.

## Status

Scaffolding only. `src/` is deliberately empty.

WordPress.com still runs the copy in `jetpack-mu-wpcom` (`src/features/verbum-comments/`), and nothing loads this package. The code moves here in reviewable chunks rather than as one drop, so each piece can be assessed on its way in.

## Moving code in

Verbum names that are contracts rather than labels have to survive the move, because renaming them breaks live sites or loses analytics history:

- `enable_verbum_commenting` and `jetpack_verbum_subscription_modal` blog options
- the `wpcom/v2/verbum/auth` and `wpcom/v2/verbum/embed` REST routes
- the `verbum`, `verbum-settings`, `verbum-dynamic-loader`, `verbum-comments-moderation`, and `verbum-gutenberg-css` script and style handles
- `window.VerbumComments`, which wpcom's login popup reads off the opener window to tell a Verbum form from a Highlander one
- the `verbum_loaded_editor` and `verbum_show_subscription_modal` form fields
- the `verbum-comment-posted`, `verbum-comment-editor`, and `verbum-subscription-modal` stats buckets
- the `verbum-comments` feature name on the Log2Logstash records for failed comment nonces
- the `verbum-*` CSS classes and `VERBUM_USING_GUTENBERG`

Two things also need to land on the wpcom side before this package can serve any traffic: a translation source for the `jetpack-comments` text domain, and something that registers it. That covers the comment form, whose strings are all PHP `__()` calls marshalled into `window.VerbumComments`.

The block editor is a separate i18n surface and needs its own plan. Its bundle is served from `widgets.wp.com/verbum-block-editor/` rather than built here, and it picks up strings through `wp_set_script_translations( 'verbum', 'default', ... )` against a hardcoded path, so none of it moves with the text domain.

Build tooling (webpack, Babel, PostCSS, TypeScript) arrives with the code that needs it. So does the `autoload` block: the mirror repo drops `.gitkeep` files, so a classmap pointing at an empty `src/` would fail `composer install` for anyone who required the package.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Jetpack Comments is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
