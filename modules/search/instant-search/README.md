# Jetpack Instant Search

The **Jetpack Instant Search"** module currently consists of a JavaScript app built on **Preact**. In its current form, it enhances WordPress Search pages by presenting search results while the user is still typing.

Eventually, we expect this module to enhance all front-end views that enable the user to quickly jump into a full-page search experience.

## Why Preact?

Given that we load this module's assets on every page load, we were concerned by the large bundle sizes for both React and `@wordpress/element` (35.6kB gzipped and 61kB gzipped, respectively). We ultimately decided on using Preact, which features a significantly smaller bundle footprint (4.7kB) and full API compatibility with React.
