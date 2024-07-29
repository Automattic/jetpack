<?php
/**
 * Footer Credit Customizer Control.
 *
 * @package wpcomsh
 */

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
