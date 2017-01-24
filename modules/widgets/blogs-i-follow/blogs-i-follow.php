<?php

/**
 * Plugin Name: Blogs I Follow Widget
 */

include dirname( __FILE__ ) . '/compat.php';
include dirname( __FILE__ ) . '/blogs-i-follow-adapter.php';

/**
 * Register the widget for use in Appearance -> Widgets
 */
add_action( 'widgets_init', 'jetpack_blogs_i_follow_widget_init' );

function jetpack_blogs_i_follow_widget_init() {
	// TODO: Remove the temporary debug check
	if ( Jetpack::is_active() || WP_DEBUG ) {
		register_widget( 'Jetpack_Widget_Blogs_I_Follow' );
	}
}

/**
 * Blogs I Follow Widget class
 * Displays blogs followed by the specified user
 */

class Jetpack_Widget_Blogs_I_Follow extends WP_Widget {
	public $subscriptions;
	public $user_id;
	static $expiration     = 300;
	static $avatar_size    = 200;
	static $default_avatar = 'en.wordpress.com/i/logo/wpcom-gray-white.png';
	private $adapter;

	/**
	 * class constructor
	 * declare the widget as a widget and set some class/instance vars
	 *
	 * @return void
	 */
	function __construct() {

		parent::__construct( 'jp_blogs_i_follow', __( 'Blogs I Follow', 'jetpack' ), array( 'classname' => 'widget_jp_blogs_i_follow', 'description' => __( 'Display linked images for the blogs you follow', 'jetpack' ) ) );

		if ( is_active_widget( false, false, $this->id_base ) || is_active_widget( false, false, 'monster' ) ) {
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_script' ) );
			add_action( 'wp_print_styles', array( $this, 'enqueue_style' ) );
			add_action( 'wp_footer', array( $this, 'footer' ) );
		}

		$this->subscriptions = array();
		$this->adapter = ( defined( 'IS_WPCOM' ) && IS_WPCOM )
			? new Blogs_I_Follow_WPCOM_adapter
			: new Blogs_I_Follow_Jetpack_adapter;
	}

	/**
	 * widget output
	 * displays the subscriptions for the selected user id
	 * displays nothing if there are no subscriptions
	 * or a friendly message if the current user is the user to whom the widget belongs
	 *
	 * @param array $args the global widget args
	 * @param array $instance the settings for the current widget instance
	 * @return void
	 */
	function widget( $args, $instance ) {
		$instance = $this->extend_default_options( $instance );

		$this->user_id = $instance['user_id'];
		$this->number = $instance['number'];
		$this->display = $instance['display'];

		$subscriptions = $this->get_subscriptions();

		if ( $this->shouldnt_show( $subscriptions ) ) {
			return;
		}

		$title = apply_filters( 'widget_title', $instance['title'] );

		echo $args['before_widget'];

		if ( ! empty( $title ) )
			echo $args['before_title'] . $title . $args['after_title'];

		if ( ! empty( $subscriptions ) ) {
			if ( 'grid' === $this->display ) {
				echo $this->grid_view( $subscriptions );
			} else {
				echo $this->list_view( $subscriptions );
			}
		} elseif ( current_user_can( 'edit_theme_options' ) ) {
			echo $this->get_friendly_message();
		}

		// Track the usage stats for this widget
		echo $args['after_widget'];
		$this->adapter->stats_extra();
	}

