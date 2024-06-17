<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName,Squiz.Commenting.FileComment.Missing
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
function footercredits_register( $wp_customize ) {
	// only provide option to certain theme / site types

	if ( ! apply_filters( 'wpcom_better_footer_credit_apply', true ) ) {
		return;
	}

	/**
	 * Footer Credit Customizer Class.
	 */
	class WP_Customize_Footercredit_Select extends WP_Customize_Control {
		/**
		 * Control type.
		 *
		 * @var string
		 */
		public $type = 'footercredit_select';

		/**
		 * Enqueue scripts and styles.
		 */
		public function enqueue() { // phpcs:ignore MediaWiki.Usage.NestedFunctions.NestedFunction
			if ( ! apply_filters( 'wpcom_better_footer_credit_can_customize', true ) ) {
				wp_enqueue_script( 'footercredit-control', plugins_url( 'js/control.js', __FILE__ ), array( 'jquery' ), WPCOMSH_VERSION, true );
				wp_enqueue_style( 'footercredit-control-styles', plugins_url( 'css/control.css', __FILE__ ), array(), WPCOMSH_VERSION );
			}
		}

		/**
		 * Render Footer Credits settings in Customizer.
		 */
		public function render_content() { // phpcs:ignore MediaWiki.Usage.NestedFunctions.NestedFunction
			?>
			<label>
				<?php if ( ! empty( $this->label ) ) : ?>
					<span class="customize-control-title"><?php echo esc_html( $this->label ); ?></span>
					<?php
				endif;
				if ( ! empty( $this->description ) ) :
					?>
					<span class="description customize-control-description"><?php echo esc_html( $this->description ); ?></span>
				<?php endif; ?>
				<select <?php $this->link(); ?>>
					<?php
					echo '<option value="default"' . selected( $this->value(), 'default', false ) . '>' . esc_html__( 'Default', 'wpcomsh' ) . '</option>';
					?>
					<option value="disabled" disabled></option>
					<?php
					foreach ( $this->choices as $value => $label ) {
						echo '<option value="' . esc_attr( $value ) . '"' . selected( $this->value(), $value, false ) . '>' . esc_html( $label ) . '</option>';
					}
					?>
					<option value="disabled" disabled></option>
					<?php
					if ( apply_filters( 'wpcom_better_footer_credit_can_customize', true ) ) {
						echo '<option value="hidden"' . selected( $this->value(), 'hidden', false ) . '>' . esc_html__( 'Hide', 'wpcomsh' ) . '</option>';
					} else {
						echo '<option value="hidden-upgrade"' . selected( $this->value(), 'hidden-upgrade', false ) . '>' . esc_html__( 'Hide (Business Plan Required)', 'wpcomsh' ) . '</option>';
					}
					?>
				</select>
				<?php
				if ( ! apply_filters( 'wpcom_better_footer_credit_can_customize', true ) ) {
					$planlink = 'https://wordpress.com/plans/' . untrailingslashit( str_replace( array( 'https://', 'http://' ), '', site_url( '/' ) ) );
					?>
					<a href="<?php echo esc_url( $planlink ); ?>" class="footercredit-upgrade-link" style="display: none;"><span class="dashicons dashicons-star-filled"></span> <?php esc_html_e( 'Upgrade to Business', 'wpcomsh' ); ?></a>
					<?php
				}
				?>
			</label>
			<?php
		}
	}

	$wp_customize->add_setting(
		'footercredit',
		array(
			'default'           => 'default',
			'type'              => 'option',
			'sanitize_callback' => 'footercredits_sanitize_setting',
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
function footercredits_sanitize_setting( $val ) {
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

// Setup the Theme Customizer settings and controls...
add_action( 'customize_register', 'footercredits_register', 99 );
