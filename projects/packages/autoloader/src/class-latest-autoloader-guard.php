<?php
/* HEADER */ // phpcs:ignore

/**
 * This class ensures that we're only executing the latest autoloader.
 */
class Latest_Autoloader_Guard {

	/**
	 * The Plugins_Handler instance.
	 *
	 * @var Plugins_Handler
	 */
	private $plugins_handler;

	/**
	 * The Autoloader_Handler instance.
	 *
	 * @var Autoloader_Handler
	 */
	private $autoloader_handler;

	/**
	 * The Autoloader_locator instance.
	 *
	 * @var Autoloader_Locator
	 */
	private $autoloader_locator;

	/**
	 * The constructor.
	 *
	 * @param Plugins_Handler    $plugins_handler    The Plugins_Handler instance.
	 * @param Autoloader_Handler $autoloader_handler The Autoloader_Handler instance.
	 * @param Autoloader_Locator $autoloader_locator The Autoloader_Locator instance.
	 */
	public function __construct( $plugins_handler, $autoloader_handler, $autoloader_locator ) {
		$this->plugins_handler    = $plugins_handler;
		$this->autoloader_handler = $autoloader_handler;
		$this->autoloader_locator = $autoloader_locator;
	}

	/**
	 * Indicates whether or not the autoloader should be initialized. Note that this function
	 * has the side-effect of actually loading the latest autoloader in the event that this
	 * is not it.
	 *
	 * @param string   $current_plugin             The current plugin we're checking.
	 * @param string[] $plugins                    The active plugins to check for autoloaders in.
	 * @param bool     $was_included_by_autoloader Indicates whether or not this autoloader was included by another.
	 *
	 * @return bool True if we should stop initialization, otherwise false.
	 */
	public function should_stop_init( $current_plugin, $plugins, $was_included_by_autoloader ) {
		global $jetpack_autoloader_latest_version;

		// We need to reset the autoloader when the plugins change because
		// that means the autoloader was generated with a different list.
		if ( $this->plugins_handler->have_plugins_changed( $plugins ) ) {
			$this->autoloader_handler->reset_autoloader();
		}

		// When the latest autoloader has already been found we don't need to search for it again.
		// We should take care however because this will also trigger if the autoloader has been
		// included by an older one.
		if ( isset( $jetpack_autoloader_latest_version ) && ! $was_included_by_autoloader ) {
			return true;
		}

		$latest_plugin = $this->autoloader_locator->find_latest_autoloader( $plugins, $jetpack_autoloader_latest_version );
		if ( isset( $latest_plugin ) && $latest_plugin !== $current_plugin ) {
			require $this->autoloader_locator->get_autoloader_path( $latest_plugin );
			return true;
		}

		return false;
	}
}