	/**
	 * get the subscriptions used by the widget
	 * result is cached using a transient
	 *
	 * @return array the subscriptions
	 */
	function get_subscriptions() {
		$this->subscriptions[$this->id] = get_transient( $this->id . '-subscriptions' );

		// TODO: Remove DEBUG
		if ( WP_DEBUG || empty( $this->subscriptions[$this->id] ) ) {
			delete_transient( $this->id . '-widget' );

			$this->subscriptions[$this->id] = array();
			$this->subscriptions[$this->id]['user_id'] = $this->user_id;
			$this->subscriptions[$this->id]['subscriptions'] = $this->adapter->get_followed_blogs( array( 'user_id' => $this->user_id, 'public_only' => true ) );

			if ( is_array( $this->subscriptions[$this->id]['subscriptions'] ) ) {
				foreach ( $this->subscriptions[$this->id]['subscriptions'] as &$sub ) {
					if ( ! wp_startswith( $sub['blog_url'], 'http://' ) && ! wp_startswith( $sub['blog_url'], 'https://' ) ) {
						$sub['blog_url'] = 'http://' . $sub['blog_url'];
					}
				}

				if ( !empty( $this->subscriptions[$this->id]['subscriptions'] ) ) {
					$this->subscriptions[$this->id]['subscriptions'] = array_slice( $this->subscriptions[$this->id]['subscriptions'], 0, $this->number );
					set_transient( $this->id . '-subscriptions', $this->subscriptions[$this->id], self::$expiration );
				}
			}
		}

		return $this->subscriptions[$this->id]['subscriptions'];
	}

	/**
	 * determine if the widget should be hidden or shown
	 *
	 * @param array $subscriptions the subscriptions for the current widget
	 * @return bool
	 */
	function shouldnt_show( $subscriptions ) {
		return ( empty( $subscriptions ) && get_current_user_id() != $this->user_id );
	}

	/**
	 * Infer the blog name from the subcription URL(s) when the name is not available
	 *
	 * @param array $subscription the subscription data lacking a blog name
	 * @return string the inferred blog name
	 */
	function get_inferred_blog_name( $subscription ) {
		return rtrim( str_replace( 'http://', '', empty( $subscription['blog_url'] ) ? $subscription['feed_url'] : $subscription['blog_url'] ), '/' );
	}

	function grid_view( $subscriptions ) {
		wp_enqueue_style( 'hover-bubbles' );

		// We are caching the HTML output because the blavatar functions
		// make either queries or HTTP requests, so they are slow.
		$output = get_transient( $this->id . '-widget' );

		if ( empty( $output ) ) {

			$output  = '';

			$output .= "<div class='widgets-grid-layout no-grav'>";

			$i = 0;
			foreach ( $subscriptions as $subscription ) {
				$i++;
				$img = false;

				if ( 'http://' === $subscription['blog_url'] )
					$subscription['blog_url'] = $subscription['feed_url'];

				$img = $this->adapter->get_blavatar( $subscription['blog_url'], self::$avatar_size );

				if ( !$img ) {
					if ( !empty( $subscription['blog_id'] ) ) {
						$email = $this->adapter->get_blog_option( $subscription['blog_id'], 'admin_email' );
						$http = is_ssl() ? 'https' : 'http';
						$img = get_avatar( $email, self::$avatar_size, $this->adapter->staticize_subdomain( esc_url_raw( $http . '://' . self::$default_avatar ) ) );
					}
				}
				if ( !$img )
					continue;

				$blog_name = empty( $subscription['blog_name'] ) ? $this->get_inferred_blog_name( $subscription ) : $subscription['blog_name'];
				$output .= "<div class='widget-grid-view-image wpcom-follow-gravatar'>";
				$output .= "<a href='"  . esc_url( $subscription['blog_url'] ) . "' title='" . esc_attr( $blog_name ) . "' data-id='" . esc_attr( 'wpcom-bubble-' . $this->id . '-' . $i ) . "' class='bump-view' data-bump-view='bif'>";
				$output .= $img;
				$output .= "</a>";
				$output .= "</div>";
			}

			$output .= "</div><div style='clear: both;'></div>";

			set_transient( $this->id . '-widget', $output, self::$expiration );
		}

		return $output;
	}

