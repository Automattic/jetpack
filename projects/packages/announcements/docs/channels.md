# Channels

A channel is how an announcement finds the pages that show it. A registrant publishes to channels, a host subscribes to channels, and the package matches the two. [How Jetpack Announcements works](architecture.md) has the whole picture.

![Three announcements, three channels and two hosts. The first announcement is published to plugin-a, the second to plugin-a and jetpack, and the third to plugin-b. Host A subscribes to plugin-a and jetpack and shows the first two. Host B subscribes to plugin-b and jetpack and shows the last two. An announcement is shown when one of its channels is one the host subscribes to. A channel is a label: nothing registers it, and the package gives it no meaning.](diagrams/channels.svg)

## A channel is a name

A channel is a name, such as `my-plugin` or `my-plugin/settings`. Nothing registers it: it exists once a registrant publishes to it, and it is shown once a host subscribes to it.

A name is made of keys separated by `/`. A key takes lowercase letters, digits, `-` and `_`. Uppercase letters are lowered, and anything else is removed.

The package knows no channel and gives none a meaning. Which channels exist, and what each one is for, is a convention between the consumers.

## Publishing to channels

`channels` is a required argument of `register_announcement()`: a list with at least one name.

```php
\Automattic\Jetpack\Announcements\register_announcement(
	'my-plugin/new-reports',
	array(
		'date'     => '2026-11-20',
		'title'    => __( 'New reports', 'my-plugin' ),
		'channels' => array( 'my-plugin' ),
	)
);
```

To publish to several, list them all. It stays one announcement.

```php
'channels' => array( 'my-plugin', 'jetpack' ),
```

## Subscribing to channels

A host names its channels when it mounts the surface, one or several.

```ts
const { mountWhatsNew } = await import( '@automattic/jetpack-announcements' );

mountWhatsNew( { channels: [ 'my-plugin', 'jetpack' ] } );
```

The surface puts the announcements of every channel in one list, newest first, and teases the newest one while the user has not seen it. An older one is never teased in its place.

A later call replaces the channels of the surface.

## How they match

A host shows an announcement when one of its channels is one the host subscribes to.

| The announcement is published to | The host subscribes to      | Shown |
| -------------------------------- | --------------------------- | ----- |
| `my-plugin`                      | `my-plugin`                 | Yes   |
| `my-plugin`, `jetpack`           | `another-plugin`, `jetpack` | Yes   |
| `my-plugin`                      | `another-plugin`, `jetpack` | No    |
| `my-plugin/settings`             | `my-plugin`                 | No    |

Names match whole. The slash is part of the name, so `my-plugin` and `my-plugin/settings` are two channels.

An announcement that reaches a host through two channels is shown once.

## Channels by page

A host with several pages can show an announcement on one page only. Each page subscribes to the channel of the product and to a channel of its own.

| Page      | Subscribes to                      |
| --------- | ---------------------------------- |
| Dashboard | `my-plugin`, `my-plugin/dashboard` |
| Settings  | `my-plugin`, `my-plugin/settings`  |

The registrant then chooses the page by the channel.

| Published to          | Shows on           |
| --------------------- | ------------------ |
| `my-plugin`           | Every page         |
| `my-plugin/dashboard` | The dashboard only |
| `my-plugin/settings`  | Settings only      |

The host calls `mountWhatsNew()` again when the page changes, with the channels of the new page.

Premium Analytics names its channels this way, from the route of each page: [its convention](https://github.com/Automattic/jetpack/blob/trunk/projects/packages/premium-analytics/docs/whats-new-channels.md).

## A shared channel

Consumers can agree on a channel that several hosts subscribe to. `jetpack`, for one, could carry what every Jetpack page should tell.

A registrant then chooses, announcement by announcement, what goes to it.

```php
// For the page of the plugin only.
'channels' => array( 'my-plugin' ),

// For every page that subscribes to the shared channel too.
'channels' => array( 'my-plugin', 'jetpack' ),
```

And each host chooses whether to subscribe to it, next to its own.

```ts
mountWhatsNew( { channels: [ 'my-plugin', 'jetpack' ] } );
```

`jetpack` is an example. The package reserves no name.

## Seen across channels

What a user has seen is kept per announcement, not per channel or per host. An announcement closed in one host is not teased in another one that shows it, on the same site.

## What a channel is not

### Not a permission

Any registrant can publish to any channel, and a host shows whatever its channels carry. To limit who reads an announcement, give it a `capability`.

### Not the owner

A channel says where an announcement is shown, not who wrote it. The id of the announcement, `vendor/slug`, names its owner.
