<?php

class Jetpack_Calypso_Nudges {
	public function __construct() {
		$enabled = apply_filters( 'jetpack_calypso_nudges_enable', '__return_true' );
		if ( ! $enabled ) {
			return;
		}

		add_action( 'admin_notices', array( $this, 'nudge_to_calypso' ) );
		add_action( 'admin_post_calypso_nudge', array( $this, 'redirect_to_calypso' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'wp_ajax_calypso_nudges_register_dismiss_stats', array( $this, 'register_dismiss_stats' ) );
		add_filter( 'allowed_redirect_hosts', array( $this, 'update_allowed_redirect_hosts' ) );
	}

	public function nudge_to_calypso() {
		$screen = $this->get_screen();
		if ( ! $screen || $this->is_dismissed( $screen ) ) {
			return;
		}

		$url = $this->get_nudge_url( $screen );

		if ( 'add' === $screen['type'] ) {
			$this->display_editor_nudge( $url, $screen['desc'] );
		} else {
			$this->display_management_nudge( $url, $screen['desc'] );
		}
	}

	protected function get_screen() {
		switch ( get_current_screen()->id ) {
			case 'edit-post':
				$type = 'manage';
				$desc = 'post';
				break;
			case 'post':
				$type = 'add';
				$desc = 'post';
				break;
			case 'edit-category':
				$type = 'manage';
				$desc = 'category';
				break;
			case 'edit-post_tag':
				$type = 'manage';
				$desc = 'tag';
				break;
			case 'upload':
				$type = 'manage';
				$desc = 'media';
				break;
			case 'media':
				$type = 'add';
				$desc = 'media';
				break;
			case 'edit-page':
				$type = 'manage';
				$desc = 'page';
				break;
			case 'page':
				$type = 'add';
				$desc = 'page';
				break;
			case 'edit-comments':
				$type = 'manage';
				$desc = 'comment';
				break;
			case 'edit-jetpack-testimonial':
				$type = 'manage';
				$desc = 'testimonial';
				break;
			case 'jetpack-testimonial':
				$type = 'add';
				$desc = 'testimonial';
				break;
			case 'edit-jetpack-portfolio':
				$type = 'manage';
				$desc = 'portfolio';
				break;
			case 'jetpack-portfolio':
				$type = 'add';
				$desc = 'portfolio';
				break;
			case 'edit-nova_menu_item':
				$type = 'manage';
				$desc = 'food_menu';
				break;
			case 'nova_menu_item':
				$type = 'add';
				$desc = 'food_menu';
				break;
			case 'edit-jetpack-comic':
				$type = 'manage';
				$desc = 'comic';
				break;
			case 'jetpack-comic':
				$type = 'add';
				$desc = 'comic';
				break;
			default:
				return false;
		}
		return array(
			'id' => "{$type}_{$desc}",
			'type' => $type,
			'desc' => $desc,
		);
	}

	protected function get_nudge_url( $screen ) {
		$nudge_url = get_admin_url( null, 'admin-post.php' );

		$nudge_url = add_query_arg( array(
			'action' => 'calypso_nudge',
			'screen' => $screen['id'],
			'calypso_nudge_nonce' => wp_create_nonce( $screen['id'] )
		), $nudge_url );

		return $nudge_url;
	}

	protected function display_editor_nudge( $nudge_url, $desc ) {
		switch ( $desc ) {
			case 'post':
				$notice = __( 'There\'s an easier way to create posts on WordPress.com.' );
				break;
			case 'page':
				$notice = __( 'There\'s an easier way to create pages on WordPress.com.' );
				break;
			case 'media':
				$notice = __( 'There\'s an easier way to add media on WordPress.com.' );
				break;
			case 'tag':
				$notice = __( 'There\'s an easier way to create tags on WordPress.com.' );
				break;
			case 'category':
				$notice = __( 'There\'s an easier way to create categories on WordPress.com.' );
				break;
			case 'testimonial':
				$notice = __( 'There\'s an easier way to create testimonials on WordPress.com.' );
				break;
			case 'portfolio':
				$notice = __( 'There\'s an easier way to create portfolio projects on WordPress.com.' );
				break;
			case 'food_menu':
				$notice = __( 'There\'s an easier way to create menu items on WordPress.com.' );
				break;
			case 'comic':
				$notice = __( 'There\'s an easier way to create comics on WordPress.com.' );
				break;
			default:
				$notice = __( 'There\'s an easier way to create on WordPress.com.' );
		}
		?>
		<div class="jetpack-calypso-nudge notice notice-info is-dismissible">
			<p>
				<?php echo esc_html( $notice ); ?>
				<a href="<?php echo esc_url( $nudge_url ); ?>">
					<?php esc_html_e('Switch to the improved editor.'); ?><span class="dashicons dashicons-external"></span>
				</a>
				<?php static $script_included = true; //wpcom_hide_tip_link( 'calypso_nudges' ); ?>
			</p>
		</div>
		<?php
	}

	protected function display_management_nudge( $nudge_url, $desc ) {
		switch ( $desc ) {
			case 'post':
				$notice = __( 'There\'s an easier way to manage posts on WordPress.com.' );
				break;
			case 'page':
				$notice = __( 'There\'s an easier way to manage pages on WordPress.com.' );
				break;
			case 'comment':
				$notice = __( 'There\'s an easier way to manage comments on WordPress.com.' );
				break;
			case 'media':
				$notice = __( 'There\'s an easier way to manage media on WordPress.com.' );
				break;
			case 'tag':
				$notice = __( 'There\'s an easier way to manage tags on WordPress.com.' );
				break;
			case 'category':
				$notice = __( 'There\'s an easier way to manage categories on WordPress.com.' );
				break;
			case 'testimonial':
				$notice = __( 'There\'s an easier way to manage testimonials on WordPress.com.' );
				break;
			case 'portfolio':
				$notice = __( 'There\'s an easier way to manage portfolio projects on WordPress.com.' );
				break;
			case 'food_menu':
				$notice = __( 'There\'s an easier way to manage menu items on WordPress.com.' );
				break;
			case 'comic':
				$notice = __( 'There\'s an easier way to manage comics on WordPress.com.' );
				break;
			default:
				$notice = __( 'There\'s an easier way to manage on WordPress.com.' );
		}
		?>
		<div class="jetpack-calypso-nudge notice notice-info is-dismissible">
			<p>
				<?php echo esc_html( $notice ); ?>
				<a href="<?php echo esc_url( $nudge_url ); ?>">
					<?php esc_html_e('Switch to the improved experience.'); ?><span class="dashicons dashicons-external"></span>
				</a>
				<?php static $script_included = true; //wpcom_hide_tip_link( 'calypso_nudges' ); ?>
			</p>
		</div>
		<?php
	}

	public function redirect_to_calypso() {
		$screen = $_GET['screen'];
		$this->verify_nonce( $screen );
		$this->register_follow_stats( $screen );
		$this->redirect_with_slug( $screen );
	}

	protected function verify_nonce( $screen ) {
		if ( isset( $_GET['calypso_nudge_nonce'] )
			&& wp_verify_nonce( $_GET['calypso_nudge_nonce'], $screen ) ) {
			return;
		}

		// redirect to dashboard if nonce is not set
		wp_safe_redirect( get_dashboard_url() );
		exit;
	}

	protected function register_follow_stats( $screen ) {
		// Make $event a full string for better discoverability.
		switch ( $screen ) {
			case 'manage_post':
				$event = 'jetpack_calypso_nudge_follow_manage_post';
				break;
			case 'add_post':
				$event = 'jetpack_calypso_nudge_follow_add_post';
				break;
			case 'manage_page':
				$event = 'jetpack_calypso_nudge_follow_manage_page';
				break;
			case 'add_page':
				$event = 'jetpack_calypso_nudge_follow_add_page';
				break;
			case 'manage_media':
				$event = 'jetpack_calypso_nudge_follow_manage_media';
				break;
			case 'add_media':
				$event = 'jetpack_calypso_nudge_follow_add_media';
				break;
			case 'manage_testimonial':
				$event = 'jetpack_calypso_nudge_follow_manage_testimonial';
				break;
			case 'add_testimonial':
				$event = 'jetpack_calypso_nudge_follow_add_testimonial';
				break;
			case 'manage_portfolio':
				$event = 'jetpack_calypso_nudge_follow_manage_portfolio';
				break;
			case 'add_portfolio':
				$event = 'jetpack_calypso_nudge_follow_add_portfolio';
				break;
			case 'manage_food_menu':
				$event = 'jetpack_calypso_nudge_follow_manage_food_menu';
				break;
			case 'add_food_menu':
				$event = 'jetpack_calypso_nudge_follow_add_food_menu';
				break;
			case 'manage_comic':
				$event = 'jetpack_calypso_nudge_follow_manage_comic';
				break;
			case 'add_comic':
				$event = 'jetpack_calypso_nudge_follow_add_comic';
				break;
			case 'manage_comment':
				$event = 'jetpack_calypso_nudge_follow_manage_comment';
				break;
			case 'manage_category':
				$event = 'jetpack_calypso_nudge_follow_manage_category';
				break;
			case 'manage_tag':
				$event = 'jetpack_calypso_nudge_follow_manage_tag';
				break;
			default:
				return;
		}

		// record in Tracks
		jetpack_tracks_record_event( wp_get_current_user(), $event );
	}

	public function register_dismiss_stats() {
		check_ajax_referer( 'jetpack-calypso-nudges-dismiss-nonce', 'nonce' );

		// Make $event a full string for better discoverability.
		switch ( $_GET['cookieGroup'] ) {
			case 'posts':
				$event = 'jetpack_calypso_nudge_dismiss_posts';
				break;
			case 'pages':
				$event = 'jetpack_calypso_nudge_dismiss_pages';
				break;
			case 'media':
				$event = 'jetpack_calypso_nudge_dismiss_media';
				break;
			case 'testimonials':
				$event = 'jetpack_calypso_nudge_dismiss_testimonials';
				break;
			case 'portfolios':
				$event = 'jetpack_calypso_nudge_dismiss_portfolios';
				break;
			case 'food_menus':
				$event = 'jetpack_calypso_nudge_dismiss_food_menus';
				break;
			case 'comics':
				$event = 'jetpack_calypso_nudge_dismiss_comics';
				break;
			case 'comments':
				$event = 'jetpack_calypso_nudge_dismiss_comments';
				break;
			case 'taxonomies':
				$event = 'jetpack_calypso_nudge_dismiss_taxonomies';
				break;
			default:
				return;
		}

		// record in Tracks
		jetpack_tracks_record_event( wp_get_current_user(), $event );
	}

	protected function redirect_with_slug( $screen ) {
		switch ( $screen ) {
			case 'manage_post':
				$url = 'https://wordpress.com/posts/';
				break;
			case 'add_post':
				$url = 'https://wordpress.com/post/';
				break;
			case 'manage_page':
				$url = 'https://wordpress.com/pages/';
				break;
			case 'add_page':
				$url = 'https://wordpress.com/page/';
				break;
			case 'manage_media':
			case 'add_media':
				$url = 'https://wordpress.com/media/';
				break;
			case 'manage_testimonial':
				$url = 'https://wordpress.com/types/jetpack-testimonial/';
				break;
			case 'add_testimonial':
				$url = 'https://wordpress.com/edit/jetpack-testimonial/';
				break;
			case 'manage_portfolio':
				$url = 'https://wordpress.com/types/jetpack-portfolio/';
				break;
			case 'add_portfolio':
				$url = 'https://wordpress.com/edit/jetpack-portfolio/';
				break;
			case 'manage_food_menu':
				$url = 'https://wordpress.com/types/nova_menu_item/';
				break;
			case 'add_food_menu':
				$url = 'https://wordpress.com/edit/nova_menu_item/';
				break;
			case 'manage_comic':
				$url = 'https://wordpress.com/types/jetpack-comic/';
				break;
			case 'add_comic':
				$url = 'https://wordpress.com/edit/jetpack-comic/';
				break;
			case 'manage_comment':
				$url = 'https://wordpress.com/comments/all/';
				break;
			case 'manage_category':
				$url = 'https://wordpress.com/settings/taxonomies/category/';
				break;
			case 'manage_tag':
				$url = 'https://wordpress.com/settings/taxonomies/post_tag/';
				break;
			default:
				wp_safe_redirect( get_dashboard_url() );
				exit;
		}

		$site_slug = Jetpack::build_raw_urls( get_home_url() );
		wp_safe_redirect( $url . $site_slug );
		exit;
	}

	public function enqueue_scripts() {
		$screen = $this->get_screen();
		if ( ! $screen ) {
			return;
		}

		wp_enqueue_script( 'jetpack-calypso-nudges-js', plugins_url( 'calypso-nudges.js', __FILE__ ), array(), '20171114', true );
		wp_enqueue_style( 'jetpack-calypso-nudges-css', plugins_url( 'calypso-nudges.css' , __FILE__ ), array(), '20171114' );
		wp_style_add_data( 'jetpack-calypso-nudges-css', 'rtl', 'replace' );

		wp_localize_script( 'jetpack-calypso-nudges-js', 'jetpackCalypsoNudges', array(
			'cookieGroup' => $this->get_cookie_group( $screen['id'] ),
			'nonce' => wp_create_nonce( 'jetpack-calypso-nudges-dismiss-nonce' ),
		) );
	}

	protected function is_dismissed( $screen ) {
		$group = $this->get_cookie_group( $screen['id']);
		$cookie = "jetpack_nudge_dismissed_{$group}";
		return ! empty( $_COOKIE[ $cookie ] );
	}

	protected function get_cookie_group( $screen_id ) {
		switch ( $screen_id ) {
			case 'manage_post':
			case 'add_post':
				return 'posts';
				break;
			case 'manage_page':
			case 'add_page':
				return 'pages';
				break;
			case 'manage_media':
			case 'add_media':
				return 'media';
				break;
			case 'manage_testimonial':
			case 'add_testimonial':
				return 'testimonials';
				break;
			case 'manage_portfolio':
			case 'add_portfolio':
				return 'portfolios';				
				break;
			case 'manage_food_menu':
			case 'add_food_menu':
				return 'food_menus';				
				break;
			case 'manage_comic':
			case 'add_comic':
				return 'comics';				
				break;
			case 'manage_comment':
				return 'comments';
				break;
			case 'manage_category':
			case 'manage_tag':
				return 'taxonomies';
				break;
		}
		return false;
	}

	public function update_allowed_redirect_hosts( $allowed ) {
		array_push( $allowed, 'wordpress.com' );
		return array_unique( $allowed );
	}
}

new Jetpack_Calypso_Nudges();
