# Determining Connection Status of Jetpack Sites

Occasionally, hosting partners have asked for instructions on how to determine the connection status of a Jetpack site. There are a few ways to do this, some with more accuracy than others. This document will discuss the different strategies and their accuracy.

## Using WP-CLI

The most accurate method for determining connection status would be to use the `wp jetpack status` command.

Here's an example of running the command on a site that is connected to WordPress.com:

```
wp jetpack status
Checking status for http://example.com
Success: Jetpack is currently connected to WordPress.com
The Jetpack Version is 6.4-alpha
The WordPress.com blog_id is XXXXXX
The WordPress.com account for the primary connection is username@example.com

View full status with 'wp jetpack status full'
```

Here's an example of running the command on a site that is NOT connected to WordPress.com:

```
wp jetpack status
Checking status for http://example.com
Error: Jetpack is not currently connected to WordPress.com
```

## Via the WordPress.com API

Another, and less accurate, method of determining connection status is to call the WordPress.com API. This is considered less accurate because there is not a specific status for connected or disconnected. That being said, we are still able to tell fairly reliably whether a site is connected or not.

To test the connection, we can make calls to the `/sites/%s/` endpoint. Making that request will look something like this:

```
curl https://public-api.wordpress.com/rest/v1.1/sites/eric.blog
```

When a site is connected to WordPress.com properly, the response will be something like this:

```
{
  "ID": 67272686,
  "name": "Eric Binnion",
  "description": "Mostly pictures of family with a healthy dose of WordPress",
  "URL": "https://eric.blog",
  "jetpack": true,
  "subscribers_count": 55,
  "icon": {
    "img": "https://i1.wp.com/eric.blog/wp-content/uploads/2015/08/cropped-profile.jpg?fit=512%2C512&strip=all&ssl=1",
    "ico": "https://i1.wp.com/eric.blog/wp-content/uploads/2015/08/cropped-profile.jpg?fit=16%2C16&strip=all&ssl=1"
  },
  "logo": {
    "id": 0,
    "sizes": [],
    "url": ""
  },
  "is_following": false,
  "meta": {
    "links": {
      "self": "https://public-api.wordpress.com/rest/v1.1/sites/67272686",
      "help": "https://public-api.wordpress.com/rest/v1.1/sites/67272686/help",
      "posts": "https://public-api.wordpress.com/rest/v1.1/sites/67272686/posts/",
      "comments": "https://public-api.wordpress.com/rest/v1.1/sites/67272686/comments/",
      "xmlrpc": "https://eric.blog/xmlrpc.php"
    }
  }
}
```

One property that will always be present, and uniform, for connected Jetpack sites will be the `jetpack` property. So, if you decode the response from the API, if the `jetpack` key is present, and if the value is `true`, then the site is properly connected. Here's an example of how to do that in the terminal with `jq`:

```
curl -s https://public-api.wordpress.com/rest/v1.1/sites/eric.blog | jq '.jetpack'
```

There are some cases where this could fail. For example, if the site has disabled the JSON API, then the API response will not contain the `jetpack` key even though the site is connected. In practice, the JSON API is enabled on more than 83.5% of sites, and the JSON API is activated by default for new sites, so this will not occur often.