	/**
	 * Simple HTML list view of the subscriptions. Just showing blog name with a link.
	 * @param  array $subscriptions All subscription data
	 * @return String containing full OL>LI list.
	 */
	function list_view( $subscriptions ) {
		$output = '';

		if ( count( $subscriptions ) ) {
			$output .= '<ul>';
			foreach ( $subscriptions as $sub ) {
				if ( 'http://' === $sub['blog_url'] )
					$sub['blog_url'] = $sub['feed_url'];

				if ( empty( $sub['blog_name'] ) ) {
					$sub['blog_name'] = $this->get_inferred_blog_name($sub);
				}

				$output .= '<li><a href="' . esc_url( $sub['blog_url'] ) . '" class="bump-view" data-bump-view="bif">' . esc_html( $sub['blog_name'] ) . '</a></li>';
			}
			$output .= '</ul>';
		}

		return $output;
	}

	/**
	 * output for friendly message
	 * displayed when there are no subscriptions and
	 * the current user is the user to whom the widget belongs
	 *
	 * @return string the message
	 */
	function get_friendly_message() {
		$message = sprintf(
			__( 'You are not yet following any blogs. Try <a href="%1$s">finding your friends</a> or check out our <a href="%2$s">recommended blogs</a>.', 'jetpack' ),
			esc_url( $this->adapter->get_blog_locale() . '.wordpress.com/find-friends' ) . '" target="_blank',
			esc_url( $this->adapter->get_blog_locale() . '.wordpress.com/recommendations' ) . '" target="_blank'
		);

		return '<p>' . $message . '</p>';
	}

	/**
	 * widget save update
	 *
	 * @param array $new_instance the widget instance being saved
	 * @param array $old_instance the widget instance, prior to being saved
	 * @return array $instance, the saved widget instance
	 */
	function update( $new_instance, $old_instance ) {
		$instance = array();

		$instance['title']  = wp_kses( $new_instance['title'], array() );
		$instance['number'] = absint( $new_instance['number'] );

		$instance['user_id'] = (int) $new_instance['user_id'];
		if ( empty( $instance['user_id'] ) ) {
			$instance['user_id'] = absint( get_current_user_id() );			
		}

		if ( $instance['number'] < 1 || $instance['number'] > 50 ) {
			$instance['number'] = 20;
		}

		$instance['display'] = isset( $new_instance['display'] ) && 'grid' == $new_instance['display'] ? 'grid' : 'list';

		// void the transients
		delete_transient( $this->id . '-subscriptions' );
		delete_transient( $this->id . '-widget' );

		// generate the first set of subscriptions
		$this->get_subscriptions();

		return $instance;
	}

	/**
	 * display the widget admin form
	 *
	 * @param array $instance the current widget instance
	 *
	 * @return void
	 */
	function form( $instance ) {
		$instance = $this->extend_default_options( $instance );
		$display = $instance['display'];

		if ( empty( $instance['user_id']  ) ) {
			$instance['user_id'] = get_current_user_id();
		}
		?>
		<p>
			<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php esc_html_e( 'Title:', 'jetpack' ); ?></label>
			<input type="text" class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" value="<?php echo esc_attr( $instance['title'] ); ?>" />
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'number' ); ?>"><?php esc_html_e( 'Number of blogs to show:', 'jetpack' ); ?>
				<input type="number" id="<?php echo $this->get_field_id( 'number' ); ?>" name="<?php echo $this->get_field_name( 'number' ); ?>" value="<?php echo esc_attr( $instance['number'] ); ?>" min="1" max="50" />
				<br><small><?php esc_html_e( '(at most 50)', 'jetpack' ) ?> <a href="https://en.support.wordpress.com/widgets/blogs-i-follow-widget/" target="_blank">( ? )</a></small>
			</label>
		</p>

		<p>
			<label><?php esc_html_e( 'Display as:', 'jetpack' ); ?></label>
			<ul>
				<li><label><input id="<?php echo $this->get_field_id( 'display' ); ?>-list" name="<?php echo $this->get_field_name( 'display' ); ?>" type="radio" value="list" <?php checked( 'list', $display ); ?> /> <?php esc_html_e( 'List', 'jetpack' ); ?></label></li>
				<li><label><input id="<?php echo $this->get_field_id( 'display' ); ?>-grid" name="<?php echo $this->get_field_name( 'display' ); ?>" type="radio" value="grid" <?php checked( 'grid', $display ); ?> /> <?php esc_html_e( 'Grid', 'jetpack' ); ?></label></li>
			</ul>
		</p>

