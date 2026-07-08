<?php
/**
 * Author Person / ProfilePage Schema.org node builder.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

use WP_User;

/**
 * Builds author Person / ProfilePage nodes and owns the extra author profile meta.
 */
class Author_Schema_Node {

	/**
	 * User meta key for the author's job title.
	 */
	const META_JOB_TITLE = 'jetpack_seo_job_title';

	/**
	 * User meta key for profile links emitted as Person `sameAs`.
	 */
	const META_SAME_AS = 'jetpack_seo_same_as';

	/**
	 * Wire the WP user-profile fields.
	 *
	 * @return void
	 */
	public static function init() {
		register_meta(
			'user',
			self::META_JOB_TITLE,
			array(
				'type'              => 'string',
				'single'            => true,
				'default'           => '',
				'sanitize_callback' => 'sanitize_text_field',
				'show_in_rest'      => true,
			)
		);
		register_meta(
			'user',
			self::META_SAME_AS,
			array(
				'type'              => 'array',
				'single'            => true,
				'default'           => array(),
				'sanitize_callback' => array( __CLASS__, 'sanitize_url_list' ),
				'show_in_rest'      => array(
					'schema' => array(
						'type'  => 'array',
						'items' => array(
							'type'   => 'string',
							'format' => 'uri',
						),
					),
				),
			)
		);

		add_action( 'show_user_profile', array( __CLASS__, 'render_profile_fields' ) );
		add_action( 'edit_user_profile', array( __CLASS__, 'render_profile_fields' ) );
		add_action( 'personal_options_update', array( __CLASS__, 'save_profile_fields' ) );
		add_action( 'edit_user_profile_update', array( __CLASS__, 'save_profile_fields' ) );
	}

	/**
	 * Build a Person node for a WP user.
	 *
	 * @param WP_User|int|null $user User object or ID.
	 * @return array|null
	 */
	public static function build_person( $user ) {
		$user = self::get_user( $user );
		if ( ! $user ) {
			return null;
		}

		$name = self::text( $user->display_name );
		if ( '' === $name ) {
			return null;
		}

		$node = array(
			'@type' => 'Person',
			'@id'   => Schema_Node_Ids::person( $user->ID, $user->user_nicename ),
			'name'  => $name,
		);

		$image = get_avatar_url( $user->ID, array( 'size' => 512 ) );
		if ( is_string( $image ) && '' !== $image ) {
			$node['image'] = $image;
		}

		$description = self::text( get_the_author_meta( 'description', $user->ID ) );
		if ( '' !== $description ) {
			$node['description'] = $description;
		}

		// Prefer the user's Website field; fall back to the author archive so the
		// Person always carries a URL identifying the author.
		$url         = self::url( $user->user_url );
		$node['url'] = '' !== $url ? $url : get_author_posts_url( $user->ID, $user->user_nicename );

		$given_name = self::text( get_the_author_meta( 'first_name', $user->ID ) );
		if ( '' !== $given_name ) {
			$node['givenName'] = $given_name;
		}

		$family_name = self::text( get_the_author_meta( 'last_name', $user->ID ) );
		if ( '' !== $family_name ) {
			$node['familyName'] = $family_name;
		}

		$job_title = self::text( get_user_meta( $user->ID, self::META_JOB_TITLE, true ) );
		if ( '' !== $job_title ) {
			$node['jobTitle'] = $job_title;
		}

		$same_as = self::sanitize_url_list( get_user_meta( $user->ID, self::META_SAME_AS, true ) );
		if ( ! empty( $same_as ) ) {
			$node['sameAs'] = $same_as;
		}

		return $node;
	}

	/**
	 * Build a ProfilePage node for an author archive.
	 *
	 * @param WP_User|int|null $user User object or ID.
	 * @return array|null
	 */
	public static function build_profile_page( $user ) {
		$user = self::get_user( $user );
		if ( ! $user || '' === self::text( $user->display_name ) ) {
			return null;
		}

		return array(
			'@type'      => 'ProfilePage',
			'@id'        => Schema_Node_Ids::profile_page( $user->ID, $user->user_nicename ),
			'url'        => get_author_posts_url( $user->ID, $user->user_nicename ),
			'mainEntity' => array( '@id' => Schema_Node_Ids::person( $user->ID, $user->user_nicename ) ),
		);
	}

