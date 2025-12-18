=== WP Super Cache ===
Contributors: donncha, automattic, adnan007, dilirity, mikemayhem3030, pyronaur, thingalon
Tags: performance, caching, wp-cache, wp-super-cache, cache
Requires at least: 6.7
Requires PHP: 7.2
Tested up to: 6.9
Stable tag: 3.0.3
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

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
If you need more information than the following, you can have a look at [the wiki](https://github.com/Automattic/wp-super-cache/wiki) or the [Developer documentation](https://odd.blog/wp-super-cache-developers/).

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


== Changelog ==
### 3.0.3 - 2025-11-11
#### Added
- Tested up to WordPress 6.9.

#### Changed
- Update package dependencies.

#### Fixed
- Phan: Address PhanRedundantCondition, PhanRedundantArrayValuesCall, and PhanPluginRedundantAssignment violations.
- Remove redundant code.

--------

[See the previous changelogs here](https://github.com/Automattic/jetpack/blob/trunk/projects/plugins/super-cache/CHANGELOG.md#changelog)
