<?php
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
*/
function footercredits_register( $wp_customize ) {
	// only provide option to certain theme / site types

    if ( ! apply_filters( 'wpcom_better_footer_credit_apply', true ) ) {
		return;
	}

	class WP_Customize_Footercredit_Select extends WP_Customize_Control {
		public $type = 'footercredit_select';

		public function enqueue() {
			if ( ! apply_filters( 'wpcom_better_footer_credit_can_customize', true ) ) {
				wp_enqueue_script( 'footercredit-control', plugins_url( 'js/control.js', __FILE__ ), array( 'jquery' ), false, true );
				wp_enqueue_style( 'footercredit-control-styles', plugins_url( 'css/control.css', __FILE__ ), array() );
			}
		}

		public function render_content() {
			?>
			<label>
				<?php if ( ! empty( $this->label ) ) : ?>
					<span class="customize-control-title"><?php echo esc_html( $this->label ); ?></span>
				<?php endif;
				if ( ! empty( $this->description ) ) : ?>
					<span class="description customize-control-description"><?php echo $this->description; ?></span>
				<?php endif; ?>
				<select <?php $this->link(); ?>>
					<?php
					echo '<option value="default"' . selected( $this->value(), 'default', false ) . '>' . __( 'Default' ) . '</option>';
					?>
					<option value="disabled" disabled></option>
					<?php
					foreach ( $this->choices as $value => $label ) {
						echo '<option value="' . esc_attr( $value ) . '"' . selected( $this->value(), $value, false ) . '>' . $label . '</option>';
					}
					?>
					<option value="disabled" disabled></option>
					<?php
					if ( apply_filters( 'wpcom_better_footer_credit_can_customize', true ) ) {
						echo '<option value="hidden"' . selected( $this->value(), 'hidden', false ) . '>' . __( 'Hide' ) . '</option>';
					} else {
						echo '<option value="hidden-upgrade"' . selected( $this->value(), 'hidden-upgrade', false ) . '>' . __( 'Hide (Business Plan Required)' ) . '</option>';
					}
					?>
				</select>
				<?php
				if ( ! apply_filters( 'wpcom_better_footer_credit_can_customize', true ) ) {
					$planlink = 'https://wordpress.com/plans/' . untrailingslashit( str_replace( array('https://', 'http://' ), '', site_url( '/' ) ) );
					?>
					<a href="<?php echo esc_url( $planlink ); ?>" class="footercredit-upgrade-link" style="display: none;"><span class="dashicons dashicons-star-filled"></span> <?php _e( 'Upgrade to Business' ); ?></a>
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
			'default' => 'default',
			'type' => 'option',
			'sanitize_callback' => 'footercredits_sanitize_setting'
		)
	);

	$wp_customize->add_control(
		new WP_Customize_Footercredit_Select(
			$wp_customize,
			'footercredit',
			array(
				'label'         => __( 'Footer Credit' ),
				'section'       => 'title_tagline',
				'priority'		=> 99,
				'settings'      => 'footercredit',
				'type'          => 'select',
				'choices'       => footercredit_options()
			)
		)
	);
}

function footercredits_sanitize_setting( $val ) {
	if ( $val == 'default' ) {
		return $val;
	} else if ( $val == 'hidden' || $val == 'hidden-upgrade' ) {
		// protect against attempts to hide the credit for non business (WPCOM_BUSINESS_BUNDLE) users
		if ( ! apply_filters( 'wpcom_better_footer_credit_can_customize', true ) ) {
			$val = 'default';
		}
		return $val;
	} else if ( array_key_exists( $val , footercredit_options() ) ) {
		return $val;
	} else {
		return false;
	}
}

// Setup the Theme Customizer settings and controls...
add_action( 'customize_register', 'footercredits_register', 99 );
