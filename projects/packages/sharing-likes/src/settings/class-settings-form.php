<?php
/**
 * The one form every setting on Settings > Sharing saves through.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings;

/**
 * One Save button for the whole screen.
 *
 * Sections cannot sit inside a single `<form>`: the services list nests the
 * legacy forms its script submits over AJAX. So the form renders empty at the
 * end of the screen, and each section's fields join it through the HTML `form`
 * attribute instead, wherever they sit.
 */
final class Settings_Form {

	/**
	 * `id` of the form element, which fields name in their `form` attribute.
	 */
	public const ID = 'jetpack-sharing-settings';

	/**
	 * Nonce action for the form.
	 *
	 * Deliberately not sharedaddy's `sharing-options`: `Services_Config::process_requests()`
	 * answers to that one, and on Simple so does a Likes save that turns Likes back
	 * on when its own fields are missing from the request.
	 */
	public const NONCE_ACTION = 'jetpack-sharing-settings';

	/**
	 * Field listing which sections put fields on the form, so a save leaves the rest alone.
	 */
	public const SECTIONS_FIELD = 'jetpack_sharing_sections';

	/**
	 * The services list's own settings: button style, label, and what hangs off them.
	 */
	public const SECTION_SHARING = 'sharing';

	/**
	 * The Like buttons settings.
	 */
	public const SECTION_LIKES = 'likes';

	/**
	 * Comment Likes alone, once a Simple site's post Likes moved to the block.
	 */
	public const SECTION_COMMENT_LIKES = 'comment-likes';

	/**
	 * Where the buttons appear.
	 */
	public const SECTION_PLACEMENT = 'placement';

	/**
	 * The rows that close the services table, whenever that table is hidden.
	 */
	public const SECTION_EXTRAS = 'extras';

	/**
	 * Sections that have put fields on the form during this render.
	 *
	 * @var string[]
	 */
	private static $sections = array();

	/**
	 * Print a section's fields, attached to the form.
	 *
	 * @param string $section One of the SECTION_* constants.
	 * @param string $markup  The fields, escaped by whoever rendered them.
	 */
	public static function render_fields( string $section, string $markup ): void {
		self::$sections[] = $section;

		$markup .= sprintf(
			'<input type="hidden" name="%1$s[]" value="%2$s" />',
			esc_attr( self::SECTIONS_FIELD ),
			esc_attr( $section )
		);

		echo self::attach( $markup ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped by whoever rendered it; attach() only adds an attribute.
	}

	/**
	 * Print the form and its Save button, if any section put fields on it.
	 */
	public static function render(): void {
		if ( array() === self::$sections ) {
			return;
		}

		self::$sections = array();
		?>
		<form method="post" action="" id="<?php echo esc_attr( self::ID ); ?>">
			<p class="submit">
				<input type="submit" name="submit" class="button-primary" value="<?php esc_attr_e( 'Save Changes', 'jetpack-sharing-likes' ); ?>" />
				<?php
				Post_Handler::render_action_field( 'save-settings' );
				wp_nonce_field( self::NONCE_ACTION );
				?>
			</p>
		</form>
		<?php
	}

	/**
	 * Sections the submitted form carried fields for. Callers verify the nonce.
	 *
	 * @return string[]
	 */
	public static function posted_sections(): array {
		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- verified by the caller.
		if ( ! isset( $_POST[ self::SECTIONS_FIELD ] ) || ! is_array( $_POST[ self::SECTIONS_FIELD ] ) ) {
			return array();
		}

		$known = array(
			self::SECTION_SHARING,
			self::SECTION_LIKES,
			self::SECTION_COMMENT_LIKES,
			self::SECTION_PLACEMENT,
			self::SECTION_EXTRAS,
		);

		// phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput -- verified by the caller; checked against an allowlist.
		$posted = array_filter( wp_unslash( $_POST[ self::SECTIONS_FIELD ] ), 'is_string' );

		return array_values( array_intersect( $known, $posted ) );
	}

	/**
	 * Point every field in the markup at the form, leaving any that already name one.
	 *
	 * @param string $markup Field markup.
	 */
	private static function attach( string $markup ): string {
		$tags = new \WP_HTML_Tag_Processor( $markup );

		while ( $tags->next_tag() ) {
			if ( in_array( $tags->get_tag(), array( 'INPUT', 'SELECT', 'TEXTAREA' ), true ) && null === $tags->get_attribute( 'form' ) ) {
				$tags->set_attribute( 'form', self::ID );
			}
		}

		return $tags->get_updated_html();
	}
}
