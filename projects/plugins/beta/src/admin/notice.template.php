<?php
/**
 * Jetpack Beta wp-admin page notice.
 *
 * @package automattic/jetpack-beta
 */

use Automattic\JetpackBeta\Utils;

// Check that the file is not accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

global $current_screen;

// -------------

$is_notice = ( 'plugins' === $current_screen->base ? true : false );

?>
		<style type="text/css">
			#jetpack-beta-tester__start {
				background: #FFF;
				padding: 20px;
				margin-top:20px;
				box-shadow: 0 0 0 1px rgba(200, 215, 225, 0.5), 0 1px 2px #e9eff3;
				position: relative;
			}
			#jetpack-beta-tester__start.updated {
				border-left: 3px solid #8CC258;
			}
			#jetpack-beta-tester__start h1 {
				font-weight: 400;
				margin: 0;
				font-size: 20px;
			}
			#jetpack-beta-tester__start p {
				margin-bottom:1em;
			}
		</style>
		<div id="jetpack-beta-tester__start" class="<?php echo ( $is_notice ? 'notice notice-updated' : 'dops-card' ); ?>">
			<h1><?php esc_html_e( 'Welcome to Jetpack Beta Tester', 'jetpack-beta' ); ?></h1>
			<p><?php esc_html_e( 'Thank you for helping to test our plugins!  We appreciate your time and effort.', 'jetpack-beta' ); ?></p>
			<p>
			<?php
			echo wp_kses_post(
				__(
					'When you select a branch to test, Jetpack Beta Tester will install and activate it on your behalf and keep it up to date.
					When you are finished testing, you can switch back to the current version by selecting <em>Latest Stable</em>.',
					'jetpack-beta'
				)
			);
			?>
			</p>
			<p>
			<?php
			echo wp_kses_post(
				__( 'Not sure where to start?  If you select <em>Bleeding Edge</em>, you\'ll get all the cool new features we\'re planning to ship in our next release.', 'jetpack-beta' )
			);
			?>
			</p>
			<?php if ( $is_notice ) { ?>
			<a href="<?php echo esc_url( Utils::admin_url() ); ?>"><?php esc_html_e( 'Let\'s get testing!', 'jetpack-beta' ); ?></a>
			<?php } ?>

		</div>
