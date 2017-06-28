## 5.1

### Comment Likes

This version introduces the ability to show appreciation for those particularly clever comments on your posts! To enable them, you can go to the Jetpack settings, Discussion tab, and click the corresponding toggle in Comments settings card.
Make sure comments can be liked and unliked, that like counts are correct, and that there are no PHP or JS warnings or errors.
Also verify that you can properly disable Comment Likes with no side effects.

### Masterbar

- There’s a new menu item in this release: “View Site”. Click on “My Sites” and the “View Site” menu should appear at the top. If you click it, it should launch the front end of your site.
- Again in “My Sites” menu, make sure there are no strange characters next to the small “Add” buttons.
- Test the WP Admin of your site on mobile. Make sure there’s a hamburger icon to access all WP Admin screens.

### Miscellaneous enhancements

- The Flickr widget now automatically displays images in a grid if there’s enough room.
- E-mail sharing is now disabled by default unless it’s explicitly enabled by a filter or Akismet is active.

### Fixes

- Prevent the caching of the EU Cookie Law Banner cookie. To test:
    - add the EU Cookie Law Banner widget
    - visit a page where the widget is displayed and click the “Close and accept” button
    - reload the page. Make sure the widget doesn’t show up again.
- Don’t freeze UI if VaultPress can’t be reached (either due to not being registered or connection error). To test: set the plan of your Jetpack site to Free, activate VaultPress, go to the Jetpack dashboard and settings.
- in Calypso, activate Dyad 2. Go to WP Admin, add a widget that hasn’t been added before. Go back to Calypso, activate Lodestar. Visit the front end or WP Admin. There should not be PHP notices originated in the file class.jetpack-sync-module-themes.php.
