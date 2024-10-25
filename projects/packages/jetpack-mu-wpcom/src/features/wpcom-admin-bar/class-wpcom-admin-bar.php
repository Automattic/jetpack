<?php
/**
 * The WordPress.com WP Admin Bar for the default interface.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * The WPCOM_Admin_Bar.
 */
class WPCOM_Admin_Bar extends \WP_Admin_Bar {
	/**
	 * The map of url from the wp admin to calypso.
	 *
	 * @var array
	 */
	private $map_wp_admin_url_to_calypso_url = array(
		/**
		 * Site menu
		 */
		'wp-admin/'                            => 'https://wordpress.com/home/%home_url%',
		'wp-admin/plugins.php'                 => 'https://wordpress.com/plugins/%home_url%',
		'wp-admin/themes.php'                  => 'https://wordpress.com/themes/%home_url%',

		/**
		 * +New menu
		 */
		'wp-admin/post-new.php'                => '/wp-admin/post-new.php?post_type=post&calypsoify=1',
		'wp-admin/media-new.php'               => 'https://wordpress.com/media/%home_url%',
		'wp-admin/post-new.php?post_type=page' => 'https://wordpress.com/page/%home_url%',
		'wp-admin/user-new.php'                => 'https://wordpress.com/people/new/%home_url%',

		/**
		 * Jetpack
		 */
		'wp-admin/post-new.php?post_type=jetpack-testimonial' => 'https://wordpress.com/types/jetpack-testimonial/%home_url%',
		'wp-admin/post-new.php?post_type=jetpack-portfolio' => 'https://wordpress.com/types/jetpack-portfolio/%home_url%',
	);

	/**
	 * Adds a node to the menu.
	 *
	 * @param array $args {
	 *     Arguments for adding a node.
	 *
	 *     @type string $id     ID of the item.
	 *     @type string $title  Title of the node.
	 *     @type string $parent Optional. ID of the parent node.
	 *     @type string $href   Optional. Link for the item.
	 *     @type bool   $group  Optional. Whether or not the node is a group. Default false.
	 *     @type array  $meta   Meta data including the following keys: 'html', 'class', 'rel', 'lang', 'dir',
	 *                          'onclick', 'target', 'title', 'tabindex', 'menu_title'. Default empty.
	 * }
	 */
	public function add_node( $args ) {
		if ( ! is_array( $args ) || empty( $args['href'] ) ) {
			parent::add_node( $args );
			return;
		}
		if ( isset( $args['id'] ) && $args['id'] === 'wpcom-blog-dashboard' ) {
			parent::add_node( $args );
			return;
		}
		$home_url  = home_url( '/' );
		$site_slug = wp_parse_url( $home_url, PHP_URL_HOST );
		$href      = str_replace( $home_url, '', $args['href'] );
		if ( array_key_exists( $href, $this->map_wp_admin_url_to_calypso_url ) ) {
			$calypso_url  = $this->map_wp_admin_url_to_calypso_url[ $href ];
			$args['href'] = str_replace( '%home_url%', $site_slug, $calypso_url );
		}

		parent::add_node( $args );
	}
}
