# Coding Standards & Guidelines

These are some things to keep in mind when writing code for Jetpack plugin. Please follow them to speed up the review process and get your code merged faster.

### Versions supported

- Jetpack supports PHP 5.2, so to name two examples, don't use array notation like `[]` or the short ternary like `expr1 ?: expr3`: use always `array()` and the long ternary `expr1 ? expr2: expr3`.
- Jetpack supports the WP current version and the immediate previous version. So if WP version is 4.6, Jetpack will support it, as well as 4.5. It's desirable that when Jetpack is installed in older versions, it doesn't fail in a severe way.
- We support the latest two versions of all major browsers, except IE, where we currently only support 11 and Edge. (see [Browse Happy](http://browsehappy.com) for current latest versions).

### General

- Install PHP Code Sniffer [Code Sniffer rules for WordPress Coding Standards.](https://github.com/WordPress-Coding-Standards/WordPress-Coding-Standards#installation) They will make it easier for you to notice any missing documentation or coding standards you should respect. Most IDEs display warnings and notices inside the editor, making it easy to inspect your code.
- If coding a module, make sure you declare the module in the inline doc, [like this](https://github.com/Automattic/jetpack/blob/16bc2fce3ace760ff402f656dcf05255888f23f4/modules/sitemaps/sitemaps.php#L92-L101). The same applies for filters or actions, [as shown here](https://github.com/Automattic/jetpack/blob/16bc2fce3ace760ff402f656dcf05255888f23f4/modules/sitemaps/sitemaps.php#L143-L151).
- Sanitize URLs, attributes, everything. WordPress.com VIP has this nice [article about the topic](https://vip.wordpress.com/documentation/vip/best-practices/security/validating-sanitizing-escaping/).
- Create [unit tests](https://github.com/Automattic/jetpack/tree/master/tests) if you can. If you're not familiar with Unit Testing, you can check [this tutorial](https://pippinsplugins.com/series/unit-tests-wordpress-plugins/).

### Widgets

- Make them support Customizer's Selective Refresh. Here's an [article about it](https://make.wordpress.org/core/2016/03/22/implementing-selective-refresh-support-for-widgets/).
- Some Widgets ported from WordPress.com must only be registered if Jetpack is connected.
- Add the `jetpack_widget_name` filter to the widget title [as shown here](https://github.com/Automattic/jetpack/blob/447766aa676dfc78822d33af4f73535668eba063/modules/widgets/my-community.php#L37).

### Translations

- Where it applies, make strings available for translation.
- Instead of `__`, `_e`, `_x` and similar functions, use their safe versions `esc_html__`, `esc_html_e`, `esc_html_x` and others where possible.
- Add the `jetpack` text domain to the translation functions.
