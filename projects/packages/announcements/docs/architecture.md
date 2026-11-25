# How Jetpack Announcements works

Jetpack Announcements carries an announcement from the code that publishes it to the page that shows it, and remembers what each user has seen.

Any Jetpack product can use it. The package takes no side on what is worth announcing.

![Three roles and two interfaces. The registrant owns the content: it decides what is news, where it is published, who may read it, and whether to register it at all, and it registers on the jetpack_register_announcements action. The host owns the page: it decides which channels it shows, when the surface mounts, when it leaves the page, and what the page provides, and it mounts the surface through the @automattic/jetpack-announcements module. The package sits between them and decides nothing about relevance: it sanitizes and stores the records, serves them over REST, and renders the teaser and the reader, which keep what a user has seen in that user's WordPress preferences, the same for every consumer.](diagrams/roles.svg)

## Three roles

A **registrant** is the code that publishes announcements. It owns the content.

A **host** is the page that shows them. It owns the page.

The **package** sits between the two. It holds the records, serves them, and renders the surface, "What's new": a teaser and a reader.

A product can be a registrant, a host, or both, and the package knows none of them. Premium Analytics is both.

## Who decides what

| Decision                                        | Owner      | How                                                    |
| ----------------------------------------------- | ---------- | ------------------------------------------------------ |
| What is announced, and in which words           | Registrant | The record it passes to `register_announcement()`      |
| Whether it is news at all                       | Registrant | It registers the announcement, or it does not          |
| Who may read it                                 | Registrant | A `capability`, which the package enforces             |
| Where it is published                           | Registrant | The `channels` of the record                           |
| Which channels a page shows                     | Host       | The `channels` it passes to `mountWhatsNew()`          |
| When the surface appears, and when it leaves    | Host       | The call, and the function the call returns            |
| Whether what users do is recorded               | Host       | A call to `trackWhatsNew()`                            |
| Whether the teaser shows at all                 | User       | A switch, which a host offers with `useTeaserSwitch()` |
| What a record is, and that it is safe to render | Package    | Sanitized once, at registration                        |
| How the teaser and the reader look and behave   | Package    | The surface, the same in every host                    |

[Channels](channels.md) covers how a registrant and a host meet.

## The life of an announcement

![An announcement moves through five stages. In PHP, once per request, a registrant passes an array to register_announcement and the registry sanitizes it or refuses it. Over REST, the record is served to a user who may read it, without its capability. In the browser, the surface reads the records through a core-data entity, keeps the ones of the host's channels, and teases the newest one the user has not seen. Opening or dismissing the teaser marks it as seen in the user's WordPress preferences, which every host on the site reads.](diagrams/announcement-flow.svg)

### Registered

A registrant hooks `jetpack_register_announcements` and calls `register_announcement()`. The registry sanitizes every field once and refuses a malformed record.

The action fires once per request, the first time the announcements are read. [Publishing announcements](registrants.md) covers this side.

### Served

Two REST routes serve the records to the current user. Each record is the registered announcement, without its `capability`.

A record that names a `capability` is left out for a user without it. The routes require a logged-in user.

### Shown

A host mounts the surface with the channels it subscribes to. The surface reads the records through a core-data entity, keeps the ones of those channels, and teases the newest one the user has not seen.

One request serves every channel, and the channels are filtered in the browser. [Hosting What's new](hosts.md) covers this side.

### Seen

Opening or dismissing the teaser marks the announcement as seen. A teaser closed in one host does not come back in another on the same site.

## Where the state lives

| State                                | Where                                               | Scope                                 |
| ------------------------------------ | --------------------------------------------------- | ------------------------------------- |
| The announcements                    | The registry, filled by registrants on each request | The request. Nothing is stored        |
| What a user has seen, and when       | The user's WordPress preferences                    | The user and the site, for every host |
| The switch that turns the teaser off | The user's WordPress preferences                    | The user and the site, for every host |

The package adds no table and no option of its own.

## The public API

| Side       | API                                                                                                    | Who uses it |
| ---------- | ------------------------------------------------------------------------------------------------------ | ----------- |
| PHP        | The `jetpack_register_announcements` action and `register_announcement()`                              | Registrants |
| JavaScript | `mountWhatsNew()`, `useTeaserSwitch()` and `trackWhatsNew()`, from `@automattic/jetpack-announcements` | Hosts       |
| REST       | `GET /wpcom/v2/jetpack-announcements` and `GET /wpcom/v2/jetpack-announcements/<vendor>/<slug>`        | The surface |

Everything else is internal: the classes under `src/`, the preferences the surface writes, the entity it registers, and its components.

## What the package does not do

| It does not                                                                    | So                                                                       |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Judge relevance: no age limit, no pause between teasers, no rule for new users | A registrant registers what is news to the current user, and only that   |
| Protect a channel: any registrant can publish to any channel                   | A `capability` limits who reads an announcement                          |
| Fetch content                                                                  | A registrant that reads a feed does it outside the registration action   |
| Push, email, or count in a badge                                               | An announcement waits until the user opens a page that hosts the surface |
| Record what users do by itself                                                 | A host that wants the events in Tracks calls `trackWhatsNew()`           |
| Run outside wp-admin                                                           | The module of the surface is registered on `admin_init`                  |
