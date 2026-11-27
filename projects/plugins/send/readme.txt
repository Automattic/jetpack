=== Jetpack Send ===
Contributors: automattic
Tags: email, smtp, transactional email, deliverability, jetpack
Requires at least: 7.0
Requires PHP: 7.4
Tested up to: 7.1
Stable tag: 0.1.0-alpha
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Reliable delivery for the emails your site sends, powered by MailChannels.

== Description ==

Jetpack Send routes the emails WordPress sends, like password resets, order receipts, and form notifications, through MailChannels so they reach the inbox. It walks you through the DNS records your domain needs, falls back to your host's mail if delivery fails, and keeps a 30-day log of what was sent.

= Third-party services =

Jetpack Send sends the content and recipient addresses of the emails it delivers to MailChannels ([website](https://www.mailchannels.com/), [terms](https://www.mailchannels.com/terms/), [privacy policy](https://www.mailchannels.com/privacy-policy/)). It also connects to WordPress.com to set up the sending account for your site ([terms](https://wordpress.com/tos/), [privacy policy](https://automattic.com/privacy/)).

== Installation ==

1. Install the plugin through the WordPress plugins screen.
2. Activate the plugin.
3. Go to Jetpack → Send and follow the setup steps.

== Frequently Asked Questions ==

= Which emails does Jetpack Send hand back to default mail? =

Emails with inline embedded images, a character set other than UTF-8, a multipart body with a custom boundary, or only Cc or Bcc recipients are sent with your host's default mail, even if the fallback setting is off.

= Does the email log keep the content of my emails? =

Yes. So you can preview each email, the log keeps its content in your site's database for 30 days, including links such as password resets. Developers can turn this off with the `jetpack_send_log_email_content` filter.

= Does Jetpack Send run the phpmailer_init action? =

No. Jetpack Send does not use PHPMailer for the emails it delivers, so code hooked to `phpmailer_init` does not apply to them.

= What happens if an email's From address is not on my sending domain? =

Jetpack Send replaces it with the From address you configured and keeps the original address as the Reply-To.

== Changelog ==

<!-- When you do a release, use the monorepo script tools/plugin-changelog-to-readme.sh to copy from CHANGELOG.md to here. -->
