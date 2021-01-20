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
	 * @param string   $current_plugin The current plugin we're checking.
	 * @param string[] $plugins        The active plugins to check for autoloaders in.
	 *
	 * @return bool True if we should stop initialization, otherwise false.
	 */
	public function should_stop_init( $current_plugin, $plugins ) {
		global $jetpack_autoloader_including_latest;
		global $jetpack_autoloader_latest_version;

		// When we're being included from an older autoloader we need to
		// reset the latest version so that the new autoloader can look
		// for the latest autoloader again.
		if ( $jetpack_autoloader_including_latest ) {
			$jetpack_autoloader_latest_version = null;
		}

		// We need to reset the autoloader when the plugins change because
		// that means the autoloader was generated with a different list.
		if ( $this->plugins_handler->have_plugins_changed( $plugins ) ) {
			$this->autoloader_handler->reset_autoloader();
		}

		// Don't bother initializing the autoloader if it already has been.
		if ( isset( $jetpack_autoloader_latest_version ) ) {
			return true;
		}

		$latest_plugin = $this->autoloader_locator->find_latest_autoloader( $plugins, $jetpack_autoloader_latest_version );
		if ( isset( $latest_plugin ) && $latest_plugin !== $current_plugin ) {
			$jetpack_autoloader_including_latest = true;
			require $this->autoloader_locator->get_autoloader_path( $latest_plugin );
			$jetpack_autoloader_including_latest = false;
			return true;
		}

		return false;
	}
}
