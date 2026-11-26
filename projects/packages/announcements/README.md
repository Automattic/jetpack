# Jetpack Announcements

A channel to tell Jetpack users what is new. A product publishes announcements from PHP, and a page of wp-admin shows them in "What's new": a teaser of the newest one, and a dialog to read it.

## How it works

A **registrant** publishes announcements. It owns the content: what is announced, where, and to whom.

A **host** is a page that shows them. It owns the page: which announcements it shows, and when.

The **package** carries an announcement from one to the other. It sanitizes the records, serves them over REST, renders the surface, and remembers what each user has seen.

Registrants and hosts meet through **channels**. An announcement is published to channels, and a host shows the announcements of the channels it subscribes to.

A product can be a registrant, a host, or both. The package knows none of them.

![Three roles and two interfaces. The registrant owns the content: it decides what is news, where it is published, who may read it, and whether to register it at all, and it registers on the jetpack_register_announcements action. The host owns the page: it decides which channels it shows, when the surface mounts, when it leaves the page, and what the page provides, and it mounts the surface through the @automattic/jetpack-announcements module. The package sits between them and decides nothing about relevance: it sanitizes and stores the records, serves them over REST, and renders the teaser and the reader, which keep what a user has seen in that user's WordPress preferences, the same for every consumer.](docs/diagrams/roles.svg)

## Adding What's new to a product

### 1. Require the package

In the `composer.json` of the product.

```json
"automattic/jetpack-announcements": "@dev"
```

### 2. Publish an announcement

Hook the registration action as the plugin loads, on every request, and register there.

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

`date`, `title` and `channels` are required. [Publishing announcements](docs/registrants.md) has every field and what the registry does with it.

### 3. Show the surface

Depend on the contract package in the `package.json` of the page, and keep it external in the build.

```json
"@automattic/jetpack-announcements": "workspace:*"
```

Then mount the surface from the JavaScript of the page, with the channels it subscribes to.

```ts
const { mountWhatsNew } = await import( '@automattic/jetpack-announcements' );

mountWhatsNew( { channels: [ 'my-plugin' ] } );
```

The teaser of the newest announcement of those channels shows until the user opens or dismisses it. [Hosting What's new](docs/hosts.md) has the build setup and what the page provides.

### 4. Offer the switch

Optional. A user can turn the teaser off, and a host offers that switch in its own settings with `useTeaserSwitch()`.

```tsx
import { useTeaserSwitch } from '@automattic/jetpack-announcements';
import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function TeaserSetting() {
	const { isOn, setIsOn } = useTeaserSwitch();

	return (
		<ToggleControl
			label={ __( 'Show a teaser when there is something new', 'my-plugin' ) }
			checked={ isOn }
			onChange={ setIsOn }
		/>
	);
}
```

### 5. Record what users do

Optional. The surface records nothing by itself, and a host asks for its events in Tracks with `trackWhatsNew()`, once, before it mounts.

```ts
const { mountWhatsNew, trackWhatsNew } = await import( '@automattic/jetpack-announcements' );

trackWhatsNew();
mountWhatsNew( { channels: [ 'my-plugin' ] } );
```

[Hosting What's new](docs/hosts.md) has the events and what recording needs from the page.

## Documentation

| Page                                                    | What it covers                                                       |
| ------------------------------------------------------- | -------------------------------------------------------------------- |
| [How Jetpack Announcements works](docs/architecture.md) | The roles, the life of an announcement, and the public API           |
| [Publishing announcements](docs/registrants.md)         | The registrant's side: the record, the action, its rules             |
| [Hosting What's new](docs/hosts.md)                     | The host's side: the page, mounting, leaving, the switch, the events |
| [Channels](docs/channels.md)                            | Publishing to channels, subscribing to them, channels by page        |

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
