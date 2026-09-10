# Jetpack Comments

Replaces the default WordPress comment form. This is the successor to Highlander Comments, and the new home for the feature WordPress.com ships as Verbum.

Nothing loads unless the filter says so:

```php
add_filter( 'jetpack_comments_new_hotness', '__return_true' );
```

While it returns false the site's existing comment experience is untouched.

Register it early. The two loaders below read it at different points, so the
deadline is the earlier of the two: `plugins_loaded` on Simple, `after_setup_theme`
for the Jetpack module. A plugin or mu-plugin makes both. A theme's `functions.php`
only makes the second, so on Simple the filter would be read before it was added.

## What it does

The form renders on the site the comment is posted to, and posts to that site's own `wp-comments-post.php`. No iframe, and no call to WordPress.com, so it behaves the same on Simple, Atomic and self-hosted.

- A textarea that grows as you type.
- Name, email and website for logged-out readers, honoring `require_name_email` and the comment cookies opt-in. These use core's own field names.
- An identity line and a log-out link for readers logged in to the site itself.
- Reply threading, by watching the `comment_parent` input WordPress rewrites.

Sites that require registration get the same form with a log-in prompt in place of the guest fields, and the submit button held disabled.

## Not here yet

Two parts of the experience this replaces are deliberately left for a later phase.

**Social login.** Commenting as a WordPress.com or Facebook account, and the `hc_post_as`, `hc_foreign_user_id` and `hc_avatar` meta that carries it. Until it lands, a site that requires registration only offers a local account, so this is not yet a like-for-like replacement anywhere that relies on WordPress.com login.

**Subscriptions.** The "email me new comments" and "email me new posts" options, and the modal after submitting. Jetpack Subscriptions adds its checkboxes through `comment_form_submit_field`, which this form replaces wholesale, so they are dropped while the filter is on. On Simple the older `subscription_comment_form` output is removed for the same reason, so that no host shows a subscribe option rather than one showing it and another not.

## What it stores

Nothing beyond what WordPress already keeps. A comment's author, email and URL go
in the comment row, written by core, and the avatar is derived from the email at
display time. No comment meta is written at all.

That is deliberate. The experience this replaces writes `hc_post_as`,
`hc_foreign_user_id`, `hc_avatar` and `hc_wpcom_id_sig`, and those exist to carry
an identity WordPress cannot derive from an email address. Guests and users logged
in to the site itself are both derivable, so there is nothing to record.

The rule to apply when that changes: **store a field in the same change that adds
something which reads it.** `hc_avatar` is read when rendering a comment, so this
package reads it too, for comments that already carry one. `hc_foreign_user_id` is
read only for the `wordpress` provider, alongside a signature that verifies it,
which is the shape worth copying.

## Layout

`src/` is organized by feature, not by language. Each feature owns its PHP, its components and its styles. A directory means several files collaborate; one class stays one file.

```
src/
  class-comments.php    the filter, and what to boot
  class-avatars.php     avatars on comments already written
  form/                 takeover, mount, nonce, layout, the text box, submit
  identity/             who is commenting: guest fields, log-in prompt, attribution
  ui/                   widgets shared across the form
  shared/               signals, and the PHP-to-JS settings shape
```

Sections appear when there is something to put in them. Subscriptions, a block
editor and submission handling each earn a directory once they exist, and a REST
route belongs to the feature it serves rather than to a folder of endpoints.

## Where it loads from

Two places check the filter, so one switch covers every environment:

| Environment | Loader | What stands down |
| --- | --- | --- |
| Self-hosted, Atomic | `plugins/jetpack`, in the Comments module | `Jetpack_Comments`, and its iframe to `jetpack.wordpress.com` |
| Simple | `packages/jetpack-mu-wpcom`, in `load_verbum_comments()` | `Verbum_Comments` |

The Comments module still has to be active on the Jetpack plugin side. Its settings screen is left in place, and the greeting and color scheme it sets are both applied here.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Jetpack Comments is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
