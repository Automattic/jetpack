<?php // phpcs:ignore WordPress.Files.FileName

// special factory that creates transient versions of various WP objects
class JetpackSyncTestObjectFactory {
	public static $default_post_props = array(
		'post_title'            => 'The Title',
		'post_content'          => 'The Content',
		'post_name'             => 'the-title',
		'post_content_filtered' => 'The Content',
		'filter'                => 'raw',
		'post_author'           => '0',
		'post_excerpt'          => '',
		'post_status'           => 'publish',
		'post_type'             => 'post',
		'comment_status'        => 'closed',
		'ping_status'           => '',
		'post_password'         => '',
		'to_ping'               => '',
		'pinged'                => '',
		'post_parent'           => 0,
		'menu_order'            => 0,
		'guid'                  => '',
	);

	public static $default_comment_props = array(
		'comment_author'       => 'foobar',
		'comment_author_email' => 'foo@example.com',
		'comment_author_url'   => 'http://example.com',
		'comment_content'      => 'Hi there!',
		'comment_approved'     => '1',
		'comment_type'         => 'comment',
		'comment_author_IP'    => '',
		'comment_karma'        => '0',
		'comment_agent'        => '',
		'comment_parent'       => '0',
		'user_id'              => '0',
	);

	public static $default_user_props = array(
		'user_url'            => 'http://example.com',
		'user_activation_key' => '',
		'user_status'         => 0,
	);

	public static $default_term_props = array(
		'term_group'  => 0,
		'description' => '',
		'parent'      => 0,
		'count'       => 0,
		'filter'      => 'raw',
	);

	public function post( $id, $props = array() ) {

		$now     = current_time( 'mysql' );
		$now_gmt = get_gmt_from_date( $now );

		$post = (object) array_merge(
			self::$default_post_props,
			$props,
			array(
				'ID'                => $id,
				'post_date'         => $now,
				'post_date_gmt'     => $now_gmt,
				'post_modified'     => $now,
				'post_modified_gmt' => $now_gmt,
			)
		);

		return new WP_Post( $post );
	}

	public function comment( $id, $post_id, $props = array() ) {
		$now     = current_time( 'mysql' );
		$now_gmt = get_gmt_from_date( $now );

		$comment = (object) array_merge(
			self::$default_comment_props,
			$props,
			array(
				'comment_ID'       => $id,
				'comment_post_ID'  => $post_id,
				'comment_date'     => $now,
				'comment_date_gmt' => $now_gmt,
			)
		);

		return new WP_Comment( $comment );
	}

	public function user( $id, $username, $props = array() ) {
		$now = current_time( 'mysql' );

		$user = (object) array_merge(
			self::$default_user_props,
			$props,
			array(
				'ID'                 => $id,
				'user_login'         => $username,
				'user_nicename'      => $username,
				'user_email'         => "$username@example.com",
				'user_registered'    => $now,
				'display_name'       => $username,
				'allowed_mime_types' => array(
					'jpg|jpeg|jpe' => 'image/jpeg',
					'gif'          => 'image/gif',
				),
			)
		);

		return new WP_User( $user );
	}

	public function plugins() {
		return array(
			'polldaddy/crowdsignal.php' => array(
				'Name'        => 'Polldaddy Polls & Ratings',
				'PluginURI'   => 'https://wordpress.org/extend/plugins/polldaddy/',
				'Version'     => '2.0.31',
				'Description' => 'Create and manage Polldaddy polls and ratings in WordPress',
				'Author'      => 'Automattic, Inc.',
				'TextDomain'  => 'polldaddy',
				'Title'       => 'Polldaddy Polls & Ratings',
				'Network'     => false,
				'AuthorName'  => 'Automattic, Inc.',
			),
			'vaultpress/vaultpress.php' => array(
				'Name'        => 'VaultPress',
				'PluginURI'   => 'http://vaultpress.com/?utm_source=plugin-uri&amp;utm_medium=plugin-description&amp;utm_campaign=1.0',
				'Version'     => '1.8.2',
				'Description' => 'Protect your content, themes, plugins, and settings with...',
				'Author'      => 'Automattic',
				'AuthorURI'   => 'http://vaultpress.com/?utm_source=author-uri&amp;utm_medium=plugin-description&amp;utm_campaign=1.0',
				'TextDomain'  => 'vaultpress',
				'DomainPath'  => '/languages/',
				'Network'     => false,
				'Title'       => 'VaultPress',
				'AuthorName'  => 'Automattic',
			),
		);
	}

	public function term( $id, $props = array() ) {
		$term = (object) array_merge(
			self::$default_term_props,
			$props,
			array(
				'term_id' => $id,
			)
		);

		return new WP_Term( $term );
	}
}
