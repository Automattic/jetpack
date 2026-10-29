<?php
/**
 * Ask readers where to repost a post: WordPress.com, or their own WordPress site.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Sharing_Button_Block;

/**
 * Class Jetpack_WordPress_Modal
 */
class Jetpack_WordPress_Modal {
	/**
	 * Nonce action shared by both forms.
	 */
	const NONCE_ACTION = 'jetpack_share_wordpress';

	/**
	 * Whether this request is the WordPress button's first click, ?share=wordpress&nb=1.
	 *
	 * @return bool
	 */
	public static function should_display_modal() {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Only used to display the modal.
		return isset( $_GET['share'] )
			&& isset( $_GET['nb'] )
			&& 'wordpress' === sanitize_text_field( wp_unslash( $_GET['share'] ) ) // phpcs:ignore WordPress.WP.CapitalPDangit.MisspelledInText
			&& 1 === (int) $_GET['nb'];
		// phpcs:enable
	}

	/**
	 * Hook the modal render into WordPress.
	 */
	public static function modal() {
		if ( ! self::should_display_modal() ) {
			return;
		}

		self::render_modal();

		die( 0 );
	}

	/**
	 * Render the modal.
	 */
	public static function render_modal() {
		$nonce = wp_create_nonce( self::NONCE_ACTION );
		?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="robots" content="noindex,follow" />
	<meta name="referrer" content="no-referrer">
		<?php rel_canonical(); ?>
	<title><?php esc_html_e( 'Repost on WordPress', 'jetpack' ); ?></title>
	<style type="text/css">
		.sd-wordpress-modal {
			background: #f6f7f7;
			color: #1e1e1e;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			margin: 0;
		}

		.sd-wordpress-modal__inner {
			background: #fff;
			border-radius: 8px;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
			box-sizing: border-box;
			margin: 48px auto;
			max-width: 440px;
			padding: 32px;
			width: calc(100% - 32px);
		}

		.sd-wordpress-modal__logo svg {
			fill: #3858e9;
			height: 40px;
			width: 40px;
		}

		.sd-wordpress-modal__title {
			font-size: 22px;
			line-height: 1.3;
			margin: 12px 0 24px;
		}

		.sd-wordpress-modal__inner form {
			margin: 0;
		}

		.sd-wordpress-modal__inner label {
			display: block;
			font-size: 14px;
			font-weight: 500;
			margin: 24px 0 8px;
		}

		.sd-wordpress-modal__site {
			display: flex;
			gap: 8px;
		}

		.sd-wordpress-modal__inner input {
			border: 1px solid #949494;
			border-radius: 4px;
			box-sizing: border-box;
			flex: 1;
			font-size: 16px;
			min-width: 0;
			padding: 10px;
		}

		.sd-wordpress-modal__inner button {
			background: #3858e9;
			border: 0;
			border-radius: 4px;
			color: #fff;
			cursor: pointer;
			font-size: 16px;
			font-weight: 500;
			padding: 12px 16px;
		}

		.sd-wordpress-modal__inner button:hover {
			background: #2145e6;
		}

		.sd-wordpress-modal__wpcom {
			width: 100%;
		}
	</style>
</head>
<body class="sd-wordpress-modal">
	<main class="sd-wordpress-modal__inner">
		<div class="sd-wordpress-modal__logo">
			<?php echo get_social_logo( 'wordpress' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped, WordPress.WP.CapitalPDangit.MisspelledInText -- SVG is safe. ?>
		</div>
		<h1 class="sd-wordpress-modal__title"><?php esc_html_e( 'Repost this on your WordPress site', 'jetpack' ); ?></h1>
		<form method="post">
			<input type="hidden" name="_wpnonce" value="<?php echo esc_attr( $nonce ); ?>" />
			<input type="hidden" name="jetpack-wordpress-destination" value="wordpress.com" />
			<button type="submit" class="sd-wordpress-modal__wpcom"><?php esc_html_e( 'Continue to WordPress.com', 'jetpack' ); ?></button>
		</form>
		<form method="post">
			<input type="hidden" name="_wpnonce" value="<?php echo esc_attr( $nonce ); ?>" />
			<input type="hidden" name="jetpack-wordpress-destination" value="site" />
			<label for="jetpack-wordpress-site"><?php esc_html_e( 'Or enter your site address', 'jetpack' ); ?></label>
			<div class="sd-wordpress-modal__site">
				<input
					required
					aria-required="true"
					type="text"
					inputmode="url"
					autocomplete="url"
					id="jetpack-wordpress-site"
					name="jetpack-wordpress-site"
					placeholder="<?php echo esc_attr( 'https://example.com' ); ?>"
				/>
				<button type="submit"><?php esc_html_e( 'Go', 'jetpack' ); ?></button>
			</div>
		</form>
	</main>
</body>
</html>
		<?php
	}
}
