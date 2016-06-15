## 4.1

### SSO

- **We've completely redesigned and refactored Jetpack's [SSO Module](https://jetpack.com/support/sso/).** It would be great if you could use the module as much as possible, with different users, in different browsers, and different roles on your site. The additional options mentioned at the bottom of [this page](https://jetpack.com/support/sso/) should still work.

### General

- We cleaned up and restyled jetpack related banner notices to match Core notification styles.

### JSON API

- We updated several API endpoints to match WordPress.com endpoints, with a focus on SAL (Site Abstraction Layer). To test, you can try using several features from the WordPress.com desktop apps or from WordPress.com to manage your Jetpack site, and make sure everything works properly. You should be able to change site settings, publish and update posts and pages, update plugins, customize your theme...

### Publicize

- We've added a new filter, `jetpack_publicize_capability`, allowing you to give Publicize capabilities to more users. You can read more about it [here](https://github.com/Automattic/jetpack/pull/3740).

### Shortcodes

- New Untappd shortcode. To test: Shortcodes enabled, test `[untappd-menu location="65" menu="3355a50d-600d-4956-9491-dd0ac2582053"]`
- Recipes: new shortcodes and options to create more detailed recipes. To test, you can follow the instructions in [this support document](https://en.support.wordpress.com/recipes/).
- VideoPress: use HTML5 videos when using the `freedom` shortcode parameter. To test, try using the `force_flash` and `freedom` parameters when inserting VideoPress shortcodes, and check that the video is displayed according to your settings.

### Support

- We've improved the self-help tools available in the Jetpack Debug menu. To test, you can go to the Jetpack Menu in your dashboard, scroll down, click on "Debug", and make sure there are no errors on the page or in your logs. You should also be able to use the Contact Form to send debug information to the Jetpack Support team.

### Widgets

- We've refactored the Contact Info Widget to improve performance. To test, try adding and editing options of a Contact Info Widget.
