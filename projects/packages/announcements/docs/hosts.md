# Hosting What's new

A host is a page that shows announcements. It mounts the surface and decides when, and the surface does the rest.

This page is the host's side of the package. [How Jetpack Announcements works](architecture.md) has the whole picture.

![The host imports mountWhatsNew from its own JavaScript and calls it with its channels. The page provides what the surface needs: the import map that resolves the import to the module the PHP package registered, the WordPress scripts the surface reads from their globals, and #wpbody, the box the surface hangs from. The surface, one per page, teases the newest unseen announcement of those channels and, when it is opened or dismissed, marks it seen in the user's WordPress preferences, the same in every host. The call returns the function that unmounts the surface. A later mount takes the surface over, and the function of an earlier one then does nothing.](diagrams/host-mount.svg)

## What the page provides

The surface is one script module, registered by the PHP package as `@automattic/jetpack-announcements`. A host never bundles it, so every host shares one copy.

### The PHP package

The PHP package of the host requires `automattic/jetpack-announcements`. That is what registers the module, on `admin_init`.

```json
"automattic/jetpack-announcements": "@dev"
```

### The contract package, kept external

The JavaScript of the host depends on the contract package and leaves the import external.

```json
"@automattic/jetpack-announcements": "workspace:*"
```

With wp-build that means adding the `automattic` scope to `wpPlugin.externalNamespaces`.

```json
"externalNamespaces": {
	"automattic": {
		"global": "automattic",
		"handlePrefix": "automattic"
	}
}
```

The import map of the page then resolves the import to the registered module.

### A wp-build page in wp-admin

The module reads React and the WordPress packages from their script globals, and does not enqueue them. A wp-build page loads them all.

The `dependencies` of `build/modules/whats-new/index.min.asset.php` name every one, `wp-core-data`, `wp-preferences` and `wp-theme` among them.

## Mounting

```ts
const { mountWhatsNew } = await import( '@automattic/jetpack-announcements' );

const unmount = mountWhatsNew( { channels: [ 'my-plugin' ] } );
```

The surface then shows the announcements published to those channels. A dynamic import keeps it out of the first render of the page.

## One surface per page

The first call creates the surface and hangs it from `#wpbody`. A later call creates no second surface: it takes the first one over, with its own channels.

A host with several pages uses that to follow the page on screen. It calls `mountWhatsNew()` again with the channels of the new page.

```ts
mountWhatsNew( { channels: [ 'my-plugin', 'my-plugin/settings' ] } );
```

[Channels](channels.md) covers channels by page.

## Leaving the page

`mountWhatsNew()` returns the function that takes the surface off the page. A host that goes away without a page load calls it then.

```ts
const unmount = mountWhatsNew( { channels: [ 'my-plugin' ] } );

// Later, when the page of the host goes away.
unmount();
```

The function acts only while its mount still owns the surface. Once a later mount has taken over, it does nothing.

## The switch

A user can turn the teaser off. The surface has no control for it: a host offers the switch in its own settings, with the `useTeaserSwitch()` hook.

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

The switch is kept in the user's WordPress preferences, for that user on that site. It is one switch for every host: off in one, the teaser is off in all.

The hook works with or without the surface mounted.

## What the surface does

### The teaser

It shows one announcement: the newest of the host's channels, while the user has not seen it. An older one is never teased once the newest is seen.

It sits at the bottom inline-start corner of `#wpbody`. A host does not place it, style it, or change its rule.

### The reader

"Read more" opens the announcement in a dialog, the reader.

### Seen

Opening or dismissing the teaser marks the announcement as seen. That is kept in the user's WordPress preferences, for every host on the site.

### Its language

The package registers the translations of the surface with its module, on WordPress 7.0 or later. On an older WordPress the surface is in English.

## What the host decides

### Which channels

The host shows the channels it names, one or several. Nothing else filters: whatever a registrant publishes to them is shown.

### When to mount

The call is the decision. A host mounts behind its own feature flag, or holds the call while something else asks for the user's attention.

Premium Analytics mounts only while its flag is on, and not in a page load where its onboarding is about to open.

### When to leave

A host that lasts the whole page load never needs to. A host inside an application that changes page without a load does.

## A host to read

Premium Analytics is a registrant and a host.

| What it does                                 | Where                                                                     |
| -------------------------------------------- | ------------------------------------------------------------------------- |
| Registers its announcements, behind its flag | [`src/class-dashboard-announcements.php`][pa-registrant]                  |
| Mounts the surface and follows its pages     | [`packages/init/src/whats-new/whats-new.ts`][pa-mount]                    |
| Offers the switch in its settings            | [`routes/settings/components/whats-new-card/whats-new-card.tsx`][pa-card] |
| Names its channels by page                   | [`docs/whats-new-channels.md`][pa-channels]                               |

[pa-registrant]: https://github.com/Automattic/jetpack/blob/trunk/projects/packages/premium-analytics/src/class-dashboard-announcements.php
[pa-mount]: https://github.com/Automattic/jetpack/blob/trunk/projects/packages/premium-analytics/packages/init/src/whats-new/whats-new.ts
[pa-card]: https://github.com/Automattic/jetpack/blob/trunk/projects/packages/premium-analytics/routes/settings/components/whats-new-card/whats-new-card.tsx
[pa-channels]: https://github.com/Automattic/jetpack/blob/trunk/projects/packages/premium-analytics/docs/whats-new-channels.md
