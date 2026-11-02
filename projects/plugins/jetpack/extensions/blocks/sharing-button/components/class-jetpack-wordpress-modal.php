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
		// phpcs:disable WordPress.Security.NonceVerification.Missing -- Only posted back here once process_request() has checked the nonce and refused the address.
		$refused_site = isset( $_POST['jetpack-wordpress-site'] ) && is_string( $_POST['jetpack-wordpress-site'] )
			? sanitize_text_field( wp_unslash( $_POST['jetpack-wordpress-site'] ) )
			: null;
		// phpcs:enable
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
	<?php // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedStylesheet -- This standalone page has no wp_head(). ?>
	<link rel="stylesheet" href="https://s1.wp.com/i/fonts/recoleta/css/400.min.css" />
	<style type="text/css">
		.sd-wordpress-modal {
			background: #fcfcfc;
			color: #2c3338;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
			margin: 0;
		}

		.sd-wordpress-modal__inner {
			box-sizing: border-box;
			margin: 0 auto;
			max-inline-size: 480px;
			padding: 32px 16px;
		}

		.sd-wordpress-modal__logo {
			text-align: center;
		}

		.sd-wordpress-modal__logo svg {
			block-size: 48px;
			fill: #3858e9;
			inline-size: 48px;
		}

		.sd-wordpress-modal__title {
			color: #101517;
			font-family: Recoleta, Georgia, "Times New Roman", Times, serif;
			font-size: 36px;
			font-weight: 400;
			line-height: 1.2;
			margin: 16px 0 12px;
			text-align: center;
		}

		.sd-wordpress-modal__description {
			font-size: 16px;
			line-height: 1.5;
			margin: 0 0 32px;
			text-align: center;
		}

		.sd-wordpress-modal__inner form {
			margin: 0;
		}

		.sd-wordpress-modal__inner label {
			display: block;
			font-size: 14px;
			font-weight: 500;
			margin: 32px 0 8px;
		}

		.sd-wordpress-modal__site {
			display: flex;
			gap: 8px;
		}

		.sd-wordpress-modal__inner input {
			background: #fff;
			border: 1px solid #c3c4c7;
			border-radius: 2px;
			box-sizing: border-box;
			color: #101517;
			flex: 1;
			font-size: 16px;
			min-inline-size: 0;
			padding: 11px 12px;
		}

		.sd-wordpress-modal__inner button {
			background: #3858e9;
			border: 1px solid #3858e9;
			border-radius: 2px;
			color: #fff;
			cursor: pointer;
			font-size: 16px;
			font-weight: 500;
			padding: 11px 16px;
		}

		.sd-wordpress-modal__inner button:hover {
			background: #2145e6;
			border-color: #2145e6;
		}

		.sd-wordpress-modal__inner .sd-wordpress-modal__wpcom {
			inline-size: 100%;
			padding-block: 14px;
		}

		.sd-wordpress-modal__inner .sd-wordpress-modal__go {
			background: #fff;
			color: #3858e9;
		}

		.sd-wordpress-modal__inner .sd-wordpress-modal__go:hover {
			background: #f0f0f1;
			color: #2145e6;
		}

		.sd-wordpress-modal__help {
			color: #646970;
			font-size: 13px;
			line-height: 1.5;
			margin: 8px 0 0;
		}

		.sd-wordpress-modal__error {
			color: #cc1818;
			font-size: 13px;
			line-height: 1.5;
			margin: 8px 0 0;
		}

		.sd-wordpress-modal__inner input[aria-invalid="true"] {
			border-color: #cc1818;
		}
	</style>
</head>
<body class="sd-wordpress-modal">
	<main class="sd-wordpress-modal__inner">
		<div class="sd-wordpress-modal__logo">
			<?php echo get_social_logo( 'wordpress' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped, WordPress.WP.CapitalPDangit.MisspelledInText -- SVG is safe. ?>
		</div>
		<h1 class="sd-wordpress-modal__title"><?php esc_html_e( 'Repost this on your WordPress site', 'jetpack' ); ?></h1>
		<p class="sd-wordpress-modal__description"><?php esc_html_e( 'Start a new post on your site with this one embedded.', 'jetpack' ); ?></p>
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
					aria-describedby="<?php echo esc_attr( null === $refused_site ? 'jetpack-wordpress-site-help' : 'jetpack-wordpress-site-error jetpack-wordpress-site-help' ); ?>"
					aria-invalid="<?php echo esc_attr( null === $refused_site ? 'false' : 'true' ); ?>"
					type="text"
					inputmode="url"
					autocomplete="url"
					id="jetpack-wordpress-site"
					name="jetpack-wordpress-site"
					placeholder="<?php echo esc_attr( 'https://example.com' ); ?>"
					value="<?php echo esc_attr( (string) $refused_site ); ?>"
				/>
				<button type="submit" class="sd-wordpress-modal__go"><?php esc_html_e( 'Go', 'jetpack' ); ?></button>
			</div>
			<?php if ( null !== $refused_site ) : ?>
				<p id="jetpack-wordpress-site-error" class="sd-wordpress-modal__error" role="alert"><?php esc_html_e( 'That doesn’t look like a site address. Check it and try again.', 'jetpack' ); ?></p>
			<?php endif; ?>
			<p id="jetpack-wordpress-site-help" class="sd-wordpress-modal__help"><?php esc_html_e( 'If WordPress is installed in its own folder, include it, like example.com/wordpress.', 'jetpack' ); ?></p>
		</form>
	</main>
</body>
</html>
		<?php
	}
}
