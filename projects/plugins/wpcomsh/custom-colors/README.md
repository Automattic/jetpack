# Custom Colors

This feature allows the ability to set a custom color scheme from the Customizer for the site's theme, such as background, text, and link colors. It also provides colors for custom backgrounds, if the theme support custom backgrounds.

## Supported themes

Custom Colors only works with themes that support the feature, including

- Varia and its many child themes, like Hever (which used to be the default theme for new WP.com sites).
- wpcom versions of some Core themes, such as Twenty Ten.

A theme that supports Custom Colors should have the file `inc/wpcom-colors.php`.

## Workflow

Custom Colors is a feature for both Simple sites (if the site has a plan and includes the feature), and Atomic sites.

The Atomic version of the code is a fork of the Simple site code.

- Simple sites, wpcom repo: `wp-content/mu-plugins/colors/`
- Atomic sites, wpcomsh repo: `custom-colors/`

Be sure to update both versions of the code!

### History

The Custom Colors code used to live [at its own repo](https://github.com/Automattic/custom-colors), and be copied into both wpcom and wpcomsh when updated. But since we now use 552-gh-Automattic/wpcomsh, that repo has been deprecated, and updates should be made directly to wpcom _and_ wpcomsh.

## Resources

[WP.com support page for Custom Colors](https://wordpress.com/support/custom-colors/)

PCYsg-2jp-p2

PCYsg-cBK-p2