	/**
	 * Render the Jetpack SEO author profile fields.
	 *
	 * @param WP_User $user User being edited.
	 * @return void
	 */
	public static function render_profile_fields( WP_User $user ) {
		$job_field   = self::META_JOB_TITLE;
		$links_field = self::META_SAME_AS;
		$job_title   = get_user_meta( $user->ID, $job_field, true );
		$same_as     = self::sanitize_url_list( get_user_meta( $user->ID, $links_field, true ) );

		printf(
			'<h2>%1$s</h2>
			<table class="form-table" role="presentation">
				<tr>
					<th><label for="%2$s">%3$s</label></th>
					<td><input type="text" class="regular-text" name="%2$s" id="%2$s" value="%4$s" /></td>
				</tr>
				<tr>
					<th><label for="%5$s">%6$s</label></th>
					<td>
						<textarea class="large-text code" rows="5" name="%5$s" id="%5$s">%7$s</textarea>
						<p class="description">%8$s</p>
					</td>
				</tr>
			</table>',
			esc_html__( 'Jetpack SEO author schema', 'jetpack-seo' ),
			esc_attr( $job_field ),
			esc_html__( 'Job title', 'jetpack-seo' ),
			esc_attr( $job_title ),
			esc_attr( $links_field ),
			esc_html__( 'Profile links', 'jetpack-seo' ),
			esc_textarea( implode( "\n", $same_as ) ),
			esc_html__( 'One public profile URL per line.', 'jetpack-seo' )
		);
	}

	/**
	 * Save the Jetpack SEO author profile fields.
	 *
	 * @param int $user_id User ID.
	 * @return void
	 */
	public static function save_profile_fields( $user_id ) {
		if ( ! current_user_can( 'edit_user', $user_id ) ) {
			return;
		}

		$nonce = isset( $_POST['_wpnonce'] ) ? sanitize_text_field( wp_unslash( $_POST['_wpnonce'] ) ) : '';
		if ( ! wp_verify_nonce( $nonce, 'update-user_' . $user_id ) ) {
			return;
		}

		$job_title = isset( $_POST[ self::META_JOB_TITLE ] )
			? self::text( sanitize_text_field( wp_unslash( $_POST[ self::META_JOB_TITLE ] ) ) )
			: '';
		if ( '' === $job_title ) {
			delete_user_meta( $user_id, self::META_JOB_TITLE );
		} else {
			update_user_meta( $user_id, self::META_JOB_TITLE, $job_title );
		}

		$same_as = isset( $_POST[ self::META_SAME_AS ] )
			? preg_split( '/\r\n|\r|\n/', sanitize_textarea_field( wp_unslash( $_POST[ self::META_SAME_AS ] ) ) )
			: array();
		$same_as = self::sanitize_url_list( $same_as );
		if ( empty( $same_as ) ) {
			delete_user_meta( $user_id, self::META_SAME_AS );
		} else {
			update_user_meta( $user_id, self::META_SAME_AS, $same_as );
		}
	}

	/**
	 * Normalize a list of URLs: keep unique absolute http(s) URLs. Delegates to
	 * the shared {@see Schema_Settings::sanitize_url_list()} sanitizer.
	 *
	 * @param mixed $value Raw value.
	 * @return array<int, string>
	 */
	public static function sanitize_url_list( $value ) {
		return Schema_Settings::sanitize_url_list( $value );
	}

	/**
	 * Resolve a WP user.
	 *
	 * @param WP_User|int|null $user User object or ID.
	 * @return WP_User|null
	 */
	private static function get_user( $user ) {
		if ( $user instanceof WP_User ) {
			return $user;
		}

		$user = get_userdata( (int) $user );
		return $user instanceof WP_User ? $user : null;
	}

	/**
	 * Normalize a scalar value to trimmed plain text.
	 *
	 * @param mixed $value Raw value.
	 * @return string
	 */
	private static function text( $value ) {
		if ( ! is_scalar( $value ) ) {
			return '';
		}
		return trim( wp_strip_all_tags( (string) $value ) );
	}

	/**
	 * Normalize an absolute http(s) URL.
	 *
	 * @param mixed $value Raw value.
	 * @return string
	 */
	private static function url( $value ) {
		$list = Schema_Settings::sanitize_url_list( array( $value ) );
		return $list[0] ?? '';
	}
}
