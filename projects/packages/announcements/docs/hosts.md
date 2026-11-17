# Hosting What's new

A host is a page that shows announcements. It mounts the surface and decides when; the surface does the rest. This page is the host's side of the package. [How Jetpack Announcements works](architecture.md) has the whole picture.

![The host imports mountWhatsNew from its own JavaScript and calls it with its channels. The page provides what the surface needs: the import map that resolves the import to the module the PHP package registered, the WordPress scripts the surface reads from their globals, and #wpbody, the box the surface hangs from. The surface, one per page, teases the newest unseen announcement of those channels and marks it seen when it is opened or dismissed, the same in every host. The call returns the function that unmounts the surface. A later mount takes the surface over, and the function of an earlier one then does nothing.](diagrams/host-mount.svg)

## Mounting

```ts
const { mountWhatsNew } = await import( '@automattic/jetpack-announcements' );

const unmount = mountWhatsNew( { channels: [ 'my-plugin' ] } );
```

The surface then shows the announcements published to those channels. A dynamic import keeps it out of the host's first render.

## What the page provides

The surface is one script module, registered by the PHP package under the name `@automattic/jetpack-announcements`. A host never bundles it, so every host shares one copy.

Three things make the import resolve.

### The contract, kept external

The host's build depends on the contract package, `@automattic/jetpack-announcements`, and leaves the import external. With wp-build that means adding the `automattic` scope to `wpPlugin.externalNamespaces`.

The [contract package](../../../js-packages/announcements/README.md) has the build setup in full.

### The PHP requirement

The PHP package of the host requires `automattic/jetpack-announcements`. WordPress does not print a script module whose dependency is not registered.

### A wp-admin page with the WordPress scripts

The surface reads the WordPress scripts from their globals, core-data among them, and does not enqueue them. A wp-build page loads them all.

## One surface per page

The first call creates the surface and hangs it from `#wpbody`. It also loads the translations of the surface and registers the entity it reads.

A later call does not create a second surface. It takes the first one over, with its own channels.

## Leaving the page

`mountWhatsNew()` returns the function that takes the surface off the page. A host that goes away without a page load calls it then.

```ts
const unmount = mountWhatsNew( { channels: [ 'my-plugin' ] } );

// Later, when the page of the host goes away.
unmount();
```

The function acts only while its mount still owns the surface. Once a later mount has taken over, it does nothing.

## What is yours to decide

### Which channels

The host shows the channels it names. Nothing else filters: whatever a registrant publishes to them is shown.

### When to mount

The package has no switch, so the call is the switch. A host mounts behind its own feature flag, after its own onboarding, or not at all for a user who opted out in its own settings.

Premium Analytics mounts from its init module, and only while its flag is on.

### When to leave

A host that lasts the whole page load never needs to. A host inside an application that swaps pages without a load does.

## What the surface does on its own

The teaser shows one announcement: the newest of the host's channels, while the user has not seen it. An older one is never teased once the newest is seen.

Opening the teaser shows the announcement in a dialog, the reader. Opening or dismissing it marks the announcement as seen.

The teaser sits at the bottom inline-start corner of `#wpbody`. A host does not place it, style it, or change its rule.
