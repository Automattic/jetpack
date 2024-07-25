<?php
/**
 * CSS_Nudge_Customize_Control file.
 * CSS Nudge implementation for Atomic and WPCOM.
 *
 * @deprecated 13.7 Use Automattic\Jetpack\Masterbar\CSS_Nudge_Customize_Control instead.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use Automattic\Jetpack\Masterbar\CSS_Nudge_Customize_Control as Masterbar_CSS_Nudge_Customize_Control;

/**
 * Class CSS_Nudge_Customize_Control
 *
 * @package Automattic\Jetpack\Dashboard_Customizations
 */
class CSS_Nudge_Customize_Control extends Masterbar_CSS_Nudge_Customize_Control {
	/**
	 * Render the nudge on the page.
	 *
	 * @deprecated 13.7
	 */
	public function render_content() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\CSS_Nudge_Customize_Control::render_content' );
		parent::render_content();
	}
}
