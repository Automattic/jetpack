<?php
/**
 * Utils to display information callouts to users.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Displays a callout box in wp-admin.
 *
 * @param string $icon The Dashicons icon class to use within the callout.
 * @param string $title The title text to display in the callout.
 * @param array  $description List of paragraphs to display as description.
 * @param string $button_link URL of the CTA button.
 * @param string $button_text Text of the CTA button.
 * @param string $image The path of the image to include within the callout.
 */
function wpcom_display_callout( $icon, $title, $description, $button_link, $button_text, $image ) {
	?>
	<style>
		.wpcom-callout-container {
			height: max( calc( 100vh - 32px ), 400px );
			display: flex;
			justify-content: center;
			align-items: center;
		}

		.wpcom-callout {
			padding: 24px;
			margin-left: auto;
			margin-right: auto;
			max-width: 600px;
			box-sizing: border-box;
			display: flex;
			background-color: #fff;
			box-shadow: rgba(0, 0, 0, 0.1) 0 0 0 1px;
			border-radius: 7px;
			gap: 24px;
		}

		.wpcom-callout > * {
			width: 50%;
		}

		.wpcom-callout-content {
			display: flex;
			flex-direction: column;
			gap: 16px;
			align-items: flex-start;
		}

		.wpcom-callout-content > * {
			margin: 0;
		}

		.wpcom-callout-title {
			color: #1e1e1e;
			font-size: 15px;
			font-weight: 500;
			line-height: 20px;
		}

		.wpcom-callout-description {
			color: rgb(117, 117, 117);
			line-height: 1.4;
			text-wrap: pretty;
			font-size: 13px;
		}

		.wpcom-callout-image {
			position: relative;
		}

		.wpcom-callout-image > img {
			position: absolute;
			width: 100%;
			height: 100%;
			object-fit: cover;
			border-radius: 7px;
		}

		.wpcom-callout .button.button-primary {
			border-radius: 2px;
		}

		@media (max-width: 620px) {
			.wpcom-callout-container {
				align-items: flex-start;
			}

			.wpcom-callout {
				margin-top: 10px;
			}

			.wpcom-callout-content {
				width: 100%;
			}

			.wpcom-callout-image {
				display: none;
			}
		}
	</style>
	<div class="wpcom-callout-container">
		<div class="wpcom-callout">
			<div class="wpcom-callout-content">
				<div class="wpcom-callout-icon"><span class="dashicons <?php echo esc_attr( $icon ); ?>"></span></div>
				<h2 class="wpcom-callout-title"><?php echo esc_html( $title ); ?></h2>
				<?php foreach ( $description as $paragraph ) : ?>
					<p class="wpcom-callout-description"><?php echo esc_html( $paragraph ); ?></p>
				<?php endforeach; ?>
				<a class="button button-primary" href="<?php echo esc_url( $button_link ); ?>" data-target="wpcom-help-center"><?php echo esc_html( $button_text ); ?></a>
			</div>
			<div class="wpcom-callout-image"><img src="<?php echo esc_url( $image ); ?>"></div>
		</div>
	</div>
	<?php
}
