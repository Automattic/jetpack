<?php
/**
 * A logo for Jetpack.
 *
 * @package jetpack-logo
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
		$logo = apply_filters( 'jetpack-admin-page-header-logo', $logo );
		ob_start();
		?>
		<div class="jetpack-admin-page__header">
			<div class="jetpack-admin-page__container">
				<div class="jetpack-admin-page__logo">
					<a class="jetpack-admin-page__logo-link" href="<?php echo esc_url( $jetpack_admin_url ); ?>">
						<?php
						echo $logo->render();
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
