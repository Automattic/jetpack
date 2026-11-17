# Channels

A channel is how an announcement finds the pages that show it. A registrant publishes to channels, a host subscribes to channels, and the package matches the two. [How Jetpack Announcements works](architecture.md) has the whole picture.

![Three announcements, three channels and two hosts. The first announcement is published to plugin-a, the second to plugin-a and jetpack, and the third to plugin-b. Host A subscribes to plugin-a and jetpack and shows the first two. Host B subscribes to plugin-b and jetpack and shows the last two. An announcement is shown when one of its channels is one the host subscribes to. A channel is a label: nothing registers it, and the package gives it no meaning.](diagrams/channels.svg)

## A channel is a label

A channel is a lowercase name, such as `my-plugin`. Nothing registers it: it exists once a registrant publishes to it, and it is shown once a host subscribes to it.

The package knows no channel name and gives none a meaning. Which channels exist, and what each one is for, is a convention between the consumers.

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

Each name goes through `sanitize_key()`, and duplicates are dropped. An announcement left without a channel is refused.

### To more than one channel

List them all. It stays one announcement, whatever the number of channels.

```php
'channels' => array( 'my-plugin', 'jetpack' ),
```

## Subscribing to channels

A host names its channels when it mounts the surface.

```ts
const { mountWhatsNew } = await import( '@automattic/jetpack-announcements' );

mountWhatsNew( { channels: [ 'my-plugin' ] } );
```

### To more than one channel

List them all.

```ts
mountWhatsNew( { channels: [ 'my-plugin', 'jetpack' ] } );
```

The surface puts the announcements of every channel in one list, newest first, and teases the newest one the user has not seen, whichever channel it came through.

### Changing them later

A later call replaces the channels of the surface.

```ts
mountWhatsNew( { channels: [ 'my-plugin', 'jetpack', 'another-plugin' ] } );
```

## How they match

A host shows an announcement when at least one of its channels is one the host subscribes to.

| The announcement is published to | The host subscribes to      | Shown |
| -------------------------------- | --------------------------- | ----- |
| `my-plugin`                      | `my-plugin`                 | Yes   |
| `my-plugin`, `jetpack`           | `another-plugin`, `jetpack` | Yes   |
| `my-plugin`                      | `another-plugin`, `jetpack` | No    |

An announcement that reaches a host through two channels is shown once.

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
// The page of one plugin.
mountWhatsNew( { channels: [ 'my-plugin', 'jetpack' ] } );

// The page of another.
mountWhatsNew( { channels: [ 'another-plugin', 'jetpack' ] } );
```

`jetpack` is an example. The package reserves no name, so a shared channel is a convention the consumers define and keep.

## Seen across channels

What a user has seen is kept per announcement, not per channel or per host. An announcement closed in one host is not teased in another one that shows it, on the same site.

## The API

| Side             | Where                                            | Value                                    |
| ---------------- | ------------------------------------------------ | ---------------------------------------- |
| Registrant, PHP  | `channels` argument of `register_announcement()` | A list of names, at least one            |
| Host, JavaScript | `channels` option of `mountWhatsNew()`           | A list of names                          |
| REST             | `channels` field of a record                     | The names the announcement was left with |

## What a channel is not

### Not a permission

Any registrant can publish to any channel, and a host shows whatever its channels carry. To limit who reads an announcement, give it a `capability`.

### Not a filter by product

A channel says where an announcement is shown, not who wrote it. The id of the announcement, `vendor/slug`, names its owner.
