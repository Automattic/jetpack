<?php
/**
 * Action Hooks for the Jetpack Search package.
 *
 * The Search Abilities API surface is intentionally NOT auto-wired here.
 *
 * Composer's `autoload.files` runs this for every consumer of the package
 * (the standalone `plugins/search` plugin and `plugins/jetpack`). Registering
 * abilities from here would expose them wherever the package loads, before
 * the rollout is ready. Instead, registration is wired from the Jetpack
 * plugin's Search module file (`projects/plugins/jetpack/modules/search.php`),
 * so the abilities only load inside the Jetpack plugin and only while the
 * Jetpack Search module is active — mirroring the Monitor module precedent.
 *
 * @package automattic/jetpack-search
 */
