<?php
/**
 * Inline Help.
 *
 * Handles providing a LiveChat icon within WPAdmin until such time
 * as the full live chat experience can be run in a non-Calypso environment.
 *
 * @deprecated $$next-version$$ Use Automattic\Jetpack\Masterbar\Inline_Help instead.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use Automattic\Jetpack\Masterbar\Inline_Help as Masterbar_Inline_Help;

/**
 * Class Inline_Help.
 */
class Inline_Help {
	/**
	 * Instance of \Automattic\Jetpack\Masterbar\Inline_Help
	 * Used for deprecation purposes.
	 *
	 * @var \Automattic\Jetpack\Masterbar\Inline_Help
	 */
	private $inline_help_wrapper;

	/**
	 * Inline_Help constructor.
	 *
	 * @deprecated $$next-version$$
	 */
	public function __construct() {
		$this->inline_help_wrapper = new Masterbar_Inline_Help();
	}

	/**
	 * Registers actions.
	 *
	 * @deprecated $$next-version$$
	 *
	 * @param object $current_screen Current screen object.
	 * @return void
	 */
	public function register_actions( $current_screen ) {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\Inline_Help::register_actions' );
		$this->inline_help_wrapper->register_actions( $current_screen );
	}

	/**
	 * Outputs "FAB" icon markup and SVG.
	 *
	 * @deprecated $$next-version$$
	 *
	 * @return void|string the HTML markup for the FAB or early exit.
	 */
	public function add_fab_icon() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\Inline_Help::add_fab_icon' );
		$this->inline_help_wrapper->add_fab_icon();
	}

	/**
	 * Enqueues FAB CSS styles.
	 *
	 * @deprecated $$next-version$$
	 *
	 * @return void
	 */
	public function add_fab_styles() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\Inline_Help::add_fab_styles' );
		$this->inline_help_wrapper->add_fab_styles();
	}
}