		<input type="hidden" id="<?php echo $this->get_field_id( 'user_id' ); ?>" name="<?php echo $this->get_field_name( 'user_id' ); ?>" value="<?php echo esc_attr( (int) $instance['user_id'] ); ?>" />
		<?php
	}

	/**
	 * enqueue necessary scripts for the hovers
	 * only called when the widget is active
	 *
	 * @return void
	 */
	function enqueue_script() {
		// TODO: This seems to have no effect in WPCOM and there is no Jetpack equivalent.
		// Should the call to enable_follow_buttons be removed?
		$this->adapter->enable_follow_buttons();
		wp_enqueue_script( 'jp-widget-follow-blogs', plugins_url( 'blogs-i-follow.js', __FILE__ ), array( 'jquery' ), false, true );
		wp_enqueue_script( 'widget-bump-view' );
	}

	/**
	 * enqueue necessary scripts for the hovers
	 * only called when the widget is active
	 *
	 * @return void
	 */
	function enqueue_style() {
		wp_enqueue_style(
			'blogs-i-follow-widget',
			plugins_url( 'blogs-i-follow.css', __FILE__ ),
			array(),
			'20120712a'
		);
		wp_enqueue_style(
			'blogs-i-follow-widget-grid',
			plugins_url( 'widget-grid-and-list.css', __FILE__ ),
			array(),
			JETPACK__VERSION
		);
		wp_enqueue_style(
			'blogs-i-follow-widget-bubbles',
			plugins_url( 'hover-bubbles.css', __FILE__ ),
			array(),
			JETPACK__VERSION
		);
	}

	/**
	 * generate markup used for the bla/gra/vatar hover/popups
	 * only when the widget is active & there's active subscriptions
	 *
	 * @return void
	 */
	function footer() {
		if ( ! is_active_widget( false, false, $this->id_base ) && ! empty( $this->subscriptions ) )
			return;

		foreach ( $this->subscriptions as $widget_id => $sub ) {
			if ( ! empty( $sub['subscriptions'] ) ) {
				$i = 0;
				$output = '<div id="wpcom-follow-bubbles-' . $widget_id . '" class="wpcom-follow-bubbles">';

				foreach ( $sub['subscriptions'] as $subscription ) {
					$i++;
					$description = $this->adapter->get_blog_option( $subscription['blog_id'], 'blogdescription' );
					$description = ( !empty( $description ) ) ? '<small>' .  $description . '</small>' : '';
					$blog_name = empty( $subscription['blog_name'] ) ? $this->get_inferred_blog_name( $subscription ) : $subscription['blog_name'];
					$output .= '<div id="' . esc_attr( 'wpcom-bubble-' . $widget_id . '-' . $i ) . '" class="wpcom-bubble wpcom-follow-bubble"><div class="bubble-txt"><a href="' . esc_url( $subscription['blog_url'] ) . '" class="bump-view" data-bump-view="bif">' . $blog_name . '</a>';
					$output .= empty( $description ) ? '' : '<p>' . $description . '</p>';
					$output .= '</div></div>';
				}

				$output .= '</div>';
			}

			echo $output;
		}
	}

	function extend_default_options( $options ) {
		$defaults = array(
			'title' => __( 'Blogs I Follow', 'jetpack' ),
			'number' => 20,
			'user_id' => get_current_user_id(),
			'display' => 'list'
		);

		$merged = array_merge( $defaults, $options );

		if ( ! in_array( $merged['display'], array( 'grid', 'list' ) ) ) {
			$merged['display'] = 'list';
		}

		return $merged;
	}
}
