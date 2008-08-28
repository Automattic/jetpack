=== WP Super Cache ===
Contributors: donncha
Tags: performance,caching,wp-cache
Tested up to: 2.6.1
Stable tag: 0.7.1
Requires at least: 2.2

A very fast caching engine for WordPress that produces static html files.

== Description ==
This plugin generates static html files from your dynamic WordPress blog.  After a html file is generated your webserver will serve that file instead of processing the comparatively heavier and more expensive WordPress PHP scripts.

However, because a user's details are displayed in the comment form after they leave a comment, the plugin will only serve static html files to:

1. Users who are not logged in.
2. Users who have not left a comment on your blog.
3. Or users who have not viewed a password protected post. 

The good news is that probably more than 99% of your visitors don't do any of the above! Those users who don't see the static files will still benefit because they will see regular WP-Cache cached files and your server won't be as busy as before.  This plugin should help your server cope with a front page appearance on digg.com or other social networking site.

As this plugin is based on the older WP-Cache plugin you can switch off the Super Cache static html caching. Caching will still be performed, but every request will require loading the PHP engine. In normal circumstances this isn't that bad, but if your server is underpowered, or you're experiencing heavy traffic you may run into trouble. 
Super Cached html files will be server more quickly than PHP generated cached files so there's very little reason not to use the Super Cache feature.

