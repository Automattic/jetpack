<?php

namespace Jetpack\Assets;

class AutoloaderLoader {

	public function load_autoloader() {
		// Load all the packages.
		$jetpack_autoloader = plugin_dir_path( __FILE__ ) . '/vendor/autoload.php';
		if ( is_readable( $jetpack_autoloader ) ) {
			require $jetpack_autoloader;
		} else {
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				error_log(
					sprintf(
						/* translators: Placeholder is a link to a support document. */
						__( 'Your installation of Jetpack is incomplete. If you installed Jetpack from GitHub, please refer to <a href="%1$s" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment.', 'jetpack' ),
						esc_url( 'https://github.com/Automattic/jetpack/blob/master/docs/development-environment.md' )
					)
				);
			}
			add_action( 'admin_notices', array( $this, 'jetpack_admin_missing_autoloader' ) );
			return;
		}
	}

	/**
	 * Outputs an admin notice for folks running Jetpack without having run composer install.
	 *
	 * @since 7.4.0
	 */
	public function jetpack_admin_missing_autoloader() { ?>
		<div class="notice notice-error is-dismissible">
			<p>
				<?php
				printf(
					/* translators: Placeholder is a link to a support document. */
					__( 'Your installation of Jetpack is incomplete. If you installed Jetpack from GitHub, please refer to <a href="%1$s" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment.', 'jetpack' ),
					esc_url( 'https://github.com/Automattic/jetpack/blob/master/docs/development-environment.md' )
				);
				?>
			</p>
			</p>
		</div>
		<?php
	}
}
