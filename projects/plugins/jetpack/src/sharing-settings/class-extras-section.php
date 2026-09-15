<?php
/**
 * Settings other features add to Settings > Sharing.
 *
 * @package automattic/jetpack
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Plugin\Sharing_Settings;

/**
 * Hosts whatever third parties hang off `sharing_global_options`.
 *
 * Those settings normally land at the end of the services table, so this
 * section only renders when the services table does not: Twitter Cards adds its
 * site tag there, and its owning feature is not gated on the Sharing module.
 */
final class Extras_Section {

	/**
	 * Nonce action for this section's form.
	 */
	public const NONCE_ACTION = 'jetpack-sharing-extras';

	/**
	 * Render the section, if anything wants to be on it.
	 */
	public static function render(): void {
		$fields = self::collect_fields();
		if ( '' === $fields ) {
			return;
		}

		?>
		<div class="jetpack-sharing-settings__section">
			<h2><?php esc_html_e( 'Other sharing settings', 'jetpack' ); ?></h2>
			<form method="post" action="">
				<table class="form-table">
					<tbody>
						<?php echo $fields; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- third-party field markup, escaped by whoever rendered it. ?>
					</tbody>
				</table>
				<p class="submit">
					<input type="submit" name="submit" class="button-primary" value="<?php esc_attr_e( 'Save Changes', 'jetpack' ); ?>" />
					<?php
					Post_Handler::render_action_field( 'save-extras' );
					wp_nonce_field( self::NONCE_ACTION );
					?>
				</p>
			</form>
		</div>
		<?php
	}

	/**
	 * The markup `sharing_global_options` produces, if any.
	 *
	 * Buffered rather than echoed in place so the section can be skipped whole
	 * when nothing is hooked, instead of rendering an empty table and a Save
	 * button that saves nothing.
	 */
	private static function collect_fields(): string {
		ob_start();

		/** This action is documented in src/sharing-settings/class-services-config.php */
		do_action( 'sharing_global_options' );

		return trim( (string) ob_get_clean() );
	}
}
