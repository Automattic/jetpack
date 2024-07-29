<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName,Squiz.Commenting.FileComment.Missing

require_once __DIR__ . '/class-wp-customize-footercredit-select.php';

/**
 * Footer Credit Customizer.
 */
class FooterCreditCustomizer {
	/**
	 * This hooks into 'customize_register' (available as of WP 3.4) and allows
	 * you to add new sections and controls to the Theme Customize screen.
	 *
	 * Note: To enable instant preview, we have to actually write a bit of custom
	 * javascript. See live_preview() for more.
	 *
	 * @see add_action('customize_register',$func)
	 * @link http://ottopress.com/2012/how-to-leverage-the-theme-customizer-in-your-own-themes/
	 * @since FooterCredit 0.1
	 *
	 * @param WP_Customize_Manager $wp_customize Customizer instance.
	 */
	public static function register( $wp_customize ) {
		// only provide option to certain theme / site types

		if ( ! apply_filters( 'wpcom_better_footer_credit_apply', true ) ) {
			return;
		}

		$wp_customize->add_setting(
			'footercredit',
			array(
				'default'           => 'default',
				'type'              => 'option',
				'sanitize_callback' => array( __CLASS__, 'sanitize_setting' ),
			)
		);

		$wp_customize->add_control(
			new WP_Customize_Footercredit_Select(
				$wp_customize,
				'footercredit',
				array(
					'label'    => __( 'Footer Credit', 'wpcomsh' ),
					'section'  => 'title_tagline',
					'priority' => 99,
					'settings' => 'footercredit',
					'type'     => 'select',
					'choices'  => footercredit_options(),
				)
			)
		);
	}

	/**
	 * Sanitize footer credit setting value.
	 *
	 * @param string $val Setting value.
	 *
	 * @return string|false String if a valid setting value, false elsewise.
	 */
	public static function sanitize_setting( $val ) {
		if ( $val === 'default' ) {
			return $val;
		} elseif ( $val === 'hidden' || $val === 'hidden-upgrade' ) {
			// protect against attempts to hide the credit for non business (WPCOM_BUSINESS_BUNDLE) users
			if ( ! apply_filters( 'wpcom_better_footer_credit_can_customize', true ) ) {
				$val = 'default';
			}

			return $val;
		} elseif ( array_key_exists( $val, footercredit_options() ) ) {
			return $val;
		} else {
			return false;
		}
	}

	/**
	 * Setup the Footer Credit customizer settings and controls for classic themes only.
	 * We don't support the footer credit on block themes, see https://wp.me/paYJgx-51l.
	 */
	public static function init() {
		if ( ! wp_is_block_theme() ) {
			add_action( 'customize_register', array( __CLASS__, 'register' ), 99 );
		}
	}
}

FooterCreditCustomizer::init();
