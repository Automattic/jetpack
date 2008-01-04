=== WP Super Cache ===
Contributors: donncha
Tags: performance,caching,wp-cache
Tested up to: 2.3.1
Stable tag: 0.5.2

A modification of WP-Cache that produces static html files.

== Description ==
This plugin generates static html files from your dynamic WordPress blog.  After a html file is generated your webserver will serve that file instead of processing the comparatively heavier and more expensive WordPress PHP scripts.

However, because a user's details are displayed in the comment form after they leave a comment, the plugin will only serve static html files to:

1. Users who are not logged in.
2. Users who have not left a comment on your blog.
3. Or users who have not viewed a password protected post. 

The good news is that probably more than 99% of your visitors don't do any of the above! Those users who don't see the static files will still benefit because they will see regular WP-Cache cached files and your server won't be as busy as before.  This plugin should help your server cope with a front page appearance on digg.com or other social networking site.

== Installation ==
1. You must have mod mime, mod rewrite and fancy permalinks enabled. PHP safe mode should be disabled.
2. If you have WP-Cache installed already, please disable it. Edit wp-config.php and make sure the WP_CACHE define is deleted, and remove the files wp-content/wp-cache-config.php and wp-content/advanced-cache.php. These will be recreated when you install this plugin.
3. Upload this directory to your plugins directory. It will create a 'wp-content/plugins/wp-super-cache/' directory.
4. If you are using WordPress MU you will need to install this in 'wp-content/mu-plugins/wp-super-cache/' and the file wp-cache.php must be copied into the mu-plugins directory.
5. WordPress users should go to their Plugins page and activate "WP Super Cache".
6. Now go to Options->WP Super Cache and enable caching. If you see an error message or a blank screen you may need to fix it. See the "FAQ" section later in this readme for instructions.
7. mod_rewrite rules will be inserted into your .htaccess file. Look in your web root directory for this file. It should look similar to this:

	-----------------.htaccess-----------------
	RewriteEngine On
	RewriteBase /
	
	RewriteCond %{QUERY_STRING} !.*s=.*
	RewriteCond %{HTTP_COOKIE} !^.*comment_author_.*$
	RewriteCond %{HTTP_COOKIE} !^.*wordpressuser.*$
	RewriteCond %{HTTP_COOKIE} !^.*wp-postpass_.*$
	RewriteCond %{HTTP:Accept-Encoding} gzip
	RewriteCond %{DOCUMENT_ROOT}/wp-content/cache/supercache/%{HTTP_HOST}/$1index.html.gz -f
	RewriteRule ^(.*) /wp-content/cache/supercache/%{HTTP_HOST}/$1index.html.gz [L]
	
	RewriteCond %{QUERY_STRING} !.*s=.*
	RewriteCond %{HTTP_COOKIE} !^.*comment_author_.*$
	RewriteCond %{HTTP_COOKIE} !^.*wordpressuser.*$
	RewriteCond %{HTTP_COOKIE} !^.*wp-postpass_.*$
	RewriteCond %{DOCUMENT_ROOT}/wp-content/cache/supercache/%{HTTP_HOST}/$1index.html -f
	RewriteRule ^(.*) /wp-content/cache/supercache/%{HTTP_HOST}/$1index.html [L]
	
	RewriteCond %{REQUEST_FILENAME} !-f
	RewriteCond %{REQUEST_FILENAME} !-d
	RewriteRule . /index.php [L]
	-----------------.htaccess-----------------
8. After you have enabled the plugin, look for "wp-content/cache/.htaccess". If it's not there you must create it. It should read:
	AddEncoding x-gzip .gz
	AddType text/html .gz

== Frequently Asked Questions ==
If things don't work when you installed the plugin here are a few things to check:

1.  Is wp-content writable by the web server?
2.  Is there a wp-content/wp-cache-config.php ? If not, copy the file wp-super-cache/wp-cache-config-sample.php to wp-content/wp-cache-config.php and make sure WPCACHEHOME points at the right place. "plugins" should be "mu-plugins" if you're using WordPress MU.
3.  Is there a wp-content/advanced-cache.php ? If not, then you must symlink wp-super-cache/wp-cache-phase1.php to it with the command while in the wp-content folder. `ln -s plugins/wp-super-cache/wp-cache-phase1.php advanced-cache.php` If you can't do that, then copy the file. That will work too.
4.  Make sure the following line is in wp-config.php : `define( 'WP_CACHE', true );`
5.  Try the Options->WP Super Cache page again and enable cache.
6.  Look in wp-content/cache/supercache/. Are there directories and files there?
7.  Anything in your php error_log?
8.  If your browser keeps asking you to save the file after the super cache is installed you must disable Super Cache compression. Go to the Options->WP Super Cache page and disable it there.
9.  The plugin does not work very well when PHP's safe mode is active. This must be disabled by your administrator.

== Custom Caching ==
It is now possible to hook into the caching process using the add_cacheacton() function.
Three hooks are available:

1. 'wp_cache_get_cookies_values' - modify the key used by WP Cache.
2. 'add_cacheaction' - runs in phase2. Allows a plugin to add WordPress hooks.
3. 'cache_admin_page' - runs in the admin page. Use it to add modify that page.

There is one regular WordPress filter too. Use the "do_createsupercache" filter 
to customize the checks made before caching. The filter accepts one parameter. 
The output of WP-Cache's wp_cache_get_cookies_values() function.

See plugins/searchengine.php as an example I use for my [No Adverts for Friends](plugin at http://ocaoimh.ie/no-adverts-for-friends/)

== Updates ==
Updates to the plugin will be posted here, to http://ocaoimh.ie/ and the page
http://ocaoimh.ie/wp-super-cache/ will always link to the newest version.

== Thanks ==
I would sincerely like to thank [John Pozadzides](http://onemansblog.com/) for 
giving me the idea for this, for writing the "How it works" section and for
testing the plugin through 2 front page appearances on digg.com
Thanks to James Farmer and Andrew Billits of [Edu Blogs](http://edublogs.org/) fame who helped me
make this more WordPress MU friendly.
