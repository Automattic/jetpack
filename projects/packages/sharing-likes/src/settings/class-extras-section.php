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
	 * Render the section, if anything wants to be on it.
	 */
	public static function render(): void {
		$fields = Services_Config::global_options();
		if ( '' === $fields ) {
			return;
		}

		?>
		<div class="jetpack-sharing-settings__section">
			<h2><?php esc_html_e( 'Other settings', 'jetpack-sharing-likes' ); ?></h2>
			<?php
			Settings_Form::render_fields(
				Settings_Form::SECTION_EXTRAS,
				'<table class="form-table"><tbody>' . $fields . '</tbody></table>'
			);
			?>
		</div>
		<?php
	}
}
