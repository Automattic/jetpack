# Jetpack Comments

Replaces the default WordPress comment form. This is the successor to Highlander Comments, and the new home for the feature WordPress.com ships as Verbum.

Nothing loads unless the filter says so:

```php
add_filter( 'jetpack_comments_new_hotness', '__return_true' );
```

While it returns false the site's existing comment experience is untouched.

## What it does

The form renders on the site the comment is posted to, and posts to that site's own `wp-comments-post.php`. No iframe, and no call to WordPress.com, so it behaves the same on Simple, Atomic and self-hosted.

- A textarea that grows as you type.
- Name, email and website for logged-out readers, honoring `require_name_email` and the comment cookies opt-in. These use core's own field names.
- An identity line and a log-out link for readers logged in to the site itself.
- Reply threading, by watching the `comment_parent` input WordPress rewrites.

Sites that require registration to comment fall back to core's "you must be logged in" message.

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

`src/` is organized by feature, not by language. Each feature owns its PHP, its components and its styles.

```
src/
  class-comments.php    the filter, and what to boot
  comment-form/         takeover, mount, nonce, textarea, submit
  identity/             who is commenting, and avatars for who already did
  shared/               signals, and the PHP-to-JS settings shape
```

## Where it loads from

Two places check the filter, so one switch covers every environment:

| Environment | Loader | What stands down |
| --- | --- | --- |
| Self-hosted, Atomic | `plugins/jetpack`, in the Comments module | `Jetpack_Comments`, and its iframe to `jetpack.wordpress.com` |
| Simple | `packages/jetpack-mu-wpcom`, in `load_verbum_comments()` | `Verbum_Comments` |

The Comments module still has to be active on the Jetpack plugin side. Its settings screen is left in place either way, so the greeting and color scheme it sets have no effect here.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Jetpack Comments is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
