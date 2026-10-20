=== Jetpack Send ===
Contributors: automattic
Tags: email, smtp, transactional email, deliverability, jetpack
Requires at least: 7.0
Requires PHP: 7.4
Tested up to: 7.1
Stable tag: 0.1.0-alpha
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Reliable delivery for the emails your site sends.

== Description ==

Jetpack Send delivers the emails WordPress sends, like password resets, order receipts, and form notifications, so they reach the inbox. It walks you through the DNS records your domain needs and falls back to your host's mail if delivery fails.

Its log shows each email, why one didn't go out and what to do next. You can search and filter it, and resend an email to the same people, to yourself, or to someone else. A dashboard shows how many emails your site sent, for any range from the last 24 hours to the last year.

= Third-party services =

Jetpack Send sends the content and recipient addresses of the emails it delivers to MailChannels ([website](https://www.mailchannels.com/), [terms](https://www.mailchannels.com/terms/), [privacy policy](https://www.mailchannels.com/privacy-policy/)). It also connects to WordPress.com to set up the sending account for your site ([terms](https://wordpress.com/tos/), [privacy policy](https://automattic.com/privacy/)).

== Installation ==

1. Install the plugin through the WordPress plugins screen.
2. Activate the plugin.
3. Go to Jetpack → Send and follow the setup steps.

== Frequently Asked Questions ==

= Which emails does Jetpack Send hand back to default mail? =

Emails with inline embedded images, a character set other than UTF-8, a multipart body with a custom boundary, or only Cc or Bcc recipients are sent with your host's default mail, even if backup mail is turned off.

= What does the email log keep, and for how long? =

For each email, the log keeps who it was from and to, the subject, the content, whether it went out, and why not if it didn't. It's stored in your site's database, so you can preview and resend emails. Sign-in links, such as password reset links, are removed from the copy it keeps, so those emails can't be resent. Emails with attachments can't be resent either.

You choose how long emails stay in Settings: 1 day, 1 week, 1 month, 3 months, 6 months, 1 year, or until you delete them. New sites keep them for 1 week. Choosing a shorter time deletes older emails, after asking. You can also delete emails from the log yourself. Developers can keep content out of the log with the `jetpack_send_log_email_content` filter, or set how long emails stay with `jetpack_send_log_retention_days`.

= What does the debug log record? =

The debug log is off by default. Turn it on in Settings when you need to find a problem: it records each step Jetpack Send takes, for 1 day, 1 week or 1 month, then turns itself off. Each entry is deleted that long after it was recorded, and you can clear it at any time. It never records email content, subjects, full email addresses, keys or sign-in tokens. Each entry notes which user, if any, was signed in at the time.

= What do the dashboard's numbers keep? =

The dashboard counts emails per hour by status, by type (site email, test or resend), and by the plugin that sent them. The counts hold no addresses, subjects or content. They're kept for about two years, so the dashboard still counts emails after they leave the log.

= What happens to this data when I delete the plugin? =

Deleting Jetpack Send from the Plugins screen removes the email log, the debug log, the dashboard's counts and its settings.

= Does Jetpack Send run the phpmailer_init action? =

No. Jetpack Send does not use PHPMailer for the emails it delivers, so code hooked to `phpmailer_init` does not apply to them.

= What happens if an email's From address is not on my sending domain? =

Jetpack Send replaces it with the From address you configured and keeps the original address as the Reply-To.

== Changelog ==

<!-- When you do a release, use the monorepo script tools/plugin-changelog-to-readme.sh to copy from CHANGELOG.md to here. -->
