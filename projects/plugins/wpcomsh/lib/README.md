# `require_lib()` for "fun" and profit

WordPress.com has `require_lib()`, which is transmogrified to `jetpack_require_lib()` in Jetpack. Some things we bring over from dotcom may still be using `require_lib()`, so `wpcomsh` includes a thin wrapper around `jetpack_require_lib()` to leverage it where possible.

At the time of this writing, **for any lib that you want to load that's already in Jetpack**, but `require_lib()` is being called (Hi, Ryu), you need to add to the `$in_jetpack` array inside the `require_lib()` function to whitelist the handoff.

Any library that's not in Jetpack can instead be copied into this directory and `require_lib()` will load from here.