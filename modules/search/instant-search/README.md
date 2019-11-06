# Jetpack Instant Search

The **Jetpack Instant Search"** module currently consists of a JavaScript app built on **Preact**. In its current form, it enhances WordPress Search pages by presenting search results while the user is still typing.

Eventually, we expect this module to enhance all front-end views that enable the user to quickly jump into a full-page search experience.

## Why Preact?

Given that we load this module's assets on every page load, we were concerned by the large bundle sizes for both React and `@wordpress/element` (35.6kB gzipped and 61kB gzipped, respectively). We ultimately decided on using Preact, which features a significantly smaller bundle footprint (4.7kB) and full API compatibility with React.

## Testing Instructions

Add define( "JETPACK_SEARCH_PROTOTYPE", true ); to your wp-config.php. If using Jetpack's Docker development environment, you can create a file at /docker/mu-plugins/instant-search.php and add the define there.

Ensure that your site has the Jetpack Pro plan and Jetpack Search enabled. You can enable Jetpack Search in the Performance tab within the Jetpack menu (/wp-admin/admin.php?page=jetpack#/performance).

Select a theme of your choice and add a Jetpack Search widget to the site via the customizer. If using a theme with a sidebar widget area, please add the Jetpack Search widget there.

If using a theme with a sidebar widget, you can navigate to / to start the search experience. Otherwise, navigate to your search page (e.g. /?s=hello).