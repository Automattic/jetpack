# Widget Visibility editor controls

[Widget Visibility](http://jetpack.com/support/widget-visibility) was first built to interact with widgets, in a WordPress world where the block editor didn't exist.
In WordPress 5.8, it became possible to [use a block-based editor to manage widgets on your WordPress site](https://wordpress.org/news/2021/08/widgets-in-wordpress-5-8-and-beyond/).

This means that we can now develop a new interface to manage widget visibility settings from the block editor. This directory allows us to build that interface.

## Build (& Watch)

This feature will be built via `pnpm run build-widget-visibility`, which is invoked in `jetpack build plugins/jetpack`.
