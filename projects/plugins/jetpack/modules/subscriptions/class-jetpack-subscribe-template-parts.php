<?php
/**
 * Shared helpers for subscriptions template parts placement.
 *
 * @package automattic/jetpack-subscriptions
 * @since $$next-version$$
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class for shared helpers for subscriptions template parts placement.
 *
 * @since $$next-version$$
 */
class Jetpack_Subscribe_Template_Parts {
	/**
	 * Adds a default template part unless the query excludes it or already contains an override.
	 *
	 * @since $$next-version$$
	 *
	 * @param WP_Block_Template[] $query_result  Templates found so far.
	 * @param array               $query         Template query arguments.
	 * @param string              $template_type Template type.
	 * @param WP_Block_Template   $template      Default template part to add.
	 * @return WP_Block_Template[]
	 */
	public static function add_to_list( $query_result, $query, $template_type, $template ): array {
		// 'wp_id' is set when the query is for a specific template, the one user customized. We don't want to add the default template part in that case.
		if ( 'wp_template_part' !== $template_type || isset( $query['wp_id'] ) ) {
			return $query_result;
		}

		// 'area' is set when the query is for a specific template part area, e.g. 'header'. We don't want to add the default template part if the query is for a different area.
		if ( isset( $query['area'] ) && $query['area'] !== $template->area ) {
			return $query_result;
		}

		// 'slug__in' and 'slug__not_in' are set when the query is for specific template part slugs. We don't want to add the default template part if the query is for a different slug.
		if ( ! empty( $query['slug__in'] ) && ! in_array( $template->slug, $query['slug__in'], true ) ) {
			return $query_result;
		}

		if ( ! empty( $query['slug__not_in'] ) && in_array( $template->slug, $query['slug__not_in'], true ) ) {
			return $query_result;
		}

		// If the query already contains a template part with the same ID, we don't want to add the default template part because it would be overridden by the existing one.
		foreach ( $query_result as $existing ) {
			if ( $existing->id === $template->id ) {
				return $query_result;
			}
		}

		$query_result[] = $template;

		return $query_result;
	}

	/**
	 * Prints a note that only site administrators see, linking to Newsletter settings.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $link_text Settings link text. Defaults to "Turn off".
	 * @return void
	 */
	public static function render_admin_note( $link_text = '' ) {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		if ( '' === $link_text ) {
			$link_text = __( 'Turn off', 'jetpack' );
		}

		// Styled by the Subscribe block's view.scss, which every placement using this note already loads.
		printf(
			'<p class="jetpack-subscribe-admin-note"><span class="jetpack-subscribe-admin-note__visibility">%1$s</span> <a href="%2$s">%3$s</a></p>',
			esc_html__( 'Only admins see this.', 'jetpack' ),
			esc_url( admin_url( 'admin.php?page=jetpack-newsletter&p=%2F%3Ftab%3Dsettings' ) ),
			esc_html( $link_text )
		);
	}
}
