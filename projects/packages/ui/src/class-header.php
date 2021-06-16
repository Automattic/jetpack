<?php
/**
 * Header class.
 *
 * @package jetpack-ui
 */

namespace Automattic\Jetpack\UI;

use Automattic\Jetpack\Assets\Logo;

/**
 * Create and Render the Jetpack Header
 */
class Header {

	/**
	 * Build and render the jetpack page Header
	 *
	 * @return string
	 */
	public function render() {
		$jetpack_admin_url = admin_url( 'admin.php?page=jetpack' );

		$logo = new Logo();
		/**
		 * Sets the Logo.
		 *
		 * @since 9.9.0
		 *
		 * @package ui
		 *
		 * @param object $logo Logo object.
		 */
		$logo = apply_filters( 'jetpack_ui_header_logo', $logo );
		ob_start();
		?>
		<div class="jetpack-admin-page__header">
			<div class="jetpack-admin-page__container">
				<div class="jetpack-admin-page__logo">
					<a class="jetpack-admin-page__logo-link" href="<?php echo esc_url( $jetpack_admin_url ); ?>">
						<?php
						echo wp_kses( $logo->render(), $logo->kses_svg_tags() );
						?>
					</a>
				</div>
				<!-- TODO: ADD NAVIGATION -->
			</div>
		</div>
		<?php
		return ob_get_clean();
	}
}
