# WP Super Cache #
* Contributors: donncha, automattic
* Tags: performance, caching, wp-cache, wp-super-cache, cache
* Tested up to: 5.7.1
* Stable tag: 1.7.3
* Requires at least: 3.1
* Requires PHP: 5.2.4
* License: GPLv2 or later
* License URI: https://www.gnu.org/licenses/gpl-2.0.html

A very fast caching engine for WordPress that produces static html files.

## Description ##
This plugin generates static html files from your dynamic WordPress blog.  After a html file is generated your webserver will serve that file instead of processing the comparatively heavier and more expensive WordPress PHP scripts.

The static html files will be served to the vast majority of your users:

* Users who are not logged in.
* Users who have not left a comment on your blog.
* Or users who have not viewed a password protected post.

99% of your visitors will be served static html files. One cached file can be served thousands of times. Other visitors will be served custom cached files tailored to their visit. If they are logged in, or have left comments those details will be displayed and cached for them.

The plugin serves cached files in 3 ways (ranked by speed):

1. Expert. The fastest method is by using Apache mod_rewrite (or whatever similar module your web server supports) to serve "supercached" static html files. This completely bypasses PHP and is extremely quick. If your server is hit by a deluge of traffic it is more likely to cope as the requests are "lighter". This does require the Apache mod_rewrite module (which is probably installed if you have custom permalinks) and a modification of your .htaccess file which is risky and may take down your site if modified incorrectly.
2. Simple. Supercached static files can be served by PHP and this is the recommended way of using the plugin. The plugin will serve a "supercached" file if it exists and it's almost as fast as the mod_rewrite method. It's easier to configure as the .htaccess file doesn't need to be changed. You still need a custom permalink. You can keep portions of your page dynamic in this caching mode.
3. WP-Cache caching. This is mainly used to cache pages for known users, URLs with parameters and feeds. Known users are logged in users, visitors who leave comments or those who should be shown custom per-user data. It's the most flexible caching method and slightly slower. WP-Cache caching will also cache visits by unknown users if supercaching is disabled. You can have dynamic parts to your page in this mode too. This mode is always enabled but you can disable caching for known users, URLs with parameters, or feeds separately. Set the constant "DISABLE_SUPERCACHE" to 1 in your wp-config.php if you want to only use WP-Cache caching.

If you're not comfortable with editing PHP files then use simple mode. It's easy to set up and very fast.

### Recommended Settings ###
1. Simple caching.
2. Compress pages.
3. Don't cache pages for known users.
4. Cache rebuild.
5. CDN support.
6. Extra homepage checks.

Garbage collection is the act of cleaning up cache files that are out of date and stale. There's no correct value for the expiry time but a good starting point is 1800 seconds.

Consider deleting the contents of the "Rejected User Agents" text box and allow search engines to cache files for you.

Preload as many posts as you can and enable "Preload Mode". Garbage collection of old cached files will be disabled. If you don't care about sidebar widgets updating often set the preload interval to 2880 minutes (2 days) so all your posts aren't recached very often. When the preload occurs the cache files for the post being refreshed is deleted and then regenerated. Afterwards a garbage collection of all old files is performed to clean out stale cache files.
Even with preload mode enabled cached files will still be deleted when posts are modified or comments made.

