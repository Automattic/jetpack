# Jetpack Announcements

What a page imports to show the Jetpack Announcements surface, "What's new".

This package holds the contract only: the types of what a host can import. The [Jetpack Announcements package](../../packages/announcements/README.md) registers the implementation at runtime as the `@automattic/jetpack-announcements` script module, so a host never bundles it and every host on the page shares one copy.

## Using it

Depend on the package, `workspace:*` inside the Jetpack monorepo:

```json
"@automattic/jetpack-announcements": "workspace:*"
```

Mount the surface from the host's own JavaScript, with the channels it subscribes to:

```ts
const { mountWhatsNew } = await import( '@automattic/jetpack-announcements' );

mountWhatsNew( { channels: [ 'my-plugin' ] } );
```

A dynamic import keeps the surface out of the host's critical path.

The call returns the function that takes the surface off the page, for a host that leaves it without a page load. A page has one surface: a later mount takes it over, and the function of an earlier one does nothing from then on.

With wp-build, add the `automattic` scope to `wpPlugin.externalNamespaces`. wp-build finds the package installed, sees it declared as a script module (`wpScriptModuleExports`), and leaves the import external; the page import map resolves it to the module the Jetpack Announcements package registers.

The host's build then names that module as a dependency. WordPress does not print a script module with a dependency that is not registered, so the PHP package that requires this one also requires `automattic/jetpack-announcements`.
