<?php
/**
 * The section of Settings > Sharing that hosts other features' settings.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings;

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
			<h2><?php esc_html_e( 'Other settings', 'jetpack-sharing-likes' ); ?></h2>
			<form method="post" action="">
				<table class="form-table">
					<tbody>
						<?php echo $fields; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- third-party field markup, escaped by whoever rendered it. ?>
					</tbody>
				</table>
				<p class="submit">
					<input type="submit" name="submit" class="button-primary" value="<?php esc_attr_e( 'Save Changes', 'jetpack-sharing-likes' ); ?>" />
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
		$unhooked = self::unhook_legacy_likes_options();

		ob_start();

		/** This action is documented in projects/packages/sharing-likes/src/settings/class-services-config.php */
		do_action( 'sharing_global_options' );

		$fields = trim( (string) ob_get_clean() );

		foreach ( $unhooked as list( $callback, $priority ) ) {
			add_action( 'sharing_global_options', $callback, $priority );
		}

		return $fields;
	}

	/**
	 * Take off the legacy Likes options Simple hangs on this action until CM-913.
	 *
	 * The Likes section owns those, and their save checks a nonce this form does not carry.
	 *
	 * @return array<int, array{0: callable, 1: int}> Each callback removed, with its priority.
	 */
	private static function unhook_legacy_likes_options(): array {
		global $wp_filter;

		$unhooked = array();

		if ( ! isset( $wp_filter['sharing_global_options'] ) ) {
			return $unhooked;
		}

		foreach ( $wp_filter['sharing_global_options']->callbacks as $priority => $callbacks ) {
			foreach ( $callbacks as $callback ) {
				$function = $callback['function'];

				if ( is_array( $function ) && 'admin_settings_init' === $function[1] && is_a( $function[0], 'Jetpack_Likes_Settings', true ) ) {
					remove_action( 'sharing_global_options', $function, $priority );
					$unhooked[] = array( $function, $priority );
				}
			}
		}

		return $unhooked;
	}
}
