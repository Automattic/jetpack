# Stats

A package that can be consumed by standalone plugins and an API that they can use.

## How to consume Stats package

### Install the right packages

First, let's make sure that the `automattic/jetpack-stats` package is set up in your composer.json file:

At minimum you need three things. One is the `automattic/jetpack-autoloader` package, which will ensure that you're not colliding with any other plugins on the site that may be including the same packages. Two, of course, is the `automattic/jetpack-stats` package. Third is our `automattic/jetpack-config` package that will be your tool for initializing the packages.

### Initialize the package

Second, we must initialize ("configure") the `jetpack-stats` package within your plugin, and provide the information about it.

This is where the `jetpack-config` and `jetpack-autoload` packages come into play. Do this, and you're ready to start consuming the Jetpack connection!

```php
use Automattic\Jetpack\Config;

require_once plugin_dir_path( __FILE__ ) . '/vendor/autoload_packages.php';

function jpcs_load_plugin() {

	// Here we enable the Jetpack packages.
	$config = new Config();
	$config->ensure( 'stats' );
}

add_action( 'plugins_loaded', 'jpcs_load_plugin', 1 );
```


## Tracking Pixel
Stats Package uses a tracking pixel to send information to WordPress.com. 

This is done by enqueueing a JavaScript file in the footer of the site `https://stats.wp.com/e-202103.js` (the number changes every week but the file remains the same). 
That JavaScript file, in turn, inserts a tracking pixel to the end of the page. For example: `https://pixel.wp.com/g.gif?lots_of_parameters_here`
When that tracking pixel is loaded by the browser, it effectively sends information to WordPress.com about what needs to be logged on.

### Parameters tracked

#### Default parameters
The default parameters being tracked are built with the `Automattic\Jetpack\Stats\TrackingPixel::build_view_data` function.
- **v**: (internal) Used to distinguish self-hosted sites from the ones hosted on WordPress.com. Enum: `ext, wpcom`
- **blog**: The blog ID of the site
- **post**: The id of the post for the site. 0 if it is not a post.
- **tz**: The GMT offset
- **srv**: THe URL of the server.

#### How to extend default parameters
There is a filter that can be used to track more parameters. `stats_array`

```php
add_filter( 'stats_array', 'filter_stats_array_add_custom_stat' );

/**
 * Add custom stat to the stats tracking data.
 *
 * @param  param array $kvs The stats array in key values.
 * @return array
 */
function filter_stats_array_add_custom_stat( $kvs ) {
	$kvs['custom_stat'] = 'my_custom_stat'
	return $kvs;
```
## WPCOM Stats API
The stats package provides an easy to use API that Fetches data from WPCOM.

### Available Methods

Inside `Automattic\Jetpack\Stats\WPCOM_Stats` class you can find the following methods. All of them internally rely on the following method `Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_blog`.

- `get_stats`: Get site's stats
- `get_stats_summary`: Get site's summarized views, visitors, likes and comments.
- `get_top_posts`: Get site's top posts and pages by views.
- `get_video_details`: Get the details of a single video.
- `get_referrers`: Get site's referrers.
- `get_clicks`: Get site's outbound clicks.
- `get_tags`: Get site's views by tags and categories.
- `get_top_authors`: Get site's top authors.
- `get_top_comments`: Get site's top comment authors and most-commented posts.
- `get_video_plays`: Get site's video plays.
- `get_file_downloads`: Get site's file downloads.
- `get_post_views`: Get a post's views.
- `get_views_by_country`: Get site's views by country.
- `get_followers`: Get site's followers.
- `get_comment_followers`: Get site's comment followers.
- `get_publicize_followers`: Get site's publicize follower counts.
- `get_search_terms`: Get search terms used to find the site.
- `get_total_post_views`: Get the total number of views for each post.


## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

stats is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

