# Newsletter Mode

Newsletter Mode is a WordPress.com-only, per-site experience. Its page and hooks
remain unavailable until the site is explicitly enrolled.

Access to the Newsletter Mode shell requires the `publish_posts` capability.

## Manual enrollment

Select the target site by site ID in the WordPress.com WP-CLI environment, then
enable the package-local option in that site's context:

```bash
wp option update wpcom_newsletter_mode_enabled 1
```

Disable the option to remove the Newsletter Mode entry point:

```bash
wp option delete wpcom_newsletter_mode_enabled
```

Defining `WPCOM_NEWSLETTER_MODE_DISABLED` as a truthy value disables the feature
even when the per-site option remains enabled.
