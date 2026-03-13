<?php
/**
 * Helper class for the Jetpack Testimonial Textarea Control.
 *
 * @package automattic/jetpack-classic-theme-helper
 */

namespace Automattic\Jetpack\Classic_Theme_Helper;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

if ( ! class_exists( __NAMESPACE__ . '\Jetpack_Testimonial_Textarea_Control' ) ) {
	/**
	 * Extends the WP_Customize_Control class to clean the textarea content.
	 */
	class Jetpack_Testimonial_Textarea_Control extends \WP_Customize_Control {
		/**
		 * Control type.
		 *
		 * @var string
		 */
		public $type = 'textarea';

		/**
		 * Render the control's content.
		 */
		public function render_content() {
			?>
			<label>
				<span class="customize-control-title"><?php echo esc_html( $this->label ); ?></span>
				<textarea rows="5" style="width:100%;" <?php $this->link(); ?>><?php echo esc_textarea( $this->value() ); ?></textarea>
			</label>
			<?php
		}

		/**
		 * Sanitize content passed to control.
		 *
		 * @param string $value Control value.
		 * @return string Sanitized value.
		 */
		public static function sanitize_content( $value ) {
			if ( ! empty( $value ) ) {
				$value = apply_filters( 'the_content', $value );
			}
			$value = preg_replace( '@<div id="jp-post-flair"([^>]+)?>(.+)?</div>@is', '', $value );
			return $value;
		}
	}
}
