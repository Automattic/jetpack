=== WP Super Cache ===
Contributors: donncha, automattic
Tags: performance,caching,wp-cache,wp-super-cache,cache
Tested up to: 3.0.4
Stable tag: 0.9.9.8
Requires at least: 2.9.2

A very fast caching engine for WordPress that produces static html files.

== Description ==
This plugin generates static html files from your dynamic WordPress blog.  After a html file is generated your webserver will serve that file instead of processing the comparatively heavier and more expensive WordPress PHP scripts.

The static html files will be served to the vast majority of your users, but because a user's details are displayed in the comment form after they leave a comment those requests are handled by the legacy caching engine. Static files are served to:

1. Users who are not logged in.
2. Users who have not left a comment on your blog.
3. Or users who have not viewed a password protected post.

99% of your visitors will be served static html files. Those users who don't see the static files will still benefit because they will see different cached files that aren't quite as efficient but still better than uncached. This plugin will help your server cope with a front page appearance on digg.com or other social networking site.

If for some reason "supercaching" doesn't work on your server then don't worry. Caching will still be performed, but every request will require loading the PHP engine. In normal circumstances this isn't bad at all. Visitors to your site will notice no slowdown or difference. Supercache really comes into it's own if your server is underpowered, or you're experiencing heavy traffic.
Super Cached html files will be served more quickly than PHP generated cached files but in every day use, the difference isn't noticeable.

The plugin serves cached files in 3 ways (ranked by speed):

1. Mod_Rewrite. The fastest method is by using Apache mod_rewrite (or whatever similar module your web server supports) to serve "supercached" static html files. This completely bypasses PHP and is extremely quick. If your server is hit by a deluge of traffic it is more likely to cope as the requests are "lighter". This does require the Apache mod_rewrite module (which is probably installed if you have custom permalinks) and a modification of your .htaccess file. Visits by anonymous or unknown users will be served this way.
2. PHP. Supercached static files can now be served by PHP. The plugin will serve a "supercached" file if it exists and it's almost as fast as the mod_rewrite method. It's easier to configure as the .htaccess file doesn't need to be changed. You still need a custom permalink. You can keep portions of your page dynamic in this caching mode. Your server may not cope as well with a really large amount of traffic. (You're gaming Digg aren't you? You'll need mod_rewrite, the rest of us are ok with PHP!)
3. Legacy caching. This is mainly used to cache pages for known users. These are logged in users, visitors who leave comments or those who should be shown custom per-user data. It's the most flexible caching method but also the slowest. As each page is different it's often better not to cache pages for these users at all and avoid legacy caching. Legacy caching will also cache visits by unknown users if this caching mode is selected. You can have dynamic parts to your page in this mode too.

If you're new to caching use PHP caching. It's easy to set up and very fast. Avoid legacy caching if you can.

= Recommended Settings =
Advanced users will probably want to use mod_rewrite caching, but PHP caching is almost as good and recommended for everyone else. Enable the following:

1. PHP caching.
2. Compress pages.
3. Don't cache pages for known users.
4. Cache rebuild.
5. CDN support.
6. Extra homepage checks.

Garbage collection is the act of cleaning up cache files that are out of date and stale. There's no correct value for the expiry time but a good starting point is 1800 seconds if you're not using legacy mode. If you are using that mode start with an expiry time of 600 seconds.

If you are not using legacy mode caching consider deleting the contents of the "Rejected User Agents" text box and allow search engines to create supercache static files.

Likewise, preload as many posts as you can and enable "Preload Mode". Garbage collection will still occur but it won't affect the preloaded files. If you don't care about sidebar widgets updating often set the preload interval to 2880 minutes (2 days) so all your posts aren't recached very often. When the preload occurs the cache files for the post being refreshed is deleted and then regenerated. Afterwards a garbage collection of all old files is performed to clean out stale cache files.
With preloading on cached files will still be deleted when posts are made or edited or comments made.

