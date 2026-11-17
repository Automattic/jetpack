# How Jetpack Announcements works

Jetpack Announcements is a channel to tell users what is new. It carries an announcement from the code that publishes it to the page that shows it, and remembers what each user has seen.

It is built to be used by any Jetpack product, and it takes no side on what is worth announcing. This page defines who does what.

![Three roles and two seams. The registrant owns the content: it decides what is news, where it is published, who may read it, and whether to register it at all, and it registers on the jetpack_register_announcements action. The host owns the page: it decides which channels it shows, when the surface mounts, when it leaves the page, and what the page provides, and it mounts the surface through the @automattic/jetpack-announcements module. The package sits between them and decides nothing about relevance: it sanitizes and stores the records, serves them over REST, and renders the teaser and the reader, which keep what a user has seen in that user's WordPress preferences, the same for every consumer.](diagrams/roles-and-seams.svg)

## Three roles

A **registrant** is the code that publishes announcements. It owns the content.

A **host** is the page that shows them. It owns the page.

The **package** sits between the two. It holds the records, serves them, and renders the surface, "What's new": a teaser and a reader.

A product can be a registrant, a host, or both, and the package knows none of them. Premium Analytics is the first of each.

## Who decides what

| Decision                                        | Owner      | How                                                      |
| ----------------------------------------------- | ---------- | -------------------------------------------------------- |
| What is announced, and in which words           | Registrant | The record it passes to `register_announcement()`        |
| Whether it is news at all                       | Registrant | It registers the announcement, or it does not            |
| Who may read it                                 | Registrant | A `capability`, which the package enforces               |
| Where it is published                           | Registrant | The `channels` of the record                             |
| Which channels a page shows                     | Host       | The `channels` it passes to `mountWhatsNew()`            |
| When the surface appears, and when it leaves    | Host       | The call, and the function the call returns              |
| What a record is, and that it is safe to render | Package    | Sanitized once, at registration                          |
| Where what a user has seen is kept              | Package    | The user's WordPress preferences, written by the surface |
| How the teaser and the reader look and behave   | Package    | The surface, the same in every host                      |

[Channels](channels.md) covers how the two consumers meet: publishing to channels, subscribing to them, and sharing one.

## The rule behind the table

The package takes a responsibility only when it must hold for every consumer and no consumer can enforce it alone. The shape of a record and its safety are of that kind.

A question of relevance is never of that kind. How old an announcement may be, whether a user who arrived yesterday should hear about last year's feature, how often a page should tease: each has a different answer in each product, so each belongs to a consumer.

The package therefore serves what it is given. An announcement about something five years old is carried like any other, because publishing it was the registrant's decision.

`capability` shows the split at work. The registrant declares who may read an announcement, and the package enforces it on every read.

## Tools for consumers

The package may also ship tools that make a consumer's side easier. A tool does not move a decision: it helps a registrant or a host do its own part, and the part stays theirs.

A tool earns its place only when nothing in WordPress core, Gutenberg or another package already does the job. Fetching a feed is `fetch_feed()`, and checking a value against a schema is `rest_validate_value_from_schema()`, so the package wraps neither.

What is left for it is the step only it knows, such as turning an item of a feed into the arguments of an announcement. None ships yet.

## The life of an announcement

![An announcement moves through five stages. In PHP, once per request, a registrant passes an array to register_announcement and the registry sanitizes it or refuses it. Over REST, the record is served to a user who may read it, without its capability. In the browser, the surface reads the records through a core-data entity, keeps the ones of the host's channels, and teases the newest one the user has not seen. Opening or dismissing the teaser marks it as seen in the user's WordPress preferences, which every host on the site reads.](diagrams/announcement-flow.svg)

### Registered

A registrant hooks `jetpack_register_announcements` and calls `register_announcement()`. The registry sanitizes every field once and refuses a malformed record.

The registry holds content only, the same for every user. [Publishing announcements](registrants.md) covers this side.

### Served

Two REST routes serve the records to the current user. Each record is the registered announcement, minus its `capability`.

A record that names a `capability` is left out for a user without it. The routes require a logged-in user.

### Shown

A host mounts the surface with the channels it subscribes to. The surface reads the records through a core-data entity, keeps the ones of those channels, and teases the newest one the user has not seen.

Every host on a page shares one request, and the channels are filtered in the browser. [Hosting What's new](hosts.md) covers this side.

### Seen

Opening or dismissing the teaser marks the announcement as seen. The surface keeps that, with its date, in the user's WordPress preferences.

It uses one scope and one key for every host, so a teaser closed in one host does not come back in another on the same site. The package stores nothing about users.

## The public API

| Seam       | API                                                                                             | Who uses it |
| ---------- | ----------------------------------------------------------------------------------------------- | ----------- |
| PHP        | The `jetpack_register_announcements` action and `register_announcement()`                       | Registrants |
| JavaScript | `mountWhatsNew()`, from `@automattic/jetpack-announcements`                                     | Hosts       |
| REST       | `GET /wpcom/v2/jetpack-announcements` and `GET /wpcom/v2/jetpack-announcements/<vendor>/<slug>` | The surface |

Everything else is internal and changes without notice: the classes under `src/`, the preference the surface writes, the entity the surface registers, and its components.

## What it is not

### Not a relevance filter

The package has no age limit, no pause between teasers, and no rule about new users. A consumer that wants one writes it on its own side.

### Not access control for channels

A channel is a label, not a permission. Any registrant can publish to any channel, and a host shows what its channels carry.

### Not a content source

The package never fetches. A registrant that wants announcements from a feed or from another site reads them itself, outside the registration action, and registers the result.

### Not a notification system

Nothing is pushed, emailed, or counted in a badge. An announcement waits until the user opens a page that hosts the surface.

### Not available outside wp-admin

The script module of the surface is registered on `admin_init`, and its teaser is placed against `#wpbody`.
