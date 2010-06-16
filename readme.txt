=== WP Super Cache ===
Contributors: donncha
Tags: performance,caching,wp-cache,wp-super-cache,cache
Tested up to: 3.0
Stable tag: 0.9.9.3
Requires at least: 2.6
Donate link: http://ocaoimh.ie/gad/

A very fast caching engine for WordPress that produces static html files.

== Description ==
This plugin generates static html files from your dynamic WordPress blog.  After a html file is generated your webserver will serve that file instead of processing the comparatively heavier and more expensive WordPress PHP scripts.

The static html files will be served to the vast majority of your users, but because a user's details are displayed in the comment form after they leave a comment those requests are handled by PHP. Static files are served to:

1. Users who are not logged in.
2. Users who have not left a comment on your blog.
3. Or users who have not viewed a password protected post.

99% of your visitors will be served static html files. Those users who don't see the static files will still benefit because they will see regular WP-Cache cached files and your server won't be as busy as before. This plugin will help your server cope with a front page appearance on digg.com or other social networking site.

If for some reason "supercaching" doesn't work on your server then don't worry. Caching will still be performed, but every request will require loading the PHP engine. In normal circumstances this isn't bad at all. Visitors to your site will notice no slowdown or difference. Supercache really comes into it's own if your server is underpowered, or you're experiencing heavy traffic.
Super Cached html files will be served more quickly than PHP generated cached files but in every day use, the difference isn't noticeable.