See the [WP Super Cache homepage](http://ocaoimh.ie/wp-super-cache/) for further information. [Developer documentation](http://ocaoimh.ie/wp-super-cache-developers/) is also available for those who need to interact with the cache or write plugins.

The [changelog](http://svn.wp-plugins.org/wp-super-cache/trunk/Changelog.txt) is a good place to start if you want to know what has changed since you last downloaded the plugin.

Interested in translating WP Super Cache to your language? Grab the [development version](http://downloads.wordpress.org/plugin/wp-super-cache.zip) where you will find an up to date wp-super-cache.pot. Send any translation files to donncha @ ocaoimh.ie and thank you!

== Upgrade Notice ==

= 0.9.9.8 =
CDN code can be switched off, better uninstall process, compress dynamic pages, 1and1 webhosting fix, use Supercache files for dynamic pages

== Changelog ==

= 0.9.9.8 =
* CDN updates: can be switched off, multiple CNAMEs.
* Uninstall process improved. It removes generated files and fixes edited files.
* Cached dynamic pages can now be stored in Supercache files and compressed.
* 1and1 Webhosting fix (/kunden/)
* Remove log by email functionality as it caused problems for users who were inundated by email
* Many more minor fixes and changes.

= 0.9.9.6 =
* Fixed problem serving cached files with PHP
* Added support for 304 "file not modified" header to help browser caching. (PHP caching only)
* Added French & German translations, updated Italian translation and fixed translation strings.
* Sleep 4 seconds between preload urls to reduce load on the server
* Updated docs and FAQs.

= 0.9.9.5 =
* Disable compression on on easy setup page. Still causes problems on some hosts.
* Remove footerlink on easy setup page.
* Don't delete mod_rewrite rules when caching is disabled.
* Don't stop users using settings page when in safe mode.

= 0.9.9.4 =
* Settings page split into tabbed pages.
* Added new "Easy" settings page for new users.
* New PHP caching mode to serve supercached files.
* Mobile support fixes.
* Added Domain mapping support plugin.
* Added "awaiting moderation" plugin that removes that text from posts.
* Terminology change. Changed "half on" to "legacy caching".
* Fixed cache tester on some installs of WordPress.
* Updated documentation
* Added $wp_super_cache_lock_down config variable to hide lockdown and directly cached pages admin items.
* Preloaded checks if it has stalled and reschedules the job to continue.
* Serve the gzipped page when first cached if the client supports compression.
* Lots more bug fixes..

= 0.9.9.3 =
* Fixed division by zero error in half on mode.
* Always show "delete cache" button.
* Fixed "Update mod_rewrite rules" button.
* Minor text changes to admin page.

= 0.9.9.2 =
* Forgot to change version number in wp-cache.php

= 0.9.9.1 =
* Added preloading of static cache.
* Better mobile plugin support
* .htaccess rules can be updated now. Added wpsc_update_htaccess().
* Fixed "page on front" cache clearing bug.
* Check for wordpress_logged_in cookie so test cookie isn't detected.
* Added clear_post_supercache() to clear supercache for a single post.
* Put quotes around rewrite rules in case paths have spaces.

= 0.9.9 =
* Added experimental object cache support.
* Added Chinese(Traditional) translation by Pseric.
* Added FAQ on WP-Cache vs Supercache files.
* Use Supercache file if WP-Cache file not found. Useful if mod_rewrite rules are broken or not working.
* Get mobile browser list from WP Mobile Edition if found. Warn user if .htaccess out of date.
* Make sure writer lock is unlocked after writing cache files.
* Added link to developer docs in readme.
* Added Ukranian translation by Vitaly Mylo.
* Added Upgrade Notice section to readme.
* Warn if zlib compression in PHP is enabled.
* Added compression troubleshooting answer. Props Vladimir (http://blog.sjinks.pro/)
* Added Japanese translation by Tai (http://tekapo.com/)
* Updated Italian translation.
* Link to WP Mobile Edition from admin page for mobile support.

= 0.9.8 =
* Added Spanish translation by Omi.
* Added Italian translation by Gianni Diurno.
* Addded advanced debug code to check front page for category problem. Enable by setting $wp_super_cache_advanced_debug to 1 in the config file.
* Fixed wordpress vs wordpress_logged_in cookie mismatch in cookie checking function.
* Correctly check if WP_CACHE is set or not. PHP is weird.
* Added wp_cache_clear_cache() to clear out cache directory.
* Only show logged in message when debugging enabled.
* Added troubleshooting point 20. PHP vs Apache user.
* Fixed problem deleting cache file.
* Don't delete cache files when moderated comments are deleted.


= 0.9.7 =
* Fixed problem with blogs in folders.
* Added cache file listing and delete links to admin page.
* Added "Newest Cached Pages" listing in sidebox.
* Made admin page translatable. 
* Added "How do I make certain parts of the page stay dynamic?" to FAQ.
* Advanced: added "late init" feature so that plugin activates on "init". Set $wp_super_cache_late_init to true in config file to use.
* Disable supercaching when GET parameters present instead of disabling all caching. Disable on POST (as normal) and preview.
* Fixed problem with cron job and mutex filename.
* Warn users they must enable mobile device support if rewrite rules detected. Better detection of when to warn that .htaccess rules must be updated (no need when rewrite rules not present)
* Advanced: Added "wpsupercache_404" filter. Return true to cache 404 error pages.
* Use the wordpress_test_cookie in the cache key.
* Show correct number of cache files when compression off.
* Fixed problem with PHP safe_mode detection.
* Various bugfixes and documentation updates. See Changelog.txt

= 0.9.6.1 =
* Move "not logged in" message init below check for POST.
* Add is_admin() check so plugin definitely can't cache the backend.
* Add "do not cache" page type to admin page.

= 0.9.6 =
* Add uninstall.php uninstall script.
* Updated cache/.htaccess rules (option to upgrade that)
* Added FAQ about category and static homepage problem.
* Add wp_cache_user_agent_is_rejected() back to wp-cache-phase2.php 
* Show message for logged in users when caching disable for them.
* Check filemtime on correct supercache file

= 0.9.5 =
* Show next and last GC times in minutes, not local time.
* Don't serve wp_cache cache files to rejected user agents. Supercache files are still served to them.
* If enabled, mobile support now serves php cached files to mobile clients and static cached files to everyone else.
* Added checks for "WPSC_DISABLE_COMPRESSION" and "WPSC_DISABLE_LOCKING" constants to disable compression and file locking. For hosting companies primarily.
* Added check for DONOTCACHEPAGE constant to avoid caching a page.
* Use PHP_DOCUMENT_ROOT when creating .htaccess if necessary.

= 0.9.4.3 =
1. Added "Don't cache for logged in users" option.
2. Display file size stats on admin page.
3. Clear the cache when profile page is updated.
4. Don't cache post previews.
5. Added backslashes to rejected URI regex list.
6. Fixed problems with posts and comments not refreshing.

== Installation ==
1. You should have the Apache mod mime and mod rewrite modules installed and WordPress custom permalinks (Settings->Permalinks) enabled. PHP safe mode should be disabled. If any of those are missing or off you can still use PHP or legacy caching.
2. If you have WP-Cache installed already, please disable it. Edit wp-config.php and make sure the WP_CACHE define is deleted, and remove the files wp-content/wp-cache-config.php and wp-content/advanced-cache.php. These will be recreated when you install this plugin.
3. Upload this directory to your plugins directory. It will create a 'wp-content/plugins/wp-super-cache/' directory.
4. If you are using WordPress MU or WordPress Multisite you can install the plugin in the ordinary plugins folder and activate it "network wide".
5. WordPress users should go to their Plugins page and activate "WP Super Cache".
6. Now go to Settings->WP Super Cache and enable caching. If you see an error message or a blank screen see the "FAQ" section later in this readme for instructions.
7. If you choose "Mod Rewrite caching", mod_rewrite rules will be inserted into your .htaccess file. Look in your web root directory for this file. It should look similar to this:

	`-----------------.htaccess-----------------`
	`RewriteEngine On`
	`RewriteBase /`
	
	`RewriteCond %{REQUEST_METHOD} !=POST`
	`RewriteCond %{QUERY_STRING} !.*=.*`
	`RewriteCond %{HTTP_COOKIE} !^.*(comment_author_|wordpress|wp-postpass_).*$`
	`RewriteCond %{HTTP:Accept-Encoding} gzip`
	`RewriteCond %{HTTP_USER_AGENT} !^.*(2.0\ MMP|240x320|400X240|AvantGo|BlackBerry|Blazer|Cellphone|Danger|DoCoMo|Elaine/3.0|EudoraWeb|Googlebot-Mobile|hiptop|IEMobile|KYOCERA/WX310K|LG/U990|MIDP-2.|MMEF20|MOT-V|NetFront|Newt|Nintendo\ Wii|Nitro|Nokia|Opera\ Mini|Palm|PlayStation\ Portable|portalmmm|Proxinet|ProxiNet|SHARP-TQ-GX10|SHG-i900|Small|SonyEricsson|Symbian\ OS|SymbianOS|TS21i-10|UP.Browser|UP.Link|webOS|Windows\ CE|WinWAP|YahooSeeker/M1A1-R2D2|iPhone|iPod|Android|BlackBerry9530|LG-TU915\ Obigo|LGE\ VX|webOS|Nokia5800).*`
	`RewriteCond %{DOCUMENT_ROOT}/wp-content/cache/supercache/%{HTTP_HOST}/$1/index.html.gz -f`
	`RewriteRule ^(.*) /wp-content/cache/supercache/%{HTTP_HOST}/$1/index.html.gz [L]`
	
	`RewriteCond %{REQUEST_METHOD} !=POST`
	`RewriteCond %{QUERY_STRING} !.*=.*`
	`RewriteCond %{QUERY_STRING} !.*attachment_id=.*`
	`RewriteCond %{HTTP_COOKIE} !^.*(comment_author_|wordpress|wp-postpass_).*$`
	`RewriteCond %{HTTP_USER_AGENT} !^.*(2.0\ MMP|240x320|400X240|AvantGo|BlackBerry|Blazer|Cellphone|Danger|DoCoMo|Elaine/3.0|EudoraWeb|Googlebot-Mobile|hiptop|IEMobile|KYOCERA/WX310K|LG/U990|MIDP-2.|MMEF20|MOT-V|NetFront|Newt|Nintendo\ Wii|Nitro|Nokia|Opera\ Mini|Palm|PlayStation\ Portable|portalmmm|Proxinet|ProxiNet|SHARP-TQ-GX10|SHG-i900|Small|SonyEricsson|Symbian\ OS|SymbianOS|TS21i-10|UP.Browser|UP.Link|webOS|Windows\ CE|WinWAP|YahooSeeker/M1A1-R2D2|iPhone|iPod|Android|BlackBerry9530|LG-TU915\ Obigo|LGE\ VX|webOS|Nokia5800).*`
	`RewriteCond %{DOCUMENT_ROOT}/wp-content/cache/supercache/%{HTTP_HOST}/$1/index.html -f`
	`RewriteRule ^(.*) /wp-content/cache/supercache/%{HTTP_HOST}/$1/index.html [L]`
	
	`RewriteCond %{REQUEST_FILENAME} !-f`
	`RewriteCond %{REQUEST_FILENAME} !-d`
	`RewriteRule . /index.php [L]`
	`-----------------.htaccess-----------------`
8. After you have enabled the plugin, look for the file "wp-content/cache/.htaccess". If it's not there you must create it. It should read:

	`# BEGIN supercache`
	`<IfModule mod_mime.c>`
	`  <FilesMatch "\.html\.gz$">`
	`    ForceType text/html`
	`    FileETag None`
	`  </FilesMatch>`
	`  AddEncoding gzip .gz`
	`  AddType text/html .gz`
	`</IfModule>`
	`<IfModule mod_deflate.c>`
	`  SetEnvIfNoCase Request_URI \.gz$ no-gzip`
	`</IfModule>`
	`<IfModule mod_headers.c>`
	`  Header set Cache-Control 'max-age=300, must-revalidate'`
	`</IfModule>`
	`<IfModule mod_expires.c>`
	`  ExpiresActive On`
	`  ExpiresByType text/html A300`
	`</IfModule>`
	``
	`# END supercache`
9. Apache must be configured to allow the modules above. If you receive a "500 internal error" when serving requests to anonymous users you need to dig into your Apache configuration. This configuration in my virtual host works for me:

	`<Directory /home/www/>`
	`AllowOverride All`
	`</Directory>`
10. wp-content/advanced-cache.php loads the caching engine. This file is generated by the plugin. Make sure the path in the include_once() is correct.

== How to uninstall WP Super Cache ==

Almost all you have to do is deactivate the plugin on the plugins page. The plugin should clean up most of the files it created and modified, but it doesn't as yet remove the mod_rewrite rules from the .htaccess file. Look for the section in that file marked by SuperCache BEGIN and END tags. The plugin doesn't remove those because some people add the WordPress rules in that block too.

To manually uninstall:

1. Turn off caching on the plugin settings page and clear the cache.
2. Deactivate the plugin on the plugins page.
3. Remove the WP_CACHE define from wp-config.php. It looks like `define( 'WP_CACHE', true );`
4. Remove the Super Cache mod_rewrite rules from your .htaccess file.
5. Remove the files wp-content/advanced-cache.php and wp-content/wp-cache-config.php
6. Remove the directory wp-content/cache/
7. Remove the directory wp-super-cache from your plugins directory.

== If all else fails and your site is broken ==
1. Remove the WP_CACHE define from wp-config.php. It looks like `define( 'WP_CACHE', true );`
2. Remove the rules (see above) that the plugin wrote to the .htaccess file in your root directory.
3. Delete the wp-super-cache folder in the plugins folder.
4. Optionally delete advanced-cache.php, wp-cache-config.php and the cache folder in wp-content/.

== Frequently Asked Questions ==

= How do I know my blog is being cached? =

Enable debugging in the plugin settings page and load the log file in a new browser tab. Then view your blog while logged in and logged out. You should see activity in the log. View the source of any page on your site. When a page is first created, you'll see the text "Dynamic page generated in XXXX seconds." and "Cached page generated by WP-Super-Cache on YYYY-MM-DD HH:MM:SS" at the end of the source code. On reload, a cached page will show the same timestamp so wait a few seconds before checking. 
In legacy caching mode, if you have compression enabled, the text "Compression = gzip" will be added. If compression is disabled and the page is served as a static html file, the text "super cache" will be added. The only other way to check if your cached file was served by PHP script or from the static cache is by looking at the HTTP headers. PHP cached pages will have the header "WP-Super-Cache: Served supercache file from PHP". Legacy cached files will have the header, "WP-Super-Cache: Served legacy cache file". I used the <a href="https://addons.mozilla.org/en-US/firefox/addon/3829">Live HTTP Headers</a> extension for Firefox to examine the headers. You should also check your cache directory in wp-content/cache/supercache/hostname/ for static cache files.
If the plugin rules are missing from your .htaccess file, the plugin will attempt to serve the super cached page if it's found. The header "WP-Super-Cache: Served supercache file from PHP" if this happens.

= WP-Cache vs Supercache files =

WP-Cache files are stored in wp-content/cache/ (or on MU sites in a blogs sub directory) and are named wp-cache-XXXXXXXXXXXXXXXXX.html. Associated meta files are stored in a meta sub directory. Those files contain information about the cached file. These files are generated by the "legacy caching" code in the plugin.
Supercache files are stored in wp-content/cache/supercache/HOSTNAME/ where HOSTNAME is your domain name. The files are stored in directories matching your site's permalink structure.

= Why is WP-Super-Cache better than WP-Cache? =

This plugin is based on the excellent WP-Cache plugin. Besides the caching WP-Cache did this plugin creates copies of every page that is accessed on a blog in a form that is quickly served by the web server. It's almost as quick as if the you had saved a html page in your browser and uploaded it to replace your homepage.

= Will comments and other dynamic parts of my blog update immediately? =

Comments will show as soon as they are moderated, depending on the comment policy of the blog owner. Other dynamic elements on a page may not update unless they are written in Javascript, Flash, Java or another client side browser language. The plugin really produces static html pages. No PHP is executed when those pages are served. "Popularity Contest" is one such plugin that will not work. 

= Will the Super Cache compression slow down my server? =

No, it will do the opposite. Super Cache files are compressed and stored that way so the heavy compression is done only once. These files are generally much smaller and are sent to a visitor's browser much more quickly than uncompressed html. As a result, your server spends less time talking over the network which saves CPU time and bandwidth, and can also serve the next request much more quickly.

= How do I make certain parts of the page stay dynamic? =

There are 2 ways of doing this. You can use Javascript to draw the part of the page you want to keep dynamic. That's what Google Adsense and many widgets from external sites do. Or you can use a WP Super Cache tag to do the job but you can't use mod_rewrite mode caching. You have to switch to PHP or legacy caching.

There are a few ways to do this, you can have functions that stay dynamic or you can include other files on every page load. To execute PHP code on every page load you can use either the "dynamic-cached-content", "mfunc", or "mclude" tags. The "dynamic-cached-content" tag is easier to use but the other tags can still be used. Make sure you duplicate the PHP code when using these tags. The first code is executed when the page is cached, while the second chunk of code is executed when the cached page is served to the next visitor.
To execute WordPress functions you must define $wp_super_cache_late_init in your config file.

= dynamic-cached-content example =

This code will include the file adverts.php and will execute the functions "print_sidebar_ad()" and "do_more_stuff()". Make sure there's no space before or after the PHP tags.

`<!--dynamic-cached-content--><?php
include_once( ABSPATH . '/scripts/adverts.php' );
print_sidebar_ad();
do_more_stuff();
?><!--
include_once( ABSPATH . '/scripts/adverts.php' );
print_sidebar_ad();
do_more_stuff();
--><!--/dynamic-cached-content-->`

= mfunc example =

To execute the function "function_name()":

`<!--mfunc function_name( 'parameter', 'another_parameter' ) -->
<?php function_name( 'parameter', 'another_parameter' ) ?>
<!--/mfunc-->`

= mclude example =
To include another file:

`<!--mclude file.php-->
<?php include_once( ABSPATH . 'file.php' ); ?>
<!--/mclude-->`

That will include file.php under the ABSPATH directory, which is the same as where your wp-config.php file is located.

Example:
`<!--mfunc date( 'Y-m-d H:i:s' ) -->
<?php date( 'Y-m-d H:i:s' ) ?>
<!--/mfunc-->`

= How do I use WordPress functions in cached dynamic pages? =

See the next qestion, you have to load WordPress before the cached file is served.

= How do I delay serving the cache until the "init" action fires? =

Cached files are served before almost all of WordPress is loaded. While that's great for performance it's a pain when you want to extend the plugin using a core part of WordPress. Set $wp_super_cache_late_init to "1" in wp-content/wp-cache-config.php and cached files will be served when "init" fires. WordPress and it's plugins will be loaded now. This is very useful when you are using the mfunc tag in your theme.

= Why don't WP UserOnline, Popularity Contest, WP Postratings or plugin X not work or update on my blog now? =

This plugin caches entire pages but some plugins think they can run PHP code every time a page loads. To fix this, the plugin needs to use Javascript/AJAX methods or the dynamic-cached-content/mfunc/mclude code described in the previous answer to update or display dynamic information.

= Why doesn't the plugin cache requests by search engine bots by default? =

Those bots usually only visit each page once and if the page is not popular there's no point creating a cache file that will sit idle on your server. However if you're not using legacy caching you can allow these visits to be cached by removing the list of bots from "Rejected User Agents" on the Advanced settings page.

= A category page is showing instead of my homepage =

A tiny proportion of websites will have problems with the following configuration:

1. Uses a static page for the front page.
2. Uses /%category%/%postname%/ permalink structure.

Sometimes a category page is cached as the homepage of the site instead of the static page. I can't [replicate the problem](http://wordpress.org/support/topic/237415/page/2?replies=38) but a simple solution is to switch the plugin to PHP mode. For normal traffic you will see no difference in the speed of your site. You can also enable "Extra homepage checks" on the Advanced Settings page.

= Why do I get warnings about caching from http://ismyblogworking.com/ =

"Your blog doesn't support client caching (no 304 response to If-modified-since)."
"Your feed doesn't support caching (no 304 response to If-modified-since)"

Supercache doesn't support 304 header checks in mod_rewrite mode but does support it in PHP mode. This is caching done by your browser, not the server. It is a check your browser does to ask the server if an updated version of the current page is available. If not, it doesn't download the old version again. The page is still cached by your server, just not by your visitors' browsers.
Try the Cacheability Engine at http://www.ircache.net/cgi-bin/cacheability.py or http://redbot.org/ for further analysis.

= How should I best use the utm_source tracking tools in Google Analytics with this plugin? =

That tracking adds a query string to each url linked from various sources like Twitter and feedreaders. Unfortunately it stops pages being supercached. See [Joost's comment here](http://ocaoimh.ie/remove-unused-utmsource-urls/#comment-672813) for how to turn it into an anchor tag which can be supercached.

= The plugin complains that wp-content is writable! htdocs is writable! =

It's not good when the web server can write to these directories but sometimes shared hosting accounts are set up in this way to make administration easier. Use `chmod 755 directory` to fix the permissions or find the permissions section of your ftp client. This [Google search](http://www.google.ie/search?sourceid=chrome&ie=UTF-8&q=ftp+fix+directory+permissions+755) will lead you to more information on this topic. Unfortunately some hosts require that those directories be writable. If that's the case just ignore this warning.

= How do I delete the WP_CACHE define from wp-config.php? =

Load your desktop ftp client and connect to your site. Navigate to the root (or the directory below it) of your site where you'll find wp-config.php. Download that file and edit it in a text editor. Delete the line `define( 'WP_CACHE', true );` and save the file. Now upload it, overwriting the wp-config.php on your server.

= How do I delete the Super Cache rules from the .htaccess file? =

Load your desktop ftp client and connect to your site. You may need to enable "Show hidden files" in the preferences of the ftp client. Navigate to the root of your site where you'll find the .htaccess file. Download that file and edit it in a text editor. Delete the lines between "# BEGIN WPSuperCache" and "# END WPSuperCache" and save the file. Now upload it, overwriting the .htaccess file on your server.

= Troubleshooting =

If things don't work when you installed the plugin here are a few things to check:

1.  Is wp-content writable by the web server?
2.  Is there a wp-content/wp-cache-config.php ? If not, copy the file wp-super-cache/wp-cache-config-sample.php to wp-content/wp-cache-config.php and make sure WPCACHEHOME points at the right place.
3.  Is there a wp-content/advanced-cache.php ? If not, then you must copy wp-super-cache/advanced-cache.php into wp-content/. You must edit the file and change the path so it points at the wp-super-cache folder.
4.  If pages are not cached at all, remove wp-content/advanced-cache.php and recreate it, following the advice above.
5.  Make sure the following line is in wp-config.php and it is ABOVE the "require_once(ABSPATH.'wp-settings.php');" line:

    `define( 'WP_CACHE', true );`
6.  Try the Settings->WP Super Cache page again and enable cache.
7.  Look in wp-content/cache/supercache/. Are there directories and files there?
8.  Anything in your php error_log?
9.  If your browser keeps asking you to save the file after the super cache is installed you must disable Super Cache compression. Go to the Settings->WP Super Cache page and disable it there.
10. The plugin does not work very well when PHP's safe mode is active. This must be disabled by your administrator.
11. If pages are randomly super cached and sometimes not, your blog can probably be viewed with and without the "www" prefix on the URL. You should choose one way and install the [Enforce www preference](http://txfx.net/code/wordpress/enforce-www-preference/) plugin if you are using an old WordPress install. The latest versions redirect themselves (you should always be running the latest version of WordPress anyway!)
12. Private Server users at Dreamhost should edit wp-content/wp-cache-config.php and set the cache dir to "/tmp/" if they are getting errors about increasing CPU usage. See this [discussion](http://wordpress.org/support/topic/145895?replies=42) for more.
13. File locking errors such as "failed to acquire key 0x152b: Permission denied in..." or "Page not cached by WP Super Cache. Could not get mutex lock." are a sign that you may have to use file locking. Edit wp-content/wp-cache-config.php and uncomment "$use_flock = true" or set $sem_id to a different value. You can also disable file locking from the Admin screen as a last resort.
14. Make sure cache/wp_cache_mutex.lock is writable by the web server if using coarse file locking.
15. The cache folder cannot be put on an NFS or Samba or NAS share. It has to be on a local disk. File locking and deleting expired files will not work properly unless the cache folder is on the local machine.
16. Garbage collection of old cache files won't work if WordPress can't find wp-cron.php. If your hostname resolves to 127.0.0.1 it could be preventing the garbage collection from working. Check your access_logs for wp-cron.php entries. Do they return a 404 (file not found) or 200 code? If it's 404 or you don't see wp-cron.php anywhere WordPress may be looking for that script in the wrong place. You should speak to your server administator to correct this or edit /etc/hosts on Unix servers and remove the following line. Your hostname must resolve to the external IP address other servers on the network/Internet use. See http://yoast.com/wp-cron-issues/ for more.

    `127.0.0.1 myhostname.com`
A line like "127.0.0.1 localhost localhost.localdomain" is ok.
17. If old pages are being served to your visitors via the supercache, you may be missing Apache modules (or their equivalents if you don't use Apache). 3 modules are required: mod_mime, mod_headers and mod_expires. The last two are especially important for making sure browsers load new versions of existing pages on your site.
18. The error message, "WP Super Cache is installed but broken. The path to wp-cache-phase1.php in wp-content/advanced-cache.php must be fixed!" appears at the end of every page. Open the file wp-content/advanced-cache.php in your favourite editor. Is the path to wp-cache-phase1.php correct? This file will normally be in wp-content/plugins/wp-super-cache/. If it is not correct the caching engine will not load.
19. Caching doesn't work. The timestamp on my blog keeps changing when I reload. Check that the path in your .htaccess rules matches where the supercache directory is. You may have to hardcode it. Or use the plugin in PHP or legacy caching mode.
20. If supercache cache files are generated but not served, check the permissions on all your wp-content/cache/supercache folders (and each of wp-content cache and supercache folders) and wp-content/cache/.htaccess. If your PHP runs as a different user to Apache and permissions are strict Apache may not be able to read the PHP generated cache files. To fix you must add the following line to your wp-config.php (Add it above the WP_CACHE define.) Then clear your cache.

	`umask( 0022 );`
21. If you see garbage in your browser after enabling compression in the plugin, compression may already be enabled in your web server. In Apache you must disable mod_deflate, or in PHP zlib compression may be enabled. You can disable that in three ways. If you have root access, edit your php.ini and find the zlib.output_compression setting and make sure it's "Off" or add this line to your .htaccess:

	`php_flag zlib.output_compression off`

If that doesn't work, add this line to your wp-config.php:

	`ini_set('zlib.output_compression', 0);`
22. The "white screen of death" or a blank page  when you visit your site is almost always caused by a PHP error but [it may also be caused by APC](http://www.johnberns.com/2010/03/19/wp-super-cache-blank-page-problem-fixed/). Disable that PHP extension if you have trouble and replace with eAccelerator or Xcache.
23. After uninstalling, your permalinks may break if you remove the WordPress mod_rewrite rules too. Regenerate those rules by visiting the Settings->Permalink page and saving that form again.

== CDN ==

A Content Delivery Network (CDN) is usually a network of computers situated around the world that will serve the content of your website faster by using servers close to you. Static files like images, Javascript and CSS files can be served through these networks to speed up how fast your site loads. You can also create a "poor man's CDN" by using a sub domain of your domain to serve static files too.

[OSSDL CDN off-linker](http://wordpress.org/extend/plugins/ossdl-cdn-off-linker/) has been integrated into WP Super Cache to provide basic CDN support. It works by rewriting the URLs of files (excluding .php files) in wp-content and wp-includes on your server so they point at a different hostname. Many CDNs support [origin pull](http://www.google.com/search?hl=en&q=%22origin+pull%22). This means the CDN will download the file automatically from your server when it's first requested, and will continue to serve it for a configurable length of time before downloading it again from your server.

Configure this on the "CDN" tab of the plugin settings page. This is an advanced technique and requires a basic understanding of how your webserver or CDNs work. Please be sure to clear the file cache after you configure the CDN.

== Custom Caching ==
It is now possible to hook into the caching process using the add_cacheaction() function.

Three hooks are available:

1. 'wp_cache_get_cookies_values' - modify the key used by WP Cache.
2. 'add_cacheaction' - runs in phase2. Allows a plugin to add WordPress hooks.
3. 'cache_admin_page' - runs in the admin page. Use it to modify that page, perhaps by adding new configuration options.

There is one regular WordPress filter too. Use the "do_createsupercache" filter 
to customize the checks made before caching. The filter accepts one parameter. 
The output of WP-Cache's wp_cache_get_cookies_values() function.

See plugins/searchengine.php as an example I use for my [No Adverts for Friends](http://ocaoimh.ie/no-adverts-for-friends/) plugin.

== Links ==
[WP Widget Cache](http://wordpress.org/extend/plugins/wp-widget-cache/) is another caching plugin for WordPress. This plugin caches the output of widgets and may significantly speed up dynamic page generation times.

== Updates ==
Updates to the plugin will be posted here, to [Holy Shmoly!](http://ocaoimh.ie/) and the [WP Super Cache homepage](http://ocaoimh.ie/wp-super-cache/) will always link to the newest version.

== Thanks ==
I would sincerely like to thank [John Pozadzides](http://onemansblog.com/) for giving me the idea for this, for writing the "How it works" section and for testing the plugin through 2 front page appearances on digg.com

Thanks to James Farmer and Andrew Billits of [Edu Blogs](http://edublogs.org/) fame who helped me make this more WordPress MU friendly.

Translators who did a great job converting the text of the plugin to their native language. Thank you!

* [Gianni Diurno](http://gidibao.net/) (Italian)
* [Omi](http://equipajedemano.info/) (Spanish)
* [tomchen1989](http://emule-fans.com/) (Simplified Chinese)
* Tai (Japanese)
* [Vitaly](http://pressword.com.ua/wordpress/) (Ukranian)
* [Pseric](http://pseric.com/) and [Priv](http://priv.tw/blog) (Traditional Chinese)
* [Maître Mô](http://maitremo.fr/) (French)
* [Mathias Roth](http://trade-service.eu/) (German)
