# Jetpack Announcements

What a page imports to show the Jetpack Announcements surface, "What's new".

This package holds the contract only: the types of what a host can import. The [Jetpack Announcements package](../../packages/announcements/README.md) registers the implementation at runtime as the `@automattic/jetpack-announcements` script module, so a host never bundles it and every host on the page shares one copy.

## Setting up the build

Depend on the package, `workspace:*` inside the Jetpack monorepo.

```json
"@automattic/jetpack-announcements": "workspace:*"
```

With wp-build, add the `automattic` scope to `wpPlugin.externalNamespaces`.

```json
"externalNamespaces": {
	"automattic": {
		"global": "automattic",
		"handlePrefix": "automattic"
	}
}
```

wp-build finds the package installed, sees it declared as a script module (`wpScriptModuleExports`), and leaves the import external. The import map of the page resolves it to the module the Jetpack Announcements package registers.

The PHP package of the host requires `automattic/jetpack-announcements`, which registers that module.

## `mountWhatsNew( options )`

Mounts the surface on the page, with the channels the host subscribes to.

```ts
const { mountWhatsNew } = await import( '@automattic/jetpack-announcements' );

const unmount = mountWhatsNew( { channels: [ 'my-plugin' ] } );
```

A dynamic import keeps the surface out of the first render of the page.

The call returns the function that takes the surface off the page, for a host that leaves it without a page load. A page has one surface: a later call takes it over with its own channels, and the function of an earlier one does nothing from then on.

## `useTeaserSwitch()`

A React hook that reads and writes the switch that turns the teaser off for the current user. A host offers it in its own settings.

```tsx
import { useTeaserSwitch } from '@automattic/jetpack-announcements';

function TeaserSetting() {
	const { isOn, setIsOn } = useTeaserSwitch();

	return (
		<input type="checkbox" checked={ isOn } onChange={ event => setIsOn( event.target.checked ) } />
	);
}
```

The switch is one for every host on the site. The hook works with or without the surface mounted.

## More

[Hosting What's new](../../packages/announcements/docs/hosts.md) covers what the page provides, what the surface does on its own, and what a host decides.
