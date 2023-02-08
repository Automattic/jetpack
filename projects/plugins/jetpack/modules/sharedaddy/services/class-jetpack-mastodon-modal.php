<?php
/**
 * Display a Mastodon modal, where folks can enter a Mastodon instance.
 *
 * @package automattic/jetpack
 */

/**
 * Class Mastodon_Modal
 */
class Jetpack_Mastodon_Modal {
	/**
	 * Decide whether the modal should be displayed.
	 * We want to show it when the user clicks on the Mastodon share button,
	 * thus loading a page with ?share=mastodon&nb=1.
	 *
	 * @return bool
	 */
	public static function should_display_modal() {
		if (
			// phpcs:disable WordPress.Security.NonceVerification.Recommended -- we only check if the query strings exist, we do not use them.
			isset( $_GET['share'] )
			&& 'mastodon' === sanitize_text_field( wp_unslash( $_GET['share'] ) )
			&& isset( $_GET['nb'] )
			&& 1 === (int) $_GET['nb']
			// phpcs:enable
		) {
			return true;
		}

		return false;
	}

	/**
	 * Hook the modal render into WordPress.
	 */
	public static function modal() {
		if ( ! self::should_display_modal() ) {
			return;
		}

		// Render the modal.
		self::render_modal();

		die();
	}

	/**
	 * Render the modal.
	 */
	public static function render_modal() { ?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title><?php esc_html_e( 'Share to Mastodon', 'jetpack' ); ?></title>
		<?php wp_head(); ?>
</head>
<body class="sd-mastodon-modal">
	<div class="sd-mastodon-modal__inner">
		<h2 class="sd-mastodon-modal__title"><?php esc_html_e( 'Share to Mastodon', 'jetpack' ); ?></h2>
		<form action="" method="post">
			<label for="jetpack-mastodon-instance" class="sd-mastodon-modal__label">
				<?php esc_html_e( 'Enter the full URL of the Mastodon instance where you’d like to share this post.', 'jetpack' ); ?>
			</label>
			<input
				required
				aria-required="true"
				type="url"
				id="jetpack-mastodon-instance"
				name="jetpack-mastodon-instance"
				placeholder="<?php echo esc_url( 'https://mastodon.social' ); ?>"
			/>
			<div class="sd-mastodon-modal__submit">
				<?php wp_nonce_field( 'jetpack_share_mastodon_instance', '_wpnonce', true, true ); ?>
				<button id="mastodon-submit"><?php esc_html_e( 'Share', 'jetpack' ); ?></button>
			</div>
		</form>
	</div>
</body>
</html>
		<?php
	}
}
