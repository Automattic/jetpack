# Jetpack Announcements

A product-agnostic channel to tell Jetpack users what is new.

A product is a registrant, which publishes announcements, a host, which shows them, or both. The package knows neither.

## Registering an announcement

Hook the registration action and call the helper there. The action fires once, the first time the announcements are read after `init`.

```php
add_action(
	'jetpack_register_announcements',
	static function () {
		if ( ! function_exists( '\Automattic\Jetpack\Announcements\register_announcement' ) ) {
			return;
		}

		\Automattic\Jetpack\Announcements\register_announcement(
			'my-plugin/new-reports',
			array(
				'date'     => '2026-11-20',
				'title'    => __( 'New reports', 'my-plugin' ),
				'excerpt'  => __( 'Three new reports are available.', 'my-plugin' ),
				'content'  => '<p>' . esc_html__( 'Open Reports to see them.', 'my-plugin' ) . '</p>',
				'channels' => array( 'my-plugin' ),
			)
		);
	}
);
```

`date`, `title` and `channels` are required. `excerpt`, `content`, `media`, `link` and `capability` are optional.

A channel is a label. An announcement is published to channels, and a host shows the announcements of the channels it subscribes to.

The registrant translates its own strings. Every value is sanitized at registration, and a duplicate id is refused.

The body keeps the HTML WordPress allows in a post, and loses styles, classes and ids. A URL is kept when it is http or https.

Do no I/O of your own in the action: the read that fires it may be a REST request. To bring announcements from a feed, use the helper below.

## Announcements from a feed

`get_announcements_from_feed()` reads an RSS or Atom feed and returns its items as announcements. The registrant chooses which ones to register, and to which channels.

```php
add_action(
	'jetpack_register_announcements',
	static function () {
		if ( ! function_exists( '\Automattic\Jetpack\Announcements\get_announcements_from_feed' ) ) {
			return;
		}

		$announcements = \Automattic\Jetpack\Announcements\get_announcements_from_feed( 'https://example.com/feed/', 'my-plugin' );

		foreach ( $announcements as $announcement ) {
			if ( in_array( 'Reports', $announcement['categories'], true ) ) {
				\Automattic\Jetpack\Announcements\register_announcement(
					$announcement['id'],
					$announcement['args'] + array( 'channels' => array( 'my-plugin' ) )
				);
			}
		}
	}
);
```

Each entry has the `id` of the announcement, its `args` and the `categories` of the item.

The `args` carry a date, a title, an excerpt, a link and an image, as plain text and URLs. The HTML of the item is never kept.

The `categories` are the labels the feed gives the item. A feed lists categories and tags together, by name.

The feed is read with WordPress's `fetch_feed()`, which keeps it for 12 hours. A feed that fails is left alone for an hour, and the call returns nothing meanwhile.

How old an item may be is the registrant's choice as well. A third argument leaves the older ones out:

```php
get_announcements_from_feed( 'https://example.com/feed/', 'my-plugin', array( 'max_age' => 90 * DAY_IN_SECONDS ) );
```

A feed that takes arguments in its URL can do the choosing itself. A `query` asks it with them. On a WordPress site, `category_name` and `tag` ask for the posts of a category and of a tag, which the labels of an item cannot tell apart:

```php
get_announcements_from_feed(
	'https://example.com/feed/',
	'my-plugin',
	array(
		'query' => array(
			'category_name' => 'news',
			'tag'           => 'reports',
		),
	)
);
```

## Showing the surface

The surface is "What's new": a teaser of the newest announcement the user has not seen, and a dialog that shows it in full. It ships as one script module, `packages/whats-new`, registered as `@automattic/jetpack-announcements`.

A host mounts it from its own JavaScript, with the channels it subscribes to. The [`@automattic/jetpack-announcements` js-package](../../js-packages/announcements/README.md) holds the contract and explains the build setup.

```ts
const { mountWhatsNew } = await import( '@automattic/jetpack-announcements' );

mountWhatsNew( { channels: [ 'my-plugin' ] } );
```

The call returns the function that takes the surface off the page. A page has one surface: a later mount takes it over.

The module reads WordPress scripts from their globals, core-data among them, and does not enqueue them. A wp-build page provides them all.

The teaser shows one announcement at a time, and never an older one once the newest is seen. Opening or dismissing it marks it as seen.

What a user has seen is kept in their WordPress preferences, so every host on the site shares it.

## REST routes

| Route                                             | Method | Purpose                                     |
| ------------------------------------------------- | ------ | ------------------------------------------- |
| `/wpcom/v2/jetpack-announcements`                 | `GET`  | The announcements the current user may see. |
| `/wpcom/v2/jetpack-announcements/<vendor>/<slug>` | `GET`  | One announcement.                           |

Both routes require a logged-in user. An announcement that names a `capability` is left out for users without it.

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Jetpack Announcements is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
