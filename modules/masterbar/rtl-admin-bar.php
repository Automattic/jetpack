<?php

if ( ! class_exists( 'WP_Admin_Bar' ) ) {
	require_once ABSPATH . '/wp-includes/class-wp-admin-bar.php';
}

/**
 * We are using this class to replace core WP_Admin_Bar in cases when
 * we need to override the default styles with rtl ones. This is
 * achieved by adding 'rtl' class to #wpadminbar div. Apart from that
 * the output of render method should be the same as the one of base class.
 */
class RTL_Admin_Bar extends WP_Admin_Bar {
	function render() {
		global $is_IE;
		$root = $this->_bind();

		// Add browser and RTL classes.
		// We have to do this here since admin bar shows on the front end.
		$class = 'nojq nojs rtl';
		if ( $is_IE ) {
			if ( strpos( $_SERVER['HTTP_USER_AGENT'], 'MSIE 7' ) ) {
				$class .= ' ie7';
			} elseif ( strpos( $_SERVER['HTTP_USER_AGENT'], 'MSIE 8' ) ) {
				$class .= ' ie8';
			} elseif ( strpos( $_SERVER['HTTP_USER_AGENT'], 'MSIE 9' ) ) {
				$class .= ' ie9';
			}
		} elseif ( wp_is_mobile() ) {
			$class .= ' mobile';
		}

		?>
		<div id="wpadminbar" class="<?php echo $class; ?>">
			<?php if ( ! is_admin() ) : ?>
				<a class="screen-reader-shortcut" href="#wp-toolbar" tabindex="1"><?php _e( 'Skip to toolbar', 'jetpack' ); ?></a>
			<?php endif; ?>
			<div class="quicklinks" id="wp-toolbar" role="navigation" aria-label="<?php esc_attr_e( 'Toolbar', 'jetpack' ); ?>" tabindex="0">
				<?php
				foreach ( $root->children as $group ) :
					$this->_render_group( $group );
				endforeach;
				?>
			</div>
			<?php if ( is_user_logged_in() ) : ?>
				<a class="screen-reader-shortcut" href="<?php echo esc_url( wp_logout_url() ); ?>"><?php _e( 'Log Out', 'jetpack' ); ?></a>
			<?php endif; ?>
		</div>

		<?php
	}
}
