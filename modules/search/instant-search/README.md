# Jetpack Instant Search

The **Jetpack Instant Search"** module currently consists of a JavaScript app built on **Preact**. In its current form, it enhances WordPress Search pages by presenting search results while the user is still typing.

Eventually, we expect this module to enhance all front-end views that enable the user to quickly jump into a full-page search experience.

## Development

### High-level overview of the development flow

1. Use the [Jetpack Docker environment](https://github.com/Automattic/jetpack/tree/master/docker#readme).
1. Start a new branch.
1. Modify/Improve the code in the instant-search directories. New libs get added to the common package.json.
1. Run `yarn build-search [--watch]` to compile your changes.
1. Now test your changes on the front end of your test site.
1. Open a PR, and a WordPress.com diff will be automatically generated with your changes.
1. Test the WordPress.com diff
1. Once the code works well in both environments and has been approved by a Jetpack crew member, you can merge your branch!

### Testing Instructions

Add define( "JETPACK_SEARCH_PROTOTYPE", true ); to your wp-config.php. If using Jetpack's Docker development environment, you can create a file at /docker/mu-plugins/instant-search.php and add the define there.

Ensure that your site has the Jetpack Pro plan and Jetpack Search enabled. You can enable Jetpack Search in the Performance tab within the Jetpack menu (/wp-admin/admin.php?page=jetpack#/performance).

Select a theme of your choice and add a Jetpack Search widget to the site via the customizer. If using a theme with a sidebar widget area, please add the Jetpack Search widget there.

If using a theme with a sidebar widget, you can navigate to / to start the search experience. Otherwise, navigate to your search page (e.g. /?s=hello).

## Architectural Choices

### Why Preact?

Given that we load this module's assets on every page load, we were concerned by the large bundle sizes for both React and `@wordpress/element` (35.6kB gzipped and 61kB gzipped, respectively). We ultimately decided on using Preact, which features a significantly smaller bundle footprint (4.7kB) and full API compatibility with React.

### Why to never send requests to the main site

Search needs to be fast for the end user. It is almost always faster to go to the WP.com API rather than hitting the Jetpack site for search results.
