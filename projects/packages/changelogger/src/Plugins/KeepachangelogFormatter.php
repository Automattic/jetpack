<?php
/**
 * Keepachangelog formatter plugin.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelogger\Plugins;

use Automattic\Jetpack\Changelog\KeepAChangelogParser;
use Automattic\Jetpack\Changelogger\FormatterPlugin;
use Automattic\Jetpack\Changelogger\PluginTrait;

/**
 * Keepachangelog formatter plugin.
 */
class KeepachangelogFormatter extends KeepAChangelogParser implements FormatterPlugin {
	use PluginTrait;
}
