## 4.2

### General

- wWe've completely refactored the way information was synchronized between your site and WordPress.com, thus ensuring every module uses information that's up to date. As a result, every module communicating with WordPress.com should be tested. Information should match the settings on your site, and no warnings, errors, or notices should be displayed when using any of the modules.

### Theme Tools

- We made some improvements to the Tonesque library included in Jetpack and used in some themes and plugins. To test the Tonesque library, you can try installing the [Color Posts](https://wordpress.org/plugins/color-posts/) plugin, and make sure it always returns an average color, even when using files which claim to be one filetype, but are actually another - for example, `banner.jpg` which is actually a `png`.
