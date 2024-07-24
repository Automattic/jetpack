# `require_lib()` for "fun" and profit

WordPress.com has `require_lib()`, which used to be transmogrified to `jetpack_require_lib()` in Jetpack. Some things we bring over from dotcom may still be using `require_lib()`, so `wpcomsh` includes an implementation.

Any library that's in Jetpack should have a stub here requiring the file from `JETPACK__PLUGIN_DIR . '_inc/lib/'`. Any library not in Jetpack can instead be copied into this directory.
