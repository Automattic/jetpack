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

| Field        | Required | What it is                                              | What the package does with it                |
| ------------ | -------- | ------------------------------------------------------- | -------------------------------------------- |
| `id`         | yes      | `vendor/slug`, in lowercase letters, digits and hyphens | Refuses anything else, and a duplicate       |
| `date`       | yes      | When it was published. GMT unless it carries an offset  | Stores it as ISO 8601, GMT                   |
| `title`      | yes      | Plain text                                              | `sanitize_text_field()`                      |
| `channels`   | yes      | The labels it is published to                           | `sanitize_key()` on each, duplicates dropped |
| `excerpt`    | no       | Plain text, one or two sentences                        | `sanitize_text_field()`                      |
| `content`    | no       | The body, as HTML                                       | `wp_kses_post()`                             |
| `media`      | no       | `type` (`image` or `video`), `url` and `alt`            | Drops an unknown type or an empty URL        |
| `link`       | no       | URL of the full article                                 | `esc_url_raw()`                              |
| `capability` | no       | Who may read it                                         | Checks it on every read, and never serves it |

The id is the first argument of `register_announcement()`. The rest travel in the array.

## When the action fires

The action fires once per request, the first time something reads the registry after `init`. In practice that reader is the REST route the surface calls.

Three things follow from that.

### Hook early

A callback added after that first read is not heard in that request. Hook the action as the plugin loads.

### Do no I/O

The request that fires the action is waiting for its answer. Read a feed or another site somewhere else, and register what was read.

### The user is known

The current user is set by the time the action fires, so a registrant can decide per user.

## What is yours to decide

### Whether it is news

The package serves every announcement it is given, whatever its date. When something should stop being announced, stop registering it.

The same goes for who it is news to. Premium Analytics, for one, registers nothing older than the user.

```php
$registered = strtotime( wp_get_current_user()->user_registered . ' +0000' );

if ( false !== $registered && strtotime( $date ) < $registered ) {
	return;
}
```

That rule is its own. Another registrant may want the opposite, and writes that instead.

### Who may read it

An announcement without a `capability` reaches every logged-in user of the site. Name one when it should not.

### Where it goes

A channel is a label a host subscribes to. Publish to the channel of the page that should show the announcement, or to several.

There is no list of channels to join. A channel no host subscribes to is shown nowhere.

### Its words

The registrant translates its own strings, in its own text domain. The package translates only the interface of the surface.

## What the registry refuses

| Refused                                       | Why                                                       |
| --------------------------------------------- | --------------------------------------------------------- |
| An id that is not `vendor/slug`               | The id keys the REST route, and its prefix names an owner |
| An id already registered                      | The contract is additive: nothing is replaced or removed  |
| A record without a date, a title or a channel | It could not be ordered, shown, or reach a host           |

Each refusal raises a `_doing_it_wrong()` notice, and the helper returns `false`.
