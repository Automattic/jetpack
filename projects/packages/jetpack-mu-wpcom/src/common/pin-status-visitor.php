<?php
/**
 * Resolve Status\Visitor before plugins can supply their own copy.
 *
 * Plugins outside the monorepo bundle jetpack-status too. One that registers its
 * copy through a plain Composer autoloader never joins the version comparison,
 * and Composer prepends, so it answers first and an older class wins site-wide.
 *
 * Resolving the class here — at mu-plugin time, before any plugin is loaded —
 * lets the Jetpack autoloader pick the newest copy it knows about. PHP then has
 * the class, so a copy loaded later cannot replace it.
 *
 * Remove once the call sites tolerate an older copy on their own.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

class_exists( \Automattic\Jetpack\Status\Visitor::class );