See the [WP Super Cache homepage](http://ocaoimh.ie/wp-super-cache/) for further information. [Developer documentation](http://ocaoimh.ie/wp-super-cache-developers/) is also available for those who need to interact with the cache or write plugins.

The [changelog](http://svn.wp-plugins.org/wp-super-cache/trunk/Changelog.txt) is a good place to start if you want to know what has changed since you last downloaded the plugin.

== Upgrade Notice ==

= 0.9.9.3 =
Fix division by zero error in half-on mode, always show "delete cache" button, fix "Update mod_rewrite rules" button.

== Changelog ==

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
1. You should have the Apache mod mime and mod rewrite modules installed and WordPress fancy permalinks enabled. PHP safe mode should be disabled. If any of those are missing or off you can still use the slower WP-Cache part of the plugin.
2. If you have WP-Cache installed already, please disable it. Edit wp-config.php and make sure the WP_CACHE define is deleted, and remove the files wp-content/wp-cache-config.php and wp-content/advanced-cache.php. These will be recreated when you install this plugin.
3. Upload this directory to your plugins directory. It will create a 'wp-content/plugins/wp-super-cache/' directory.
4. If you are using WordPress MU you will need to install this in 'wp-content/mu-plugins/wp-super-cache/' and the file wp-cache.php must be copied into the mu-plugins directory.
5. WordPress users should go to their Plugins page and activate "WP Super Cache".
6. Now go to Settings->WP Super Cache and enable caching. If you see an error message or a blank screen you may need to fix it. See the "FAQ" section later in this readme for instructions.
7. mod_rewrite rules will be inserted into your .htaccess file. Look in your web root directory for this file. It should look similar to this:

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

Edit the file uninstall.php in your plugins/wp-super-cache/ directory and set
UNINSTALL_WPSUPERCACHE to a non blank value.

	`define( 'UNINSTALL_WPSUPERCACHE', '1' );`

Open your browser and load wp-content/plugins/wp-super-cache/uninstall.php directly.
You must be logged in, and you must confirm the action. If you do not delete the plugin
immediately, after the script runs, please comment out the define() above to stop 
someone else running it.

To manually uninstall:

1. Remove the WP_CACHE define from wp-config.php. It looks like `define( 'WP_CACHE', true );`
2. Clear the cache in the backend page and then deactivate the plugin on the plugins page.
3. Remove the Super Cache mod_rewrite rules from your .htaccess file.
4. Remove the files wp-content/advanced-cache.php and wp-content/wp-cache-config.php
5. Remove the directory wp-content/cache/
6. Remove the directory wp-super-cache from your plugins directory.

== If all else fails and your site is broken ==
1. Remove the WP_CACHE define from wp-config.php. It looks like `define( 'WP_CACHE', true );`
2. Remove the rules (see above) that the plugin wrote to the .htaccess file in your root directory.
3. Delete the wp-super-cache folder in the plugins folder.
4. Optionally delete advanced-cache.php, wp-cache-config.php and the cache folder in wp-content/.

== Frequently Asked Questions ==

= How do I know my blog is being cached? =

View the source of any page on your site. When a page is first created, you'll see the text "Dynamic page generated in XXXX seconds." and "Cached page generated by WP-Super-Cache on YYYY-MM-DD HH:MM:SS" at the end of the source code. On reload, a cached page will show the same timestamp so wait a few seconds before checking. 
In "HALF-ON" mode, if you have compression enabled, the text "Compression = gzip" will be added. If compression is disabled and the page is served as a static html file, the text "super cache" will be added. The only other way to check if your cached file was served by PHP script or from the static cache is by looking at the HTTP headers. WP-Cache (PHP) cached pages will have the header "WP-Super-Cache: WP-Cache". I used the <a href="https://addons.mozilla.org/en-US/firefox/addon/3829">Live HTTP Headers</a> extension for Firefox to examine the headers. You should also check your cache directory in wp-content/cache/supercache/hostname/ for static cache files.
If the plugin rules are missing from your .htaccess file, the plugin will attempt to serve the super cached page if it's found. The header "WP-Cache: Served supercache file from PHP" if this happens.

= WP-Cache vs Supercache files =

WP-Cache files are stored in wp-content/cache/ (or on MU sites in a blogs sub directory) and are named wp-cache-XXXXXXXXXXXXXXXXX.html. Associated meta files are stored in a meta sub directory. Those files contain information about the cached file.
Supercache files are stored in wp-content/cache/supercache/HOSTNAME/ where HOSTNAME is your domain name. The files are stored in directories matching your site's permalink structure.

= Why is WP-Super-Cache better than WP-Cache? =

This plugin is based on the excellent WP-Cache plugin and therefore brings all the benefits of that plugin to WordPress. On top of that it creates copies of every page that is accessed on a blog in a form that is quickly served by the web server. It's almost as quick as if the you had saved a page in your browser and uploaded it to replace your homepage.

= Will comments and other dynamic parts of my blog update immediately? =

Comments will show as soon as they are moderated, depending on the comment policy of the blog owner. Other dynamic elements on a page may not update unless they are written in Javascript, Flash, Java or another client side browser language. The plugin really produces static html pages. No PHP is executed when those pages are served. "Popularity Contest" is one such plugin that will not work. 

= Will the Super Cache compression slow down my server? =

No, it will do the opposite in fact. Super Cache files are compressed and stored that way so the heavy compression is done only once. These files are generally much smaller and are sent to a visitor's browser much more quickly than uncompressed html. As a result, your server spends less time talking over the network which saves CPU time and bandwidth, and can also serve the next request much more quickly.

= How do I make certain parts of the page stay dynamic? =

WP Super Cache retains the dynamic loading code of WP Cache but only works in "half on" mode.

There are two ways to do this, you can have functions that stay dynamic or you can include other files on every page load. To have a dynamic function in the cached PHP page use this syntax around the function:

`<!--mfunc function_name( 'parameter', 'another_parameter' ) -->
<?php function_name( 'parameter', 'another_parameter' ) ?>
<!--/mfunc-->`

The HTML comments around the mirrored PHP allow it to be executed in the static page. To include another file try this:

`<!--mclude file.php-->
<?php include_once( ABSPATH . 'file.php' ); ?>
<!--/mclude-->`

That will include file.php under the ABSPATH directory, which is the same as where your wp-config.php file is located.

= Why doesn't WP UserOnline, Popularity Contest, WP Postratings or plugin X not work or update on my blog now? =

This plugin caches entire pages but some plugins think they can run PHP code every time a page loads. To fix this, the plugin needs to use Javascript/AJAX methods or the mfunc/mclude code described in the previous answer to update or display dynamic information.

= Why doesn't the plugin cache requests by search engine bots by default? =

Those bots usually only visit each page once and if the page is not popular there's no point creating a cache file that will sit idle on your server.

= A category page is showing instead of my homepage =

A tiny proportion of websites will have problems with the following configuration:

1. Uses a static page for the front page.
2. Uses /%category%/%postname%/ permalink structure.

Sometimes a category page is cached as the homepage of the site instead of the static page. I can't [replicate the problem](http://wordpress.org/support/topic/237415/page/2?replies=38) but a simple solution is to switch the plugin to half-on mode. For normal traffic you will see no difference in the speed of your site.

= Why do I get warnings about caching from http://ismyblogworking.com/ =

"Your blog doesn't support client caching (no 304 response to If-modified-since)."
"Your feed doesn't support caching (no 304 response to If-modified-since)"

Supercache doesn't support 304 header checks. This is caching done by your browser, not your server. It is a check your browser does to ask the server if an updated version of the current page is available. If not, it doesn't download the old version again.
The page is still cached by your server, just not by the browsers of your visitors. WordPress doesn't support 304 caching either so you're not losing out.
Try the Cacheability Engine at http://www.ircache.net/cgi-bin/cacheability.py or http://redbot.org/ for further analysis.

= How should I best use the utm_source tracking tools in Google Analytics with this plugin? =

That tracking adds a query string to each url linked from various sources like Twitter and feedreaders. Unfortunately it stops pages being supercached. See [Joost's comment here](http://ocaoimh.ie/remove-unused-utmsource-urls/#comment-672813) for how to turn it into an anchor tag which can be supercached.

= Troubleshooting =

If things don't work when you installed the plugin here are a few things to check:

1.  Is wp-content writable by the web server?
2.  Is there a wp-content/wp-cache-config.php ? If not, copy the file wp-super-cache/wp-cache-config-sample.php to wp-content/wp-cache-config.php and make sure WPCACHEHOME points at the right place. "plugins" should be "mu-plugins" if you're using WordPress MU.
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
14. Make sure cache/wp_cache_mutex.lock is writeable by the web server.
15. The cache folder cannot be put on an NFS or Samba or NAS share. It has to be on a local disk. File locking and deleting expired files will not work properly unless the cache folder is on the local machine.
16. Garbage collection of old cache files won't work if WordPress can't find wp-cron.php. If your hostname resolves to 127.0.0.1 it could be preventing the garbage collection from working. Check your access_logs for wp-cron.php entries. Do they return a 404 (file not found) or 200 code? If it's 404 or you don't see wp-cron.php anywhere WordPress may be looking for that script in the wrong place. You should speak to your server administator to correct this or edit /etc/hosts on Unix servers and remove the following line. Your hostname must resolve to the external IP address other servers on the network/Internet use. See http://yoast.com/wp-cron-issues/ for more.

    `127.0.0.1 myhostname.com`
A line like "127.0.0.1 localhost localhost.localdomain" is ok.
17. If old pages are being served to your visitors via the supercache, you may be missing Apache modules (or their equivalents if you don't use Apache). 3 modules are required: mod_mime, mod_headers and mod_expires. The last two are especially important for making sure browsers load new versions of existing pages on your site.
18. The error message, "WP Super Cache is installed but broken. The path to wp-cache-phase1.php in wp-content/advanced-cache.php must be fixed!" appears at the end of every page. Open the file wp-content/advanced-cache.php in your favourite editor. Is the path to wp-cache-phase1.php correct? If it is not the caching engine will not load.
19. Caching doesn't work. The timestamp on my blog keeps changing when I reload. Check that the path in your .htaccess rules matches where the supercache directory is. You may have to hardcode it. Or use the plugin in Half-On mode.
20. If supercache cache files are generated but not served, check the permissions on all your wp-content/cache/supercache folders (and each of wp-content cache and supercache folders) and wp-content/cache/.htaccess. If your PHP runs as a different user to Apache and permissions are strict Apache may not be able to read the PHP generated cache files. To fix you must add the following line to your wp-config.php (Add it above the WP_CACHE define.) Then clear your cache.

	`umask( 0022 );`
21. If you see garbage in your browser after enabling compression in the plugin, compression may already be enabled in your web server. In Apache you must disable mod_deflate, or in PHP zlib compression may be enabled. You can disable that in three ways. If you have root access, edit your php.ini and find the zlib.output_compression setting and make sure it's "Off" or add this line to your .htaccess:

	`php_flag zlib.output_compression off`

If that doesn't work, add this line to your wp-config.php:

	`ini_set('zlib.output_compression', 0);`
22. The "white screen of death" or a blank page  when you visit your site is almost always caused by a PHP error but [it may also be caused by APC](http://www.johnberns.com/2010/03/19/wp-super-cache-blank-page-problem-fixed/). Disable that PHP extension if you have trouble and replace with eAccelerator or Xcache.

== Custom Caching ==
It is now possible to hook into the caching process using the add_cacheaction() function.

Three hooks are available:

1. 'wp_cache_get_cookies_values' - modify the key used by WP Cache.
2. 'add_cacheaction' - runs in phase2. Allows a plugin to add WordPress hooks.
3. 'cache_admin_page' - runs in the admin page. Use it to modify that page, perhaps by adding new configuration options.

There is one regular WordPress filter too. Use the "do_createsupercache" filter 
to customize the checks made before caching. The filter accepts one parameter. 
The output of WP-Cache's wp_cache_get_cookies_values() function.

See plugins/searchengine.php as an example I use for my [No Adverts for Friends](plugin at http://ocaoimh.ie/no-adverts-for-friends/)

== Links ==
[WP Widget Cache](http://wordpress.org/extend/plugins/wp-widget-cache/) is another caching plugin for WordPress. This plugin caches the output of widgets and may significantly speed up dynamic page generation times.

== Updates ==
Updates to the plugin will be posted here, to [Holy Shmoly!](http://ocaoimh.ie/) and the [WP Super Cache homepage](http://ocaoimh.ie/wp-super-cache/) will always link to the newest version.

== Thanks ==
I would sincerely like to thank [John Pozadzides](http://onemansblog.com/) for giving me the idea for this, for writing the "How it works" section and for testing the plugin through 2 front page appearances on digg.com

Thanks to James Farmer and Andrew Billits of [Edu Blogs](http://edublogs.org/) fame who helped me make this more WordPress MU friendly.

Translators who did a great job converting the text of the plugin to their native language. Thank you!
[Gianni Diurno](http://gidibao.net/) (Italian)
[Omi](http://equipajedemano.info/) (Spanish)
