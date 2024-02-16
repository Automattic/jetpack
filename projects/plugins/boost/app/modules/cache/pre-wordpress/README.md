### Pre_WordPress namespace

Everything in this directory / namespace contains code which can execute before WordPress is fully
initialized. It can be called from `advanced-cache.php`, but it can also be called directly from
the main Boost code-base.

Nothing in the `Pre_WordPress` namespace may rely on autolaoding to load things; you must include
an explicit `require_once` instruction in the entrypoint file `Boost_Cache.php`. It also must not rely on any WordPress functionality that is
unavailable at the time that `advanced-cache.php` is executed.

You can use this code from elsewhere in Boost, and you can autoload it from outside this namespace, though.
