# Publishing announcements

A registrant is any code with something to tell users: a plugin, a package, a module. This page is its side of the package. [How Jetpack Announcements works](architecture.md) has the whole picture.

![One request, read from top to bottom. Registrants hook the action as plugins load. After init, the first read of the registry fires jetpack_register_announcements, once per request. Each registrant calls register_announcement there. The registry accepts a well-formed record, sanitizes every field, and keeps it for the request. It refuses an id that is not vendor/slug, an id already registered, and a record without a date, a title or a channel, with a _doing_it_wrong notice and a false return. The callback does no I/O, and the current user is known by then, so a registrant can decide per user.](diagrams/registration.svg)

## Requiring the package

Add the package to the `composer.json` of the code that registers.

```json
"automattic/jetpack-announcements": "@dev"
```

## Registering

Hook the registration action and call the helper there.

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

Keep the `function_exists()` guard. Several plugins bundle the package, and an older copy may load first.

The helper returns the record as the registry stored it, or `false` when the registry refused it.

## The record

The id is the first argument of `register_announcement()`. The rest travel in the array.

| Field        | Required | What it is                                              | What the registry does with it                                |
| ------------ | -------- | ------------------------------------------------------- | ------------------------------------------------------------- |
| `id`         | yes      | `vendor/slug`, in lowercase letters, digits and hyphens | Refuses anything else, and a duplicate                        |
| `date`       | yes      | When it was published, starting with `YYYY-MM-DD`       | Reads it as GMT unless it has an offset. Stores ISO 8601, GMT |
| `title`      | yes      | Plain text                                              | `sanitize_text_field()`                                       |
| `channels`   | yes      | The [channels](channels.md) it is published to          | Sanitizes each name, and drops duplicates                     |
| `excerpt`    | no       | Plain text, one or two sentences                        | `sanitize_text_field()`                                       |
| `content`    | no       | The body, as HTML                                       | Keeps what a post allows, without the attributes below        |
| `media`      | no       | `type` (`image` or `video`), `url` and `alt`            | Drops it without a known type and an http or https URL        |
| `link`       | no       | URL of the full article                                 | Keeps an http or https URL                                    |
| `capability` | no       | The capability a user needs to read it                  | Checks it on every read, and never serves it                  |

The body loses the `style`, `class`, `id` and `data-*` attributes, so it cannot restyle wp-admin. A URL inside it is kept when it is http or https.

## Where each field shows

| Field     | In the teaser                         | In the reader                               |
| --------- | ------------------------------------- | ------------------------------------------- |
| `title`   | The heading of the card               | The title of the dialog                     |
| `excerpt` | Under the title                       | Not shown                                   |
| `media`   | An image, as the cover. Never a video | The image, or the video with its controls   |
| `date`    | Not shown                             | Under the title, in the site's date format  |
| `content` | Not shown                             | The body                                    |
| `link`    | Not shown                             | "Read the full article", opens in a new tab |

## When the action fires

The action fires once per request, the first time the announcements are read after `init`. The REST routes are what read them, so it fires in a REST request and never on a page view.

### Hook on every request

A callback added only on admin pages is never heard. Hook the action as the plugin loads, whatever the request.

### Do no I/O

The request that fires the action is waiting for its answer. Read a feed or another site somewhere else, and register what was read.

### The user is known

The current user is set by the time the action fires, so a registrant can decide per user.

## What the registrant decides

### Whether it is news

The package serves every announcement it is given, whatever its date. When something should stop being announced, stop registering it.

The same goes for who it is news to. Premium Analytics, for one, registers nothing older than the user.

```php
$registered = strtotime( wp_get_current_user()->user_registered . ' +0000' );

if ( false !== $registered && strtotime( $date . ' +0000' ) < $registered ) {
	return;
}
```

### Who may read it

An announcement without a `capability` reaches every logged-in user of the site. Name one when it should not.

### Where it goes

Publish to the channel of the page that should show the announcement, or to several. [Channels](channels.md) covers how they match.

### Its words

The registrant translates its own strings, in its own text domain. The package translates only the interface of the surface.

## What the registry refuses

| Refused                                             | Why                                                       |
| --------------------------------------------------- | --------------------------------------------------------- |
| An id that is not `vendor/slug`                     | The id keys the REST route, and its prefix names an owner |
| An id already registered                            | Nothing is replaced or removed                            |
| A record without a valid date, a title or a channel | It could not be ordered, shown, or reach a host           |

Each refusal raises a `_doing_it_wrong()` notice, and the helper returns `false`.
