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
- Sign in with WordPress.com, Google or Facebook, through a popup rather than an iframe. See "The checkpoint" below.
- Name, email and website for logged-out readers, honoring `require_name_email` and the comment cookies opt-in. These use core's own field names.
- An identity line and a log-out link for readers logged in to the site itself.
- Reply threading, by watching the `comment_parent` input WordPress rewrites.

Sites that require registration take a popup sign-in as registration. Where no sign-in is available (a site with no blog token) they get a log-in prompt in place of the guest fields, and the submit button held disabled.

## The checkpoint

The popup opens `https://public-api.wordpress.com/connect/?comment_identity=1` with the blog id, provider, a 32-byte challenge, the site's origin, a nine-minute expiry (WordPress.com allows ten, the spare minute absorbs clock skew) and an HMAC-SHA256 signature over those five, keyed with the blog token secret. On Simple there is no blog token, and the code is already inside WordPress.com, so the Consulate signs with its own key. A click after the expiry fetches a fresh URL from `wpcom/v2/comments/identity/connect` before opening. That route goes through the WPCOM REST API v2 loader, so it is same-origin on self-hosted and Atomic and served by `public-api.wordpress.com/wpcom/v2/sites/{id}/…` on Simple.

The popup posts back `{ type: 'jetpack-comment-identity', code, name, avatar, challenge }`, or an error, and only a message from `https://public-api.wordpress.com` carrying the current challenge is read. The form shows the name and avatar and carries the code in a hidden field. When the comment posts, the site redeems the code server-side over `wpcom/v2/sites/{blog_id}/comments/identity/exchange`, fills the author and email from the answer, and treats the commenter as registered. Codes are single use and good for an hour.

A successful exchange also sets two first-party cookies with the same expiry. `jetpack_comment_identity` is the passport: httponly, signed with the site's auth salt over the blog id too, so it is refused on any other site of a network, carrying the id, provider, name, email and avatar, and read only by the server when a comment posts. `jetpack_comment_identity_display` carries provider, name and avatar for the page's script to draw the signed-in row from. It has to be a cookie: the HTML is page-cached and served to everyone, so nothing about the visitor can be rendered into it, which is also why the signed popup URLs in the page are shared until they expire.

A returning commenter is admitted on the passport alone for as long as it lasts, up to 30 days, without going back to WordPress.com. The form says so with a hidden `jetpack_comment_identity_passport` field, and the server reads the passport only when that field is posted, so a log-out that never reached the server still leaves the reader posting as the guest the form showed them as. That is deliberate: consent for this site was given on the connect page, and the exchange already returned everything the comment needs. "Log out" posts the `jetpack_comments_identity_logout` admin-ajax action, which takes both cookies back. That is admin-ajax rather than REST because only the site's own host can clear its first-party cookie, and on Simple that host serves no REST API. A spent or expired code clears them and asks the reader to sign in again.

## Not here yet

**Subscriptions.** The "email me new comments" and "email me new posts" options, and the modal after submitting. Jetpack Subscriptions adds its checkboxes through `comment_form_submit_field`, which this form replaces wholesale, so they are dropped while the filter is on. On Simple the older `subscription_comment_form` output is removed for the same reason, so that no host shows a subscribe option rather than one showing it and another not.

## What it stores

A comment's author, email and URL go in the comment row, written by core. A
comment left through the checkpoint also gets three meta keys, written from the
exchange answer and never from the request: `jetpack_comment_identity_id`, the
opaque per-site id WordPress.com derives for the person; `jetpack_comment_identity_provider`;
and `jetpack_comment_identity_avatar`, served through the image CDN at display time.

Guests and users logged in to the site itself get no meta at all, because both
are derivable from what core already keeps.

The experience this replaces wrote `hc_post_as`, `hc_foreign_user_id`,
`hc_avatar` and `hc_wpcom_id_sig`. Nothing here writes those, but `hc_avatar` is
still read for comments that already carry one, with the host check it always had.

The rule to apply when adding a key: **store a field in the same change that adds
something which reads it.**

## Layout

`src/` is organized by feature, not by language. Each feature owns its PHP, its components and its styles. A directory means several files collaborate; one class stays one file.

```
src/
  class-comments.php    the filter, and what to boot
  class-avatars.php     avatars on comments already written
  form/                 takeover, mount, nonce, layout, the text box, submit
  identity/             who is commenting: guest fields, log-in prompt, attribution
    checkpoint/         the popup sign-in, the exchange, the passport cookie, its REST routes
  ui/                   widgets shared across the form
  shared/               signals, and the PHP-to-JS settings shape
```

Sections appear when there is something to put in them. Subscriptions, a block
editor and submission handling each earn a directory once they exist, and a REST
route belongs to the feature it serves rather than to a folder of endpoints.

The comment meta this writes is on Jetpack Sync's comment meta whitelist, so it
reaches WordPress.com from Jetpack and Atomic sites the way `hc_avatar` does.

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