### Development ###
* Active development of this plugin is handled [on GitHub](https://github.com/Automattic/wp-super-cache).
* Translation of the plugin into different languages is on the [translation page](https://translate.wordpress.org/projects/wp-plugins/wp-super-cache).

### Documentation ###
If you need more information than the following, you can have a look at the [Developer documentation](https://odd.blog/wp-super-cache-developers/).

#### Preloading ####
You can generate cached files for the posts, categories and tags of your site by preloading. Preloading will visit each page of your site generating a cached page as it goes along, just like any other visitor to the site. Due to the sequential nature of this function, it can take some time to preload a complete site if there are many posts.
To make preloading more effective it can be useful to disable garbage collection so that older cache files are not deleted. This is done by enabling "Preload Mode" in the settings. Be aware however, that pages will go out of date eventually but that updates by submitting comments or editing posts will clear portions of the cache.

#### Garbage Collection ####
Your cache directory fills up over time, which takes up space on your server. If space is limited or billed by capacity, or if you worry that the cached pages of your site will go stale then garbage collection has to be done. Garbage collection happens on a regular basis and deletes old files in the cache directory. On the advanced settings page you can specify:
1. Cache timeout. How long cache files are considered fresh for. After this time they are stale and can be deleted.
2. Scheduler. Setup how often garbage collection should be done.
3. Notification emails. You can be informed on garbage collection job progress.
There's no right or wrong settings for garbage collection. It depends on your own site.
If your site gets regular updates, or comments then set the timeout to 1800 seconds, and set the timer to 600 seconds.
If your site is mostly static you can disable garbage collection by entering 0 as the timeout, or use a really large timeout value.

The cache directory, usually wp-content/cache/ is only for temporary files. Do not ever put important files or symlinks to important files or directories in that directory. They will be deleted if the plugin has write access to them.

#### CDN ####
A Content Delivery Network (CDN) is usually a network of computers situated around the world that will serve the content of your website faster by using servers close to you. Static files like images, Javascript and CSS files can be served through these networks to speed up how fast your site loads. You can also create a "poor man's CDN" by using a sub domain of your domain to serve static files too.

[OSSDL CDN off-linker](https://wordpress.org/plugins/ossdl-cdn-off-linker/) has been integrated into WP Super Cache to provide basic CDN support. It works by rewriting the URLs of files (excluding .php files) in wp-content and wp-includes on your server so they point at a different hostname. Many CDNs support [origin pull](https://www.google.com/search?hl=en&q=%22origin+pull%22). This means the CDN will download the file automatically from your server when it's first requested, and will continue to serve it for a configurable length of time before downloading it again from your server.

Configure this on the "CDN" tab of the plugin settings page. This is an advanced technique and requires a basic understanding of how your webserver or CDNs work. Please be sure to clear the file cache after you configure the CDN.

#### REST API ####
There are now REST API endpoints for accessing the settings of this plugin. You'll need to be authenticated as an admin user with permission to view the settings page to use it. This has not been documented yet but you can find all the code that deals with this in the "rest" directory.

#### Custom Caching ####
It is now possible to hook into the caching process using the add_cacheaction() function.

Three hooks are available:

1. 'wp_cache_get_cookies_values' - modify the key used by WP Cache.
2. 'add_cacheaction' - runs in phase2. Allows a plugin to add WordPress hooks.
3. 'cache_admin_page' - runs in the admin page. Use it to modify that page, perhaps by adding new configuration options.

There is one regular WordPress filter too. Use the "do_createsupercache" filter
to customize the checks made before caching. The filter accepts one parameter.
The output of WP-Cache's wp_cache_get_cookies_values() function.

WP Super Cache has its own plugin system. This code is loaded when WP Super Cache loads and can be used to change how caching is done. This is before most of WordPress loads so some functionality will not be available. Plugins can be located anywhere that PHP can load them. Add your own plugin either:

* by putting your plugin in the wp-content/plugins/wp-super-cache-plugins directory, or
* by calling wpsc_add_plugin( $name ) where $name is the full filename and path to the plugin. You only need to call that function once to add it. Use wpsc_delete_plugin( $name ) to remove it from the list of loaded plugins.

The cookies WP Super Cache uses to identify "known users" can be modified now by adding the names of those cookies to a list in the plugin configuration. Use wpsc_add_cookie( $name ) to add a new cookie, and wpsc_delete_cookie( $name ) to remove it. The cookie names also modify the mod_rewrite rules used by the plugin but I recommend using Simple mode caching to avoid complications with updating the .htaccess file.
The cookie name and value are used to differenciate users so you can have one cookie, but different values for each type of user on your site for example. They'll be served different cache files.

See [plugins/searchengine.php](https://github.com/Automattic/wp-super-cache/blob/4cda5c0f2218e40e118232b5bf22d227fb3206b7/plugins/searchengine.php) as an example I use for my [No Adverts for Friends](https://odd.blog/no-adverts-for-friends/) plugin.

### Troubleshooting ###
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
12. Private Server users at Dreamhost should edit wp-content/wp-cache-config.php and set the cache dir to "/tmp/" if they are getting errors about increasing CPU usage. See this [discussion](https://wordpress.org/support/topic/145895?replies=42) for more.
13. File locking errors such as "failed to acquire key 0x152b: Permission denied in..." or "Page not cached by WP Super Cache. Could not get mutex lock." are a sign that you may have to use file locking. Edit wp-content/wp-cache-config.php and uncomment "$use_flock = true" or set $sem_id to a different value. You can also disable file locking from the Admin screen as a last resort.
14. Make sure cache/wp_cache_mutex.lock is writable by the web server if using coarse file locking.
15. The cache folder cannot be put on an NFS or Samba or NAS share. It has to be on a local disk. File locking and deleting expired files will not work properly unless the cache folder is on the local machine.
16. Garbage collection of old cache files won't work if WordPress can't find wp-cron.php. If your hostname resolves to 127.0.0.1 it could be preventing the garbage collection from working. Check your access_logs for wp-cron.php entries. Do they return a 404 (file not found) or 200 code? If it's 404 or you don't see wp-cron.php anywhere WordPress may be looking for that script in the wrong place. You should speak to your server administator to correct this or edit /etc/hosts on Unix servers and remove the following line. Your hostname must resolve to the external IP address other servers on the network/Internet use. See http://yoast.com/wp-cron-issues/ for more. A line like "127.0.0.1 localhost localhost.localdomain" is ok.

    `127.0.0.1 example.com`
17. If old pages are being served to your visitors via the supercache, you may be missing Apache modules (or their equivalents if you don't use Apache). 3 modules are required: mod_mime, mod_headers and mod_expires. The last two are especially important for making sure browsers load new versions of existing pages on your site.
18. The error message, "WP Super Cache is installed but broken. The path to wp-cache-phase1.php in wp-content/advanced-cache.php must be fixed!" appears at the end of every page. Open the file wp-content/advanced-cache.php in your favourite editor. Is the path to wp-cache-phase1.php correct? This file will normally be in wp-content/plugins/wp-super-cache/. If it is not correct the caching engine will not load.
19. Caching doesn't work. The timestamp on my blog keeps changing when I reload. Check that the path in your .htaccess rules matches where the supercache directory is. You may have to hardcode it. Try disabling supercache mode.
20. If supercache cache files are generated but not served, check the permissions on all your wp-content/cache/supercache folders (and each of wp-content cache and supercache folders) and wp-content/cache/.htaccess. If your PHP runs as a different user to Apache and permissions are strict Apache may not be able to read the PHP generated cache files. To fix you must add the following line to your wp-config.php (Add it above the WP_CACHE define.) Then clear your cache.

	`umask( 0022 );`
21. If you see garbage in your browser after enabling compression in the plugin, compression may already be enabled in your web server. In Apache you must disable mod_deflate, or in PHP zlib compression may be enabled. You can disable that in three ways. If you have root access, edit your php.ini and find the zlib.output_compression setting and make sure it's "Off" or add this line to your .htaccess:

	`php_flag zlib.output_compression off`
If that doesn't work, add this line to your wp-config.php:

	`ini_set('zlib.output_compression', 0);`
22. The "white screen of death" or a blank page  when you visit your site is almost always caused by a PHP error but [it may also be caused by APC](http://www.johnberns.com/2010/03/19/wp-super-cache-blank-page-problem-fixed/). Disable that PHP extension if you have trouble and replace with eAccelerator or Xcache.
23. After uninstalling, your permalinks may break if you remove the WordPress mod_rewrite rules too. Regenerate those rules by visiting the Settings->Permalink page and saving that form again.
24. If your blog refuses to load make sure your wp-config.php is correct. Are you missing an opening or closing PHP tag?
25. Your front page is ok but posts and pages give a 404? Go to Settings->permalinks and click "Save" once you've selected a custom permalink structure. You may need to manually update your .htaccess file.
26. If certain characters do not appear correctly on your website your server may not be configured correctly. You need to tell visitors what character set is used. Go to Settings->Reading and copy the 'Encoding for pages and feeds' value. Edit the .htaccess file with all your Supercache and WordPress rewrite rules and add this at the top, replacing CHARSET with the copied value. (for example, 'UTF-8')

	`AddDefaultCharset CHARSET`
27. Use [Cron View](https://wordpress.org/plugins/cron-view/) to help diagnose garbage collection and preload problems. Use the plugin to make sure jobs are scheduled and for what time. Look for the wp_cache_gc and wp_cache_full_preload_hook jobs.
18. The error message, "WP Super Cache is installed but broken. The constant WPCACHEHOME must be set in the file wp-config.php and point at the WP Super Cache plugin directory." appears at the end of every page. You can delete wp-content/advanced-cache.php and reload the plugin settings page or edit wp-config.php and look for WPCACHEHOME and make sure it points at the wp-super-cache folder. This will normally be wp-content/plugins/wp-super-cache/ but you'll likely need the full path to that file (so it's easier to let the settings page fix it). If it is not correct the caching engine will not load.
19. If your server is running into trouble because of the number of semaphores used by the plugin it's because your users are using file locking which is not recommended (but is needed by a small number of users). You can globally disable file locking by defining the constant WPSC_DISABLE_LOCKING, or defining the constant WPSC_REMOVE_SEMAPHORE so that sem_remove() is called after every page is cached but that seems to cause problems for other processes requesting the same semaphore. Best to disable it.
20. Set the variable $htaccess_path in wp-config.php or wp-cache-config.php to the path of your global .htaccess if the plugin is looking for that file in the wrong directory. This might happen if you have WordPress installed in an unusual way.

## Installation ##
Install like any other plugin, directly from your plugins page but make sure you have custom permalinks enabled. Go to the plugin settings page at Settings->WP Super Cache and enable caching.

### How to uninstall WP Super Cache ###
Almost all you have to do is deactivate the plugin on the plugins page. The plugin should clean up most of the files it created and modified, but it doesn't as yet remove the mod_rewrite rules from the .htaccess file. Look for the section in that file marked by SuperCache BEGIN and END tags. The plugin doesn't remove those because some people add the WordPress rules in that block too.

To manually uninstall:

1. Turn off caching on the plugin settings page and clear the cache.
2. Deactivate the plugin on the plugins page.
3. Remove the WP_CACHE define from wp-config.php. It looks like `define( 'WP_CACHE', true );`
4. Remove the Super Cache mod_rewrite rules from your .htaccess file.
5. Remove the files wp-content/advanced-cache.php and wp-content/wp-cache-config.php
6. Remove the directory wp-content/cache/
7. Remove the directory wp-super-cache from your plugins directory.

### If all else fails and your site is broken ###
1. Remove the WP_CACHE define from wp-config.php. It looks like `define( 'WP_CACHE', true );`
2. Remove the rules (see above) that the plugin wrote to the .htaccess file in your root directory.
3. Delete the wp-super-cache folder in the plugins folder.
4. Optionally delete advanced-cache.php, wp-cache-config.php and the cache folder in wp-content/.


## Frequently Asked Questions ##

### How do I know my blog is being cached? ###
Go to Settings -> WP Super Cache and look for the "Cache Tester" form on the easy settings page. Click "Test Cache" and the plugin will request the front page of the site twice, comparing a timestamp on each to make sure they match.

If you want to do it manually, enable debugging in the plugin settings page and load the log file in a new browser tab. Then view your blog while logged in and logged out. You should see activity in the log. View the source of any page on your site. When a page is first created, you'll see the text "Dynamic page generated in XXXX seconds." and "Cached page generated by WP-Super-Cache on YYYY-MM-DD HH:MM:SS" at the end of the source code. On reload, a cached page will show the same timestamp so wait a few seconds before checking.
If Supercaching is disabled and you have compression enabled, the text "Compression = gzip" will be added. If compression is disabled and the page is served as a static html file, the text "super cache" will be added. The only other way to check if your cached file was served by PHP script or from the static cache is by looking at the HTTP headers. PHP cached pages will have the header "WP-Super-Cache: Served supercache file from PHP". WPCache cached files will have the header, "WP-Super-Cache: Served WPCache cache file". You should also check your cache directory in wp-content/cache/supercache/hostname/ for static cache files.
If the plugin rules are missing from your .htaccess file, the plugin will attempt to serve the super cached page if it's found. The header "WP-Super-Cache: Served supercache file from PHP" if this happens.
The pagespeed module for Apache may cause problems when testing. Disable it if you notice any problems running the cache tester.

### How do I disable Supercaching? ###
If you only want to use the WP-Cache engine then edit your wp-config.php or create an mu-plugin that sets the constant 'DISABLE_SUPERCACHE' to 1.

### WP-Cache vs Supercache files ###
All cache files are stored in wp-content/cache/supercache/HOSTNAME/ where HOSTNANE is your domain name. The files are stored in directories matching your site's permalink structure. Supercache files are index.html or some variant of that, depending on what type of visitor hit the blog. Other files are named wp-cache-XXXXXXXXXXXXXXXXX.php. Associated meta filesnames start with "meta". Those files contain information about the cached file. These files are generated by the "WPCache caching" engine in the plugin.

### Will comments and other dynamic parts of my blog update immediately? ###
Comments will show as soon as they are moderated, depending on the comment policy of the blog owner. Other dynamic elements on a page may not update unless they are written in Javascript, Flash, Java or another client side browser language. The plugin really produces static html pages. No PHP is executed when those pages are served. "Popularity Contest" is one such plugin that will not work.

### Will the Super Cache compression slow down my server? ###
No, it will do the opposite. Super Cache files are compressed and stored that way so the heavy compression is done only once. These files are generally much smaller and are sent to a visitor's browser much more quickly than uncompressed html. As a result, your server spends less time talking over the network which saves CPU time and bandwidth, and can also serve the next request much more quickly.

### How do I make certain parts of the page stay dynamic? ###
Note: this functionality is disabled by default. You will have to enable it on the Advanced Settings page.

There are 2 ways of doing this. You can use Javascript to draw the part of the page you want to keep dynamic. That's what Google Adsense and many widgets from external sites do and is the recommended way. Or you can use a WP Super Cache filter to do the job but you can't use mod_rewrite mode caching. You have to use the "simple" delivery method or disable supercaching.

WP Super Cache 1.4 introduced a cacheaction filter called wpsc_cachedata. The cached page to be displayed goes through this filter and allows modification of the page. If the page contains a placeholder tag the filter can be used to replace that tag with your dynamically generated html.
The function that hooks on to the wpsc_cachedata filter should be put in a file in the WP Super Cache plugins folder unless you use the late_init feature. An example plugin is included. Edit [dynamic-cache-test.php](http://svn.wp-plugins.org/wp-super-cache/trunk/plugins/dynamic-cache-test.php) to see the example code.
There are two example functions there. There's a simple function that replaces a string (or tag) you define when the cached page is served. The other example function uses an output buffer to generate the dynamic content. Due to a limitation in how PHP works the output buffer code MUST run before the wpsc_cachedata filter is hit, at least for when a page is cached. It doesn't matter when serving cached pages. See [this post](https://odd.blog/y/6j) for a more technical and longer explanation.
To execute WordPress functions you must enable the 'Late init' feature on the advanced settings page.

### How do I delay serving the cache until the "init" action fires? ###
Cached files are served before almost all of WordPress is loaded. While that's great for performance it's a pain when you want to extend the plugin using a core part of WordPress. Enable 'Late init' mode on the Advanced settings page and cached files will be served when "init" fires. WordPress and it's plugins will be loaded now.

### Why don't WP UserOnline, Popularity Contest, WP Postratings or plugin X not work or update on my blog now? ###
This plugin caches entire pages but some plugins think they can run PHP code every time a page loads. To fix this, the plugin needs to use Javascript/AJAX methods or the wpsc_cachedata filter described in the previous answer to update or display dynamic information.

### Why do my WP Super Cache plugins disappear when I upgrade the plugin? ###
WordPress deletes the plugin folder when it updates a plugin. This is the same with WP Super Cache so any modified files in wp-super-cache/plugins/ will be deleted. You can put your custom plugins in a different directory in a number of ways. You can define the variable $wp_cache_plugins_dir in wp-config.php or wp-content/wp-cache-config.php and point it at a directory outside of the wp-super-cache folder. The plugin will look there for it's plugins. Or if you distribute a plugin that needs to load early you can use the function `wpsc_add_plugin( $filename )` to add a new plugin wherever it may be. Use `wpsc_delete_plugin( $filename )` to remove the plugin file. See [#574](https://github.com/Automattic/wp-super-cache/pull/574/) or [this post](https://odd.blog/2017/10/25/writing-wp-super-cache-plugins/) on writing WP Super Cache plugins.

### What does the Cache Rebuild feature do? ###
When a visitor leaves a comment the cached file for that page is deleted and the next visitor recreates the cached page. A page takes time to load so what happens if it receives 100 visitors during this time? There won't be a cached page so WordPress will serve a fresh page for each user and the plugin will try to create a cached page for each of those 100 visitors causing a huge load on your server. This feature stops this happening. The cached page is not cleared when a comment is left. It is marked for rebuilding instead. The next visitor within the next 10 seconds will regenerate the cached page while the old page is served to the other 99 visitors. The page is eventually loaded by the first visitor and the cached page updated. See [this post](https://odd.blog/2009/01/23/wp-super-cache-089/) for more.

### Why doesn't the plugin cache requests by search engine bots by default? ###
Those bots usually only visit each page once and if the page is not popular there's no point creating a cache file that will sit idle on your server. However you can allow these visits to be cached by removing the list of bots from "Rejected User Agents" on the Advanced settings page.

### A category page is showing instead of my homepage ###
A tiny proportion of websites will have problems with the following configuration:

1. Uses a static page for the front page.
2. Uses /%category%/%postname%/ permalink structure.

Sometimes a category page is cached as the homepage of the site instead of the static page. I can't [replicate the problem](https://wordpress.org/support/topic/237415/page/2?replies=38) but a simple solution is to use the "Simple" mode. You can also enable "Extra homepage checks" on the Advanced Settings page.

### Why do I get warnings about caching from http://ismyblogworking.com/ ###
"Your blog doesn't support client caching (no 304 response to If-modified-since)."
"Your feed doesn't support caching (no 304 response to If-modified-since)"

Supercache doesn't support 304 header checks in Expert mode but does support it in Simple mode. This is caching done by your browser, not the server. It is a check your browser does to ask the server if an updated version of the current page is available. If not, it doesn't download the old version again. The page is still cached by your server, just not by your visitors' browsers.
Try the Cacheability Engine at http://www.ircache.net/cgi-bin/cacheability.py or https://redbot.org/ for further analysis.

### How should I best use the utm_source tracking tools in Google Analytics with this plugin? ###
That tracking adds a query string to each url linked from various sources like Twitter and feedreaders. Unfortunately it stops pages being supercached. See [Joost's comment here](https://odd.blog/remove-unused-utmsource-urls/#comment-672813) for how to turn it into an anchor tag which can be supercached.

### The plugin complains that wp-content is writable! htdocs is writable! ###
It's not good when the web server can write to these directories but sometimes shared hosting accounts are set up in this way to make administration easier. Use `chmod 755 directory` to fix the permissions or find the permissions section of your ftp client. This [Google search](https://www.google.com/search?sourceid=chrome&ie=UTF-8&q=ftp+fix+directory+permissions+755) will lead you to more information on this topic and there's also [this codex page](https://codex.wordpress.org/Changing_File_Permissions) too. Unfortunately some hosts require that those directories be writable. If that's the case just ignore this warning.

### How do I delete the WP_CACHE define from wp-config.php? ###
Load your desktop ftp client and connect to your site. Navigate to the root (or the directory below it) of your site where you'll find wp-config.php. Download that file and edit it in a text editor. Delete the line `define( 'WP_CACHE', true );` and save the file. Now upload it, overwriting the wp-config.php on your server.

### How do I delete the Super Cache rules from the .htaccess file? ###
Load your desktop ftp client and connect to your site. You may need to enable "Show hidden files" in the preferences of the ftp client. Navigate to the root of your site where you'll find the .htaccess file. Download that file and edit it in a text editor. Delete the lines between "# BEGIN WPSuperCache" and "# END WPSuperCache" and save the file. Now upload it, overwriting the .htaccess file on your server.

### How do I change file permissions? ###
This [page](https://codex.wordpress.org/Changing_File_Permissions) on the WordPress Codex explains everything you need to know about file permissions on your server and various ways of changing them.

### Why do I get load spikes when new posts are made? ###
You may have the "clear all cached files when new posts are made" option set. Clearing those files can take time plus your visitors will now be visiting uncached pages. Are you using Google Analytics campaign tracking with utm_source in the url? Those pages aren't cached. See the question, "How should I best use the utm_source tracking tools in Google Analytics with this plugin" above for how to use them properly.
Cached pages have to be refreshed when posts are made. Perhaps your server just isn't up to the job of serving the amount of traffic you get. Enable the "cache rebuild" feature as that may help.

### How many pages can I cache? ###
The only real limit are limits defined by your server. For example, EXT2 and EXT3 allow a maximum of 31,999 sub directories so if you have a flat permalink structure (like /%POSTNAME%/) and more than 32,000 posts you may run into problems. Likewise, if you run a multisite network and have more than 31,999 sites (blogs) you won't be able to cache all of them. Realistically if you had that many active sites you wouldn't be running on one server.

### I can see that the www version of my site is cached separately. How do I stop that? ###
WordPress should redirect to the canonical URL of your site but if it doesn't, add this to your .htaccess above the Supercache and WordPress rules. Change example.com to your own hostname.
`RewriteCond %{HTTP_HOST} www.example.com$ [NC]`
`RewriteRule ^(.*)$ https://example.com/$1 [L,R=301]`

### How do I serve cached mobile pages to clients on small screens like phones and tablets? ###
Your theme is probably responsive which means it resizes the page to suit whatever device is displaying the page. If it's not responsive, you'll have to use a separate mobile plugin to render a page formatted for those visitors. The following plugins have been tested but YMMV depending on mobile client. You'll have to enable mobile browser support as well on the Advanced settings page.

* [Jetpack's Mobile Theme Module](https://wordpress.org/plugins/jetpack/)
* [WPTouch](https://wordpress.org/plugins/wptouch/)
* [WordPress Mobile Edition](https://wordpress.org/plugins/wordpress-mobile-edition/)
* [WordPress Mobile Pack](https://wordpress.org/plugins/wordpress-mobile-pack/) (can't have "Don't cache pages for known users." enabled)


## Changelog ##

### 1.7.3 ###
* Sanitize the settings that are written to the config file #763
* Fix the display of "direct cached" example urls in some circumstance. #766

### 1.7.2 ###
* Fixed authenticated RCE in the settings page. Props @m0ze
* Small bug fixes.

### 1.7.1 ###
* Minor fixes to docs. #709 #645
* Fixed typo on cache contents page. #719
* Fixed array index warning. #724
* Updated yellow box links. #725

### 1.7.0 ###
* Added "wpsc_cdn_urls" filter to modify the URLs used to rewrite URLs. #697
* Fixed CDN functionality for logged in users. #698
* Disable settings that don't work in Expert mode. #699
* Don't enable mobile support by default, but it can still be enabled manually. #700
* Change "admin bar" to "Toolbar". Props @garrett-eclipse. #701
* Show settings enabled by "easy" settings page. #703

### 1.6.9 ###
* Improve the variables and messaging used by advanced-cache.php code. #687
* Add a warning message to the debug log viewer. #688
* Disable raw viewing of the debug log. #691
* Clean up the debug log. #692 #694
* Added wpsc_update_check() in 9659af156344a77ae247dc582d52053d95c79b93.

### 1.6.8 ###
* Added new constants, WPSC_SERVE_DISABLED (disable serving of cached files) and WPSC_SUPERCACHE_ONLY (only serve supercache cache files). #682 and #672
* Hide get_post() warning on some sites. #684
* Check if WPCACHEHOME is set correctly before maybe updating it. #683
* Remove object cache support as it never worked properly. #681
* Add "logged in users" to the  "do not cache for users" setting and rename that setting to "Cache Restrictions" #657

### 1.6.7 ###
* wp_cache_setting() can now save boolean values since many of the settings are bools. #676
* Check if $super_cache_enabled is true in a less strict way because it might be '1' rather than true. #677

### 1.6.6 ###
* Fix problems with saving settings. Returns false ONLY when there's an issue with the config file, not when the setting isn't changed. Change other code to cope with that, including updating WPCACHEHOME (#670)
* When saving settings rename the temporary config file correctly, and delete wp-admin/.php if it exists. (#673)
* Fix adding WPCACHEHOME to wp-config.php when advanced-cache.php is not found and wp-config.php is RO. (#674)

### 1.6.5 ###
* Check advanced-cache.php was created by the plugin before modifying/deleting it. (#666)
* When saving settings, save blank lines. Fixes problems with WP_CACHE and WPCACHEHOME in wp-config.php. Related to #652. (#667)
* Update outdated code and use is_multisite() (#600)
* Fix the delete cache button in the Toolbar. (#603)
* Code cleanup in #602
* Use get_post_status instead of post_status (#623)
* Fixes button - Update Direct Pages (#622)
* Removes apache_response_headers and uses only headers_list (#618)
* Function is_site_admin has been deprecated (#611)
* Fixes action urls in wp_cache_manager (#610)
* Remove the link to the HibbsLupusTrust tweet. (#635)
* Don't load wp-cache-config.php if it's already loaded (#605)
* PHPCS fixes and optimization for plugins/domain-mapping.php (#615)
* Introduces PHP_VERSION_ID for faster checking (#604)
* Fixes regex and optimizes ossdl-cdn.php (#596)
* Only update new settings and use a temporary file to avoid corruption. (#652)
* Serve cached files to rejected user agents, don't cache them. (#658)
* Combine multiple headers with the same name (#641)
* Open ‘Delete Cache’ link in same window (#656)
* Promote the Jetpack Site Accelerator on the CDN page. (#636)

### 1.6.4 ###
* Changes between [1.6.3 and 1.6.4](https://github.com/Automattic/wp-super-cache/compare/1.6.3...1.6.4)
* Fixes for WP-CLI (#587) (#592)
* Bumped the minimum WordPress version to 3.1 to use functions introduced then. (#591)
* Fixes to wpsc_post_transition to avoid a fatal error using get_sample_permalink. (#595)
* Fixed the Toolbar "Delete Cache" link. (#589)
* Fixed the headings used in the settings page. (#597)

### 1.6.3 ###
* Changes between [1.6.2 and 1.6.3](https://github.com/Automattic/wp-super-cache/compare/1.6.2...1.6.3)
* Added cookie helper functions (#580)
* Added plugin helper functions (#574)
* Added actions to modify cookie and plugin lists. (#582)
* Really disable garbage collection when timeout = 0 (#571)
* Added warnings about DISABLE_WP_CRON (#575)
* Don't clean expired cache files after preload if garbage collection is disabled (#572)
* On preload, if deleting a post don't delete the sub directories if it's the homepage. (#573)
* Fix generation of semaphores when using WP CLI (#576)
* Fix deleting from the Toolbar (#578)
* Avoid a strpos() warning. (#579)
* Improve deleting of cache in edit/delete/publish actions (#577)
* Fixes to headers code (#496)

### 1.6.2 ###
* Fixed serving expired supercache files (#562)
* Write directly to the config file to avoid permission problems with wp-content. (#563)
* Correctly set the .htaccess rules on the main site of a multisite. (#557)
* Check if set_transient() exists before using it. (#565)
* Removed searchengine.php example plugin as it sets a cookie to track users. Still available [here](https://github.com/Automattic/wp-super-cache/blob/4cda5c0f2218e40e118232b5bf22d227fb3206b7/plugins/searchengine.php). (#567)
* For advanced users only. Change the vary and cache control headers. See https://github.com/Automattic/wp-super-cache/pull/555 (#555)

### 1.6.1 ###
* Fix the name of the WP Crontrol plugin. (#549)
* Handle errors during deactivation/uninstall by email rather than exiting. (#551)
* Add a notice when settings can't be updated. (#552 and #553)

### 1.6.0 ###
* Fix issues in multisite plugin (#501)
* Fixes wp-cli plugin deactivate/activate (#499)
* Cleanup - change quotes. (#495)
* $htaccess_path defines the path to the global .htacess file. (#507)
* Fix 'cannot redeclare gzip_accepted()' (#511)
* Correct the renaming of tmp_wpcache_filename (removed unnecessary slash in path) which caused renaming to fail. (#516)
* Add check for Jetpack mobile theme cookie (#515)
* Optimize wp_cache_phase2 and create wpsc_register_post_hooks (#508)
* WPCACHEHOME has a trailing slash (#513)
* Cleanup cache enable/disable and update_mod_rewrite_rules (#500)
* Post Update now clears category cache (#519)
* Various fixes for saving the debug page form (#542)
* Expert-caching and empty parameters, like ?amp, should not serve cached page (#533)
* Tiny Yslow description fix (#527)
* Add ipad to mobile list (#525)
* Hide opcache_invalidate() warnings since it's disabled some places. (#543)
* Check that HTTP_REFERER exists before checking it. (#544)
* Replace Cron View" with WP Crontrol because it's still updated. (#546)
* adding hook (wp_cache_cleared) for full cache purges (#537)


### 1.5.9 ###
* Fixed fatal error if the debug log was deleted while debugging was enabled and a visitor came to the site.
* Fixed the dynamic caching test plugin because of PHP7 changes. Dynamic cache mode must be enabled now.
* Lots of WordPress coding style formatting fixes to the code.
* All changes: https://github.com/Automattic/wp-super-cache/compare/1.5.8...1.5.9

### 1.5.8 ###
* PHP 7 fixes. (#429)
* Fix debug comments checkbox. (#433)
* Only register uninstall function in admin pages to save queries. (#430)
* Check that wp-cache-phase1.php is loaded before saving settings page. (#428)
* If a url has a "?" in it then don't delete the associated cache. It'll delete the whole cache after stripping out ?... part. (#427 & #420)
* Allow static functions in classes to be used in cacheactions. (#425)
* Don't make AJAX requests anonymous. (#423)
* Fixed link to chmod explanation. (#421)
* Add more escaping to the CDN settings page. (#416)
* Use SERVER_PROTOCOL to determine http protocol. (#412 & #413)
* If preload stalls only send one email per day, but do display an admin notice. (#432)
* Fixed more PHP warnings in #438 and #437
* Hide mod_rewrite warnings for Nginx users. #434

### 1.5.7.1 ###
* If the HTTP HOST is empty then don't use it in strpos to avoid a PHP warning. (#408)
* Don't preload posts with permalinks that contain rejected strings. (#407)
* Generate a list of archive feeds that can be deleted when the site is updated. Also fixes corrupted config file issue and fatal error with older versions of WordPress. (#403)

### 1.5.7 ###
* Fix fatal error in plugins/searchengine.php (#398)

### 1.5.6 ###
* REST API: Added /plugins endpoint to handle the plugins settings page. (#382)
* Minor changes to indentaion and spaces to tabs conversion (#371) (#395)
* Don't set $wp_super_cache_comments here as it's not saved. (#379)
* realpath() only works on directories. The cache_file wasn't set correctly. (#377)
* Fix problem deleting cache from Toolbar because of realpath() (#381)
* Use trigger_error() instead of echoing to the screen if a config file isn't writeable. (#394)
* Added the "wpsc_enable_wp_config_edit" filter to disable editing the wp-config.php (#392)
* Fix some PHP notices when comments are edited/published/maintained. (#386)
* Minor changes to description on plugins page. (#393)

### 1.5.5 ###
* Catch fatal errors so they're not cached, improve code that catches unknown page types. (#367)
* Fix caching on older WP installs, and if the plugin is inactive on a blog, but still caching, give feeds a short TTL to ensure they're fresh. (#366)
* When preloading don't delete sub-directories, or child pages, when caching pages. (#363)
* Avoid PHP warnings from the REST API for settings that are not yet defined. (#361)
* Added missing settings to the config file. (#360)

### 1.5.4 ###
* Fix messages related to creating advanced-cache.php (#355, #354)
* Deleting the plugin doesn't need to delete the cache directory as it's already done on deactivation. (#323)
* Disable Jetpack mobile detection if Jetpack Beta is detected. (#298)
* Add more checks on directories to make sure they exist before deleting them. (#324)
* Add siteurl setting to CDN page for users who have WordPress in it's own directory. (#332)
* Don't enable and then not save debug comments when toggling logging. (#334)
* Show plugin activity html comments to users who disable caching for logged in users. (#335)
* Better notifications on Preload page, and redo sql to fetch posts. Added "wpsc_preload_post_types_args" filter on post visibility, and wpsc_preload_post_types filter on post types used. (#336)
* Use a cached feed if it is newer than the last time a post was updated. (#337)
* Better define a sitemap (#340) but when the content type is unknown add more checks to find out what it is. (#346)
* Save cache location correctly on the advanced settings page. (#345)
* Make sure the debug log exists before toggling it on/off to ensure the http auth code is added to it.
* Return the correct cache type to the REST API. Ignore supercache enabled status. (#352)
* Fix cache contents in REST API showing double count of supercache files. (#353)
* Move the nonce in the CDN page back into a function. (#346)
* Use realpath to compare directories when loading the sample config file to account for symlinked directories. (#342)
* Other minor changes to html or typos
(Numbers are [pull requests](https://github.com/Automattic/wp-super-cache/pulls) on Github.)

### 1.5.3 ###
* Fix a critical bug that caused unlink to be run on null while deleting the plugin.

### 1.5.2 ###
* Add a trailing slash to home path. Fixes problems with finding the .htaccess file.
* Delete WPCACHEHOME and WP_CACHE from wp-config.php when plugin deactivated.
* Check that WPCACHEHOME is the right path on each load of the settings page.
* Load the REST API code without using WPCACHEHOME.
* Fixed mobile browser caching when using WP-Cache caching.
* Fixed directory checks on Windows machines.
* Reverted CDN changes in 1.5.0 as they caused problems in older "WordPress in a separate directory" installs.
* Added note to CDN page when site url != home url. Site owners can use a filter to adjust the URL used.
* Stop preload quicker when requested while preloading taxonomies.
* Added more information for when updating the .htaccess file fails.
* "Served by" header is now optional. Enable it by setting $wpsc_served_header to true in the config file.

### 1.5.1 ###
* Don't use anonymous functions in REST API
* Check that REST API Controller is available before loading the REST API.
* Don't use multibyte string functions because some sites don't have it enabled.

### 1.5.0 ###
* REST API settings endpoints.
* Simplified settings page.
* WP-Cache files reorganised.
* Caching of more http headers.
* Lots of bug fixes.

### 1.4.9 ###
* Fixed bug when not running sem_remove after sem_release. See https://github.com/Automattic/wp-super-cache/issues/85
* Fixed a PHP error impacting PHP 7.1.
* Fixed a bug where we cached PUT and DELETE requests. We're treating them like POST requests now.
* Delete supercache cache files, even when supercache is disabled, because mod_rewrite rules might still be active.
* Updated the settings page, moving things around. [#173](https://github.com/Automattic/wp-super-cache/pull/173)
* Make file locking less attractive on the settings page and fixed the WPSC_DISABLE_LOCKING constant so it really disables file locking even if the user has enabled it already.
* Added a WPSC_REMOVE_SEMAPHORE constant that must be defined if sem_remove() is to be used as it may cause problems.  [#174](https://github.com/Automattic/wp-super-cache/pull/174)
* Added a "wpsc_delete_related_pages_on_edit" filter that on returning 0 will disable deletion of pages outside of page being edited. [#175](https://github.com/Automattic/wp-super-cache/pull/175)
* Fixed plugin deleting all cached pages when a site had a static homepage. [#175](https://github.com/Automattic/wp-super-cache/pull/175)
* Make sure $cache_path has a trailing slash [#177](https://github.com/Automattic/wp-super-cache/pull/77)
* Remove flush() [#127](https://github.com/Automattic/wp-super-cache/pull/127) but also check if headers are empty and flush and get headers again. [#179](https://github.com/Automattic/wp-super-cache/pull/179)
* Add fix for customizer [#161](https://github.com/Automattic/wp-super-cache/pull/161) and don't cache PUT AND DELETE requests [#178](https://github.com/Automattic/wp-super-cache/pull/178)
* Check for superglobals before using them. [#131](https://github.com/Automattic/wp-super-cache/pull/131)

### 1.4.8 ###
* Removed malware URL in a code comment. (harmless to operation of plugin but gets flagged by A/V software)
* Updated translation file.

### 1.4.7 ###
* Update the settings page for WordPress 4.4. layout changes.

### 1.4.6 ###
* Generate the file cache/.htaccess even when one exists so gzip rules are created and gzipped pages are served correctly. Props Tigertech. https://wordpress.org/support/topic/all-website-pages-downloading-gz-file-after-latest-update?replies=36#post-7494087

### 1.4.5 ###
* Enhancement: Only preload public post types. Props webaware.
* Added an uninstall function that deletes the config file. Deactivate function doesn't delete it any more.
* Possible to deactivate the plugin without visiting the settings page now.
* Fixed the cache rebuild system. Rebuild files now survive longer than the request that generate them.
* Minor optimisations: prune_super_cache() exits immediately if the file doesn't exist. The output of wp_cache_get_cookies_values() is now cached.
* Added PHP pid to the debug log to aid debugging.
* Various small bug fixes.
* Fixed reset of expiry time and GC settings when updating advanced settings.
* Removed CacheMeta class to avoid APC errors. It's not used any more.
* Fixed reset of advanced settings when using "easy" settings page.
* Fixed XSS in settings page.
* Hide cache files when servers display directory indexes.
* Prevent PHP object injection through use of serialize().

### 1.4.4 ###
* Fixed fatal error in output handler if GET parameters present in query. Props webaware.
* Fixed debug log. It wasn't logging the right message.

### 1.4.3 ###
* Security release fixing an XSS bug in the settings page. Props Marc Montpas from Sucuri.
* Added wp_debug_log(). Props Jen Heilemann.
* Minor fixes.

### 1.4.2 ###
* Fixed "acceptable file list".
* Fixed "Don't cache GET requests" feature.
* Maybe fixed "304 not modified" problem for some users.
* Fixed some PHP warnings.

### 1.4.1 ###
* Fixed XSS in settings page. Props Simon Waters, Surevine Limited.
* Fix to object cache so entries may now be deleted when posts updated. (object cache still experimental)
* Documentation updates and cleanup of settings page.

### 1.4 ###
* Replace legacy mfunc/mnclude/dynamic-cached-content functionality with a "wpsc_cachedata" cacheaction filter.
* Added dynamic-cache-test.php plugin example wpsc_cachedata filter plugin.
* Delete post, tag and category cache when a post changes from draft to publish or vice versa. Props @Biranit.
* Update advanced-cache.php and wp-config.php if wp-cache-phase1.php doesn't load, usually happening after migrating to a new hosting service.
* Misc bugfixes.

### 1.3.2 ###
* Any mfunc/mclude/dynamic-cached-content tags in comments are now removed.
* Dynamic cached content feature disabled by default and must be enabled on the Advanced Settings page.
* Support for the mobile theme in Jetpack via helper plugin on script's Plugins tab.

### 1.3.1 ###
* Minor updates to documentation
* Fixed XSS in settings page.

### 1.3 ###
* mfunc tags could be executed in comments. Fixed.
* More support for sites that use the LOGGED_IN_COOKIE constant and custom cookies.

### 1.2 ###
* Garbage collection of old cache files is significantly improved. I added a scheduled job that keeps an eye on things and restarts the job if necessary. Also, if you enable caching from the Easy page garbage collection will be enabled too.
* Editors can delete single cached files from the Toolbar now.
* Fixed the cached page counter on the settings page.
* Some sites that updated to 1.0 experienced too much garbage collection. There are still stragglers out there who haven't upgraded but that's fixed now!
* Supercached mobile files are now used as there was a tiny little typo that needed fixing.
* If your site is in a directory and you saw problems updating a page then that should be fixed now.
* The deactivate hook has been changed so your configuration isn.t hosed when you upgrade. Unfortunately this will only happen after you do this upgrade.
* Some sites use custom cookies with the LOGGED_IN_COOKIE constant. Added support for that.
* Added support for WPTouch Pro, but it appears to be flaky still. Anyone have time to work on that? I don.t.
* Some sites had problems with scheduled posts. For some reason the plugin thought the post was in draft mode and then because it only checked the same post once, when the post magically became published the cache wasn.t cleared. That.s fixed, thanks to the debug logging of several patient users.
* And more bug fixes and translation updates.

### 1.1 ###
* Use $_SERVER[ 'SERVER_NAME' ] to create cache directories.
* Only create blogs cached directories if valid requests and blogs exist.
* Only clear current blog's cache files if navigation menu is modified
* Added clean_post_cache action to clear cache on post actions
* Removed garbage collection details on Contents tab
* Added wp_cache_check_mobile cacheaction filter to shortcircuit mobile device check.
* Don't delete cache files for draft posts
* Added action on wp_trash_post to clear the cache when trashed posts are deleted
* Show a warning when 304 browser caching is disabled (because mod_rewrite caching is on)
* New check for safe mode if using less that PHP 5.3.0
* Added wp_supercache_remove_cookies filter to disable anonymous browsing mode.
* Fixed garbage collection schedule dropdown
* Fixed preload problem clearing site's cache on "page on front" sites.
* Fix for PHP variable not defined warnings
* Fixed problem refreshing cache when comments made as siteurl() sometimes didn't work
* Preloading of taxonomies is now optional
* Domain mapping fixes.
* Better support for https sites. Remove https:// to get cache paths.
* Added AddDefaultCharset .htaccess rule back in and added an option to remove it if required.
* Added multisite plugin that adds a "Cached" column to Network->Sites to disable caching on a per site basis.
* Added WPTouch plugin to modify browser and prefix list in mobile detection code. Added support for that plugin's exclude list.
* Fixed cache tester
* Filter the tags that are used to detect end-of-page using the wp_cache_eof_tags filter.
* Removed debug level from logging as it wasn't helpful.
* Removed mention of wp-minify.

### 1.0 ###
* Removed AddDefaultCharset .htaccess rule
* Fixed problem with blogs in a folder and don't have a trailing slash
* New scheduling of garbage collection
* Added a "Delete cache" link to Toolbar to delete cache of current page.
* Updated documentation
* Sorry Digg, Stephen Fry power now!
* Updated translations
* Preload taxonomies and all post types except revisionsand nav menu items
* Fixed previews by logged in users.
* Added option to make logged in users anonymous
* Use WP 3.0 variables to detect multisite installs
* Hash filenames so files are served from the same CDNs

### 0.9.9.9 ###
* Fixed typo, is_front_page.
* Serve repeated static files from the same CDN hostname.
* Updated translations.
* Make supercache dir lowercase to avoid problems with unicode URLs.
* Add option to skip https loaded static content.
* Remove 5 second check on age of existing cache files. Should help with posts that get lots of comments and traffic.
* Lots of bugs fixed.

### 0.9.9.8 ###
* CDN updates: can be switched off, multiple CNAMEs.
* Uninstall process improved. It removes generated files and fixes edited files.
* Cached dynamic pages can now be stored in Supercache files and compressed.
* 1and1 Webhosting fix (/kunden/)
* Remove log by email functionality as it caused problems for users who were inundated by email
* Many more minor fixes and changes.

### 0.9.9.6 ###
* Fixed problem serving cached files with PHP
* Added support for 304 "file not modified" header to help browser caching. (PHP caching only)
* Added French & German translations, updated Italian translation and fixed translation strings.
* Sleep 4 seconds between preload urls to reduce load on the server
* Updated docs and FAQs.

### 0.9.9.5 ###
* Disable compression on on easy setup page. Still causes problems on some hosts.
* Remove footerlink on easy setup page.
* Don't delete mod_rewrite rules when caching is disabled.
* Don't stop users using settings page when in safe mode.

### 0.9.9.4 ###
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

### 0.9.9.3 ###
* Fixed division by zero error in half on mode.
* Always show "delete cache" button.
* Fixed "Update mod_rewrite rules" button.
* Minor text changes to admin page.

### 0.9.9.2 ###
* Forgot to change version number in wp-cache.php

### 0.9.9.1 ###
* Added preloading of static cache.
* Better mobile plugin support
* .htaccess rules can be updated now. Added wpsc_update_htaccess().
* Fixed "page on front" cache clearing bug.
* Check for wordpress_logged_in cookie so test cookie isn't detected.
* Added clear_post_supercache() to clear supercache for a single post.
* Put quotes around rewrite rules in case paths have spaces.

### 0.9.9 ###
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

### 0.9.8 ###
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

### 0.9.7 ###
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

### 0.9.6.1 ###
* Move "not logged in" message init below check for POST.
* Add is_admin() check so plugin definitely can't cache the backend.
* Add "do not cache" page type to admin page.

### 0.9.6 ###
* Add uninstall.php uninstall script.
* Updated cache/.htaccess rules (option to upgrade that)
* Added FAQ about category and static homepage problem.
* Add wp_cache_user_agent_is_rejected() back to wp-cache-phase2.php
* Show message for logged in users when caching disable for them.
* Check filemtime on correct supercache file

### 0.9.5 ###
* Show next and last GC times in minutes, not local time.
* Don't serve wp_cache cache files to rejected user agents. Supercache files are still served to them.
* If enabled, mobile support now serves php cached files to mobile clients and static cached files to everyone else.
* Added checks for "WPSC_DISABLE_COMPRESSION" and "WPSC_DISABLE_LOCKING" constants to disable compression and file locking. For hosting companies primarily.
* Added check for DONOTCACHEPAGE constant to avoid caching a page.
* Use PHP_DOCUMENT_ROOT when creating .htaccess if necessary.

### 0.9.4.3 ###
1. Added "Don't cache for logged in users" option.
2. Display file size stats on admin page.
3. Clear the cache when profile page is updated.
4. Don't cache post previews.
5. Added backslashes to rejected URI regex list.
6. Fixed problems with posts and comments not refreshing.


## Upgrade Notice ##
Security and bugfix release. Security issue isn't too serious but you should upgrade.