See the [WP Super Cache homepage](http://ocaoimh.ie/wp-super-cache/) for further information.

The [changelog](http://svn.wp-plugins.org/wp-super-cache/trunk/Changelog.txt) is a good place to start if you want to know what has changed since you last downloaded the plugin.

== Installation ==
1. You should have mod mime, mod rewrite and fancy permalinks enabled. PHP safe mode should be disabled. If any of those are missing or off you can still use the slower WP-Cache part of the plugin.
2. If you have WP-Cache installed already, please disable it. Edit wp-config.php and make sure the WP_CACHE define is deleted, and remove the files wp-content/wp-cache-config.php and wp-content/advanced-cache.php. These will be recreated when you install this plugin.
3. Upload this directory to your plugins directory. It will create a 'wp-content/plugins/wp-super-cache/' directory.
4. If you are using WordPress MU you will need to install this in 'wp-content/mu-plugins/wp-super-cache/' and the file wp-cache.php must be copied into the mu-plugins directory.
5. WordPress users should go to their Plugins page and activate "WP Super Cache".
6. Now go to Options->WP Super Cache and enable caching. If you see an error message or a blank screen you may need to fix it. See the "FAQ" section later in this readme for instructions.
7. mod_rewrite rules will be inserted into your .htaccess file. Look in your web root directory for this file. It should look similar to this:

	`-----------------.htaccess-----------------`
	`RewriteEngine On`
	`RewriteBase /`
	
	`RewriteCond %{REQUEST_METHOD} !=POST`
	`RewriteCond %{QUERY_STRING} !.*s=.*`
	`RewriteCond %{QUERY_STRING} !.*p=.*`
	`RewriteCond %{QUERY_STRING} !.*attachment_id=.*`
	`RewriteCond %{QUERY_STRING} !.*wp-subscription-manager=.*`
	`RewriteCond %{HTTP_COOKIE} !^.*(comment_author_|wordpress|wp-postpass_).*$`
	`RewriteCond %{HTTP:Accept-Encoding} gzip`
	`RewriteCond %{DOCUMENT_ROOT}/wp-content/cache/supercache/%{HTTP_HOST}/$1/index.html.gz -f`
	`RewriteRule ^(.*) /wp-content/cache/supercache/%{HTTP_HOST}/$1/index.html.gz [L]`
	
	`RewriteCond %{REQUEST_METHOD} !=POST`
	`RewriteCond %{QUERY_STRING} !.*s=.*`
	`RewriteCond %{QUERY_STRING} !.*p=.*`
	`RewriteCond %{QUERY_STRING} !.*wp-subscription-manager=.*`
	`RewriteCond %{QUERY_STRING} !.*attachment_id=.*`
	`RewriteCond %{HTTP_COOKIE} !^.*(comment_author_|wordpress|wp-postpass_).*$`
	`RewriteCond %{DOCUMENT_ROOT}/wp-content/cache/supercache/%{HTTP_HOST}/$1/index.html -f`
	`RewriteRule ^(.*) /wp-content/cache/supercache/%{HTTP_HOST}/$1/index.html [L]`
	
	`RewriteCond %{REQUEST_FILENAME} !-f`
	`RewriteCond %{REQUEST_FILENAME} !-d`
	`RewriteRule . /index.php [L]`
	`-----------------.htaccess-----------------`
8. After you have enabled the plugin, look for the file "wp-content/cache/.htaccess". If it's not there you must create it. It should read:

	`AddEncoding x-gzip .gz`
	`AddType text/html .gz`

== Frequently Asked Questions ==

= Why is WP-Super-Cache better than WP-Cache? =

This plugin is based on the excellent WP-Cache plugin and therefore brings all the benefits of that plugin to WordPress. On top of that it creates copies of every page that is accessed on a blog in a form that is quickly served by the web server. It's almost as quick as if the you had saved a page in your browser and uploaded it to replace your homepage.

= Will comments and other dynamic parts of my blog update immediately? =

Comments will show as soon as they are moderated, depending on the comment policy of the blog owner. Other dynamic elements on a page may not update unless they are written in Javascript, Flash, Java or another client side browser language. The plugin really produces static html pages. No PHP is executed when those pages are served. "Popularity Contest" is one such plugin that will not work.

= Why are there two expiry times? =

WP Super Cache stores it's cached files in a different way to WP Cache that lets it work better even when there are very many cached files. That is why the Super Cache expiry time is so much longer by default. If your site starts to slow down and there are too many cached files reduce these times and change the garbage collection number too.

= Will the Super Cache compression slow down my server? =

No, it will do the opposite in fact. Super Cache files are compressed and stored that way so the heavy compression is done only once. These files are generally much smaller and are sent to a visitor's browser much more quickly than uncompressed html. As a result, your server spends less time talking over the network which saves CPU time and bandwidth, and can also serve the next request much more quickly.

= How do I uninstall WP Super Cache? =

1. Clear the cache in the backend page and then deactivate it on the plugins page.
2. Remove the Super Cache mod_rewrite rules from your .htaccess file.
3. Remove the WP_CACHE define from wp-config.php
4. Remove the files wp-content/advanced-cache.php and wp-content/wp-cache-config.php
5. Remove the directory wp-content/cache/
6. Remove the directory wp-super-cache from your plugins directory.

= Troubleshooting =

If things don't work when you installed the plugin here are a few things to check:

1.  Is wp-content writable by the web server?
2.  Is there a wp-content/wp-cache-config.php ? If not, copy the file wp-super-cache/wp-cache-config-sample.php to wp-content/wp-cache-config.php and make sure WPCACHEHOME points at the right place. "plugins" should be "mu-plugins" if you're using WordPress MU.
3.  Is there a wp-content/advanced-cache.php ? If not, then you must symlink wp-super-cache/wp-cache-phase1.php to it with this command while in the wp-content folder. 

    `ln -s plugins/wp-super-cache/wp-cache-phase1.php advanced-cache.php`
If you can't do that, then copy the file. That will work too.
4.  If pages are not cached at all, remove wp-content/advanced-cache.php and recreate it, following the advice above.
5.  Make sure the following line is in wp-config.php and it is ABOVE the "require_once(ABSPATH.'wp-settings.php');" line:

    `define( 'WP_CACHE', true );`
6.  Try the Options->WP Super Cache page again and enable cache.
7.  Look in wp-content/cache/supercache/. Are there directories and files there?
8.  Anything in your php error_log?
9.  If your browser keeps asking you to save the file after the super cache is installed you must disable Super Cache compression. Go to the Options->WP Super Cache page and disable it there.
10.  The plugin does not work very well when PHP's safe mode is active. This must be disabled by your administrator.
11. If pages are randomly super cached and sometimes not, your blog can probably be viewed with and without the "www" prefix on the URL. You should choose one way and install the [Enforce www preference](http://txfx.net/code/wordpress/enforce-www-preference/) plugin.
12. Private Server users at Dreamhost should edit wp-content/wp-cache-config.php and set the cache dir to "/tmp/" if they are getting errors about increasing CPU usage. See this [discussion](http://wordpress.org/support/topic/145895?replies=42) for more.
13. sem_acquire() errors such as "failed to acquire key 0x152b: Permission denied in..." are a sign that you must use file locking. Edit wp-content/wp-cache-config.php and uncomment "$use_flock = true" or  set $sem_id to a different value.

== Custom Caching ==
It is now possible to hook into the caching process using the add_cacheacton() function.

Three hooks are available:

1. 'wp_cache_get_cookies_values' - modify the key used by WP Cache.
2. 'add_cacheaction' - runs in phase2. Allows a plugin to add WordPress hooks.
3. 'cache_admin_page' - runs in the admin page. Use it to modify that page, perhaps by adding new configuration options.

There is one regular WordPress filter too. Use the "do_createsupercache" filter 
to customize the checks made before caching. The filter accepts one parameter. 
The output of WP-Cache's wp_cache_get_cookies_values() function.

See plugins/searchengine.php as an example I use for my [No Adverts for Friends](plugin at http://ocaoimh.ie/no-adverts-for-friends/)

== Updates ==
Updates to the plugin will be posted here, to [Holy Shmoly!](http://ocaoimh.ie/) and the [WP Super Cache homepage](http://ocaoimh.ie/wp-super-cache/) will always link to the newest version.

== Thanks ==
I would sincerely like to thank [John Pozadzides](http://onemansblog.com/) for giving me the idea for this, for writing the "How it works" section and for testing the plugin through 2 front page appearances on digg.com

Thanks to James Farmer and Andrew Billits of [Edu Blogs](http://edublogs.org/) fame who helped me make this more WordPress MU friendly.
