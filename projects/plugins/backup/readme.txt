=== Jetpack Backup ===
Contributors: automattic, bjorsch, fgiannar, jeherve, jwebbdev, kraftbj, macbre, samiff, sermitr, williamvianas
Tags: jetpack
Requires at least: 5.9
Requires PHP: 5.6
Tested up to: 6.0
Stable tag: 1.2.0
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Jetpack is the most proven WordPress backup plugin with over 270 million backups. Save each change and get back online fast with one‑click restores.

== Description ==

Jetpack Backup is a new plugin that focuses specifically on Jetpack's Backup features.

Note: To use this plugin you will need to have a paid Jetpack plan that includes Backup.

### Restoring your site has never been easier

If you make money from your site, or spend hours perfecting content, you need WordPress backups. Protect your investment by getting your site back online in seconds. Our automated WordPress backup plugin is powerful enough for pros, but easy enough for beginners.

* Easy-to-use plugin with one-click restores
* Restore from anywhere with the Jetpack mobile app
* Restore even if your site is offline
* No developer required
* Best-in-class support

### Reliability you can trust

Jetpack Backup is built on WordPress.com’s world‑class infrastructure, so you can be sure your site is safe and can be recovered at any moment. Host backups are often time‑consuming and require technical expertise to restore. You’ve got more important things to do.

* Backups of all files including WordPress database backups, theme file backups and plugin backups
* Backups of all WooCommerce customer and order data
* Redundant copies made on multiple servers
* Off-site / cloud backups so there’s no load on your server
* Global server infrastructure
* Tested to ensure no conflicts with major plugins or hosts

### Backups built for WooCommerce

Backups are essential for eCommerce stores. New orders come in at any moment, so you need a plan to keep your order and customer data safe. That’s why we designed the Jetpack Backup plugin specifically with WooCommerce in mind.

* Restore your site to any past state while keeping all orders and products current
* Protect your customer data and stay GDPR compliant
* Custom WooCommerce table backups

### A must‑have for WordPress site builders

Save hours of time developing and maintaining sites by restoring to any point. Just one change pays for itself. Real‑time backups go beyond a snapshot to give you total power and flexibility. The activity log lets you know exactly what action (and who) broke the site, so you can look like a pro for your clients.

* Full, incremental, and differential backups in real-time
* Complete list of all site changes
* Quickly restore from any point
* Be empowered to experiment with the look and feel of your site

### Expert Support

