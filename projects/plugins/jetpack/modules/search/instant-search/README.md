# Jetpack Instant Search

The **Jetpack Instant Search"** module consists of a JavaScript app built on **Preact**.

It enables the user to quickly jump into a full-page search experience with filtering, sorting and instant results.

## Development

### High-level overview of the development flow

1. Use the [Jetpack Docker environment](https://github.com/Automattic/jetpack/tree/master/docker#readme).
2. Start a new branch.
3. Modify/improve the code in the instant-search directories. New packages should be added to the common package.json.
4. Run `pnpm watch` to compile your changes.
5. Test your changes on the front-end of your test site.
6. Open a PR, and a WordPress.com diff will be automatically generated with your changes.
7. Test the WordPress.com diff.
8. Once the code works well in both environments and has been approved by a Jetpack crew member, you can merge your branch!

### Basic Build Process

```
> npm install pnpm
> npm install node
> pnpm watch
> ls _inc/build/instant-search/
```

### Testing Instructions

1. Ensure that your site has a Jetpack Search plan. You can enable the instant search experience in the Performance tab within the Jetpack menu (/wp-admin/admin.php?page=jetpack#/performance).

2. Select a theme of your choice and add a Jetpack Search widget to the site via the Customizer. If using a theme with a sidebar widget area, please add the Jetpack Search widget there.

3. Add a Jetpack Search Widget to the Jetpack Search Sidebar and configure the filters you'd like to show in the search overlay.

4. Navigate to your site's search page (e.g. `/?s=hello`).