We have a global team of Happiness Engineers ready to provide incredible support. Ask your questions in the support forum or [contact us directly](https://jetpack.com/contact-support).

### Get Started

Installation is free, quick, and easy. It only takes a few minutes to install Jetpack Backup.

Note: To use this plugin you will need to have a paid Jetpack plan that includes Backup.

== Installation ==

### Automated installation

The first option is to install Jetpack Backup from within your WP Admin.

1. To begin, click on the Plugins link in the left hand sidebar, then click Add New.
2. Search for Jetpack Backup. The latest version will be in the search results. Click the Install Now button:
3. Next, click the Activate button. After activating, you will be prompted to set up Jetpack Backup.

### Manual Alternatives

Alternatively, install Jetpack Backup via the plugin directory, or upload the files manually to your server and follow the on-screen instructions.

Detailed instructions on installing Jetpack Backup can be found in our [Getting Started with the Jetpack Backup Plugin](https://jetpack.com/support/the-jetpack-backup-plugin/getting-started-with-the-jetpack-backup-plugin/) article.

== Frequently Asked Questions ==

= Why do I need backups? =

Site backups are crucial for an online business or presence. If you make a change in error, want to experiment with your site’s look & feel, or something malicious happens to your site, having backups saves time and money getting your site back online or to a previous version. With Jetpack Backup you simply click to restore to a point in the past and get on with your day.

= How do I restore my site with Jetpack Backup? =

It’s easy to restore your site in just a few clicks. Check out this quick video for more detail.

<figure class="video_container">
  <iframe src="https://youtu.be/AYbPsp4eLvc" frameborder="0" allowfullscreen="true"> </iframe>
</figure>

For more detailed assistance, check out [the full support article](https://jetpack.com/support/the-jetpack-backup-plugin/restoring-with-the-jetpack-backup-plugin/).

= Doesn’t my host already have backups? =

Most hosts have some sort of backup. But they are often infrequent and difficult to restore. If your site goes down, you need access to your backups. If they’re stored on your hosting platform (or your hard drive!), and your files are compromised, your database backup could be compromised too.

Jetpack’s off-site backup storage allows you to restore a clean version of your WordPress website even if you can’t log in. When you rely solely on your host’s built-in backups, you’re putting all your eggs in one basket. Here is [one story from a Jetpack customer](https://jetpack.com/2017/07/06/wordpress-support-hosting-mistakes/) of what can happen. Without a third-party backup that copies your files off-site, your website could be at risk. One false move by you or your host could compromise your web files or delete them entirely.

= How do I create a WordPress backup for my site? =

If you don’t have Backups as part of your Jetpack plan, [visit Jetpack.com to learn more and purchase](https://jetpack.com/upgrade/backup).

As soon as you purchase Jetpack Backup, it will be activated, and the first backup will be completed. There are barely any settings to configure, and you don’t need coding experience.

Daily backups will take place approximately 24 hours from the previous backup. They occur automatically – you don’t need to create a specific time for backups to run.

You’ll know your WordPress backup has been created if you see a **Backup complete** event in the activity log.

= Don’t see your WordPress backup in the activity log? =

If you notice that backups are not being saved yet, update your [site credentials](https://jetpack.com/support/the-jetpack-backup-plugin/adding-credentials-to-the-jetpack-backup-plugin/). Go to the [**Jetpack Cloud**](https://cloud.jetpack.com/) and click **Settings**. You should see a form that allows you to add your site credentials.

If Jetpack cannot make contact with your site and it’s not able to create backups, you’ll receive an email after two failed attempts.

= Can I use Jetpack to back up my WordPress database? =

Yes, the Jetpack Backup plugin backs up your WordPress database. Specifically, any tables that begin with your WordPress table prefix and also have a unique key or primary key. For more details, visit [the support page](https://jetpack.com/support/the-jetpack-backup-plugin/).

= Can I use Jetpack to back up my files? =

Yes, the Jetpack Backup plugin backs up your WordPress database. This includes all files in the *plugins*, *mu-plugins*, *themes*, and *uploads* directories. For more details, visit [the support page](https://jetpack.com/support/the-jetpack-backup-plugin/).

= Can I use Jetpack to back up my site without plugins? =

Yes. We will exclude any directory containing a file named *.donotbackup*. If need be, you can create these files yourself to intentionally prevent certain directories from being backed up. If a directory named *donotbackup* is added, we will also exclude all files inside that directory. For more details, visit [the support page](https://jetpack.com/support/the-jetpack-backup-plugin/).

= Can Jetpack Backup save files to Google Drive or Dropbox? =

Jetpack Backup doesn’t support saving files directly onto Google Drive or Dropbox. We provide free storage on our servers, saved redundantly in multiple locations around the globe. If you’d like to retain a copy, you can download your backup and upload it to any third-party site.

= Can I download my backups? =

Yes. To download your backup, open your [activity log](https://jetpack.com/support/the-jetpack-backup-plugin/activity-log-in-the-jetpack-backup-plugin/). Use the filters to find the event or backup that you’d like to use, then click **Actions**, and choose **Download backup**. For more details, visit [the support page](https://jetpack.com/support/restoring-with-jetpack-backup/).

= Does Jetpack Backup support WordPress multisite? =

No, Jetpack Backup does not currently support WordPress multisite.

= Does Jetpack Backup support split site or split home URLs? =

No, Jetpack Backup does not currently support split site or split home URLs.

= Need help? =

* [Getting started](https://jetpack.com/support/the-jetpack-backup-plugin/getting-started-with-the-jetpack-backup-plugin/)
* [Using the Activity Log](https://jetpack.com/support/the-jetpack-backup-plugin/activity-log-in-the-jetpack-backup-plugin/)
* [Scope of support](https://jetpack.com/support/scope-of-support/)

== Screenshots ==

1. Save every change with real-time backups and get back online quickly with one-click restores.
2. Your site backups are stored in multiple locations on our world-class cloud infrastructure so you can recover them at any moment.

== Changelog ==
### 1.4.1 - 2022-09-08
#### Added
- Include JITMs from My Jetpack

#### Changed
- Plugin activation: Only redirect when activating from the Plugins page in the browser
- Updated package dependencies. [#25713] [#24929] [#24998] [#25048] [#25158] [#25279] [#25315] [#25406]

--------

[See the previous changelogs here](https://github.com/Automattic/jetpack/blob/trunk/projects/plugins/backup/CHANGELOG.md#changelog)
