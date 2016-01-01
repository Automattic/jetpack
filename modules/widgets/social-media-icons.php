<?php
/*
Plugin Name: Social Media Icons Widget
Description: A simple widget that displays social media icons
Author: Chris Rudzki
*/

// Creating the widget

class WPCOM_social_media_icons_widget extends WP_Widget {

	private $defaults;

	private $services;

	public function __construct() {
		parent::__construct(
			'wpcom_social_media_icons_widget',
			/** This filter is documented in modules/widgets/facebook-likebox.php */
			apply_filters( 'jetpack_widget_name', esc_html__( 'Social Media Icons', 'jetpack' ) ),
			array( 'description' => __( 'A simple widget that displays social media icons.', 'jetpack' ), )
		);

		$this->defaults = array(
			'title'              => __( 'Social', 'jetpack' ),
			'facebook_username'  => '',
			'facebook_publicize' => '',
			'facebook_publicize_id'  => '',
			'twitter_username'   => '',
			'twitter_publicize'  => '',
			'twitter_publicize_id'  => '',
			'instagram_username' => '',
			'pinterest_username' => '',
			'linkedin_username'  => '',
			'linkedin_publicize' => '',
			'linkedin_publicize_id'  => '',
			'github_username'    => '',
			'youtube_username'   => '',
			'vimeo_username'     => '',
			'google_plus_username'  => '',
			'google_plus_publicize' => '',
			'google_plus_publicize_id'  => '',
		);

		$this->services = array(
			'facebook'   => array( 'Facebook', 'https://www.facebook.com/%s/' ),
			'twitter'    => array( 'Twitter', 'https://twitter.com/%s/' ),
			'instagram'  => array( 'Instagram', 'https://instagram.com/%s/' ),
			'pinterest'  => array( 'Pinterest', 'https://www.pinterest.com/%s/' ),
			'linkedin'   => array( 'LinkedIn', 'https://www.linkedin.com/in/%s/' ),
			'github'     => array( 'GitHub', 'https://github.com/%s/' ),
			'youtube'    => array( 'YouTube', 'https://www.youtube.com/%s/' ),
			'vimeo'      => array( 'Vimeo', 'https://vimeo.com/%s/' ),
			'google_plus' => array( 'Google+', 'https://plus.google.com/u/0/%s/' ),
		);

		if ( is_active_widget( false, false, $this->id_base ) ) {
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_style' ) );
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_style' ) );
		}
	}

	public function enqueue_style() {
		wp_register_style( 'jetpack_social_media_icons_widget', plugins_url( 'social-media-icons/style.css', __FILE__ ), array(), '20150602' );
		wp_enqueue_style( 'jetpack_social_media_icons_widget' );
	}

	public function enqueue_admin_style() {
		wp_register_style( 'jetpack_social_media_icons_widget_admin', plugins_url( 'social-media-icons/admin-style.css', __FILE__ ), array(), '20151230' );
		wp_enqueue_style( 'jetpack_social_media_icons_widget_admin' );
	}

	private function check_genericons() {
		global $wp_styles;

		foreach ( $wp_styles->queue as $handle ) {
			if ( false !== stristr( $handle, 'genericons' ) ) {
				return $handle;
			}
		}

		return false;
	}

	// front end
	public function widget( $args, $instance ) {
		$instance = wp_parse_args( (array) $instance, $this->defaults );
		/** This filter is documented in core/src/wp-includes/default-widgets.php */
		$instance['title'] = apply_filters( 'widget_title', $instance['title'], $instance, $this->id_base );

		if ( ! $this->check_genericons() ) {
			wp_enqueue_style( 'genericons' );
		}

		$index = 10;
		$html = array();

		$alt_text = esc_attr__( 'View %1$s&#8217;s profile on %2$s', 'jetpack' );

		if( Jetpack::is_module_active( 'publicize' ) ) {
			$publicize = new Publicize;
		}

		foreach ( $this->services as $service => $data ) {
			list( $service_name, $url ) = $data;


			if( Jetpack::is_module_active( 'publicize' ) && 
				isset( $instance[ $service . '_publicize' ] ) && 
				$instance[ $service . '_publicize' ] === '1' &&
				isset( $instance[ $service . '_publicize_id' ] ) ) {
				
				$publicize_connection = $this->get_publicize_connection( $service, $instance[ $service . '_publicize_id' ] );
				if( false === $publicize_connection ) {
					continue;
				}

				$link = $publicize->get_profile_link( $service, $publicize_connection );
				$name = $publicize->get_display_name( $service, $publicize_connection );

				$link_alt_text = sprintf( $alt_text, esc_html( $name ), $service_name );
			} else {
				if ( ! isset( $instance[ $service . '_username' ] ) ) {
					continue;
				}
				$username = $link_username = $instance[ $service . '_username' ];

				if ( empty( $username ) ) {
					continue;
				}

				if (
					$service === 'google_plus'
					&& ! is_numeric( $username )
					&& substr( $username, 0, 1 ) !== "+"
				) {
					$link_username = "+" . $username;
				}

				if ( $service === 'youtube' && substr( $username, 0, 2 ) == 'UC' ) {
					$link_username = "channel/" . $username;
				} else if ( $service === 'youtube' ) {
					$link_username = "user/" . $username;
				}

				$link = esc_url( sprintf( $url, $link_username ) );
				$link_alt_text = sprintf( $alt_text, esc_html( $username ), $service_name );
			}

			$index += 10;

			/**
			 * Fires for each profile link in the social icons widget. Can be used
			 * to change the links for certain social networks if needed.
			 *
			 * @module widgets
			 *
			 * @since 3.8.0
			 *
			 * @param string $url the currently processed URL
			 * @param string $service the lowercase service slug, e.g. 'facebook', 'youtube', etc.
			 */
			$link = apply_filters( 'jetpack_social_media_icons_widget_profile_link', $link, $service );

			$html[ $index ] =
				'<a title="' . $link_alt_text . '" href="' . $link . '" class="genericon genericon-' . str_replace( '_', '', $service ) . '" target="_blank">'
				. '<span class="screen-reader-text">' . $link_alt_text . '</span></a>';
		}

		/**
		 * Fires at the end of the list of Social Media accounts.
		 * Can be used to add a new Social Media Site to the Social Media Icons Widget.
		 * The filter function passed the array of HTML entries that will be sorted
		 * by key, each wrapped in a list item element and output as an unsorted list.
		 *
		 * @module widgets
		 *
		 * @since 3.8.0
		 *
		 * @param array $html Associative array of HTML snippets per each icon.
		 */
		$html = apply_filters( 'jetpack_social_media_icons_widget_array', $html );

		ksort( $html );
		$html = '<ul><li>' . join( '</li><li>', $html ) . '</li></ul>';

		if ( ! empty( $instance['title'] ) ) {
			$html = $args['before_title'] . esc_html( $instance['title'] ) . $args['after_title'] . $html;
		}

		$html = $args['before_widget'] . $html . $args['after_widget'];

		/**
		 * Filters the Social Media Icons widget output.
		 *
		 * @module widgets
		 *
		 * @since 3.6.0
		 *
		 * @param string $html Social Media Icons widget html output.
		 */
		echo apply_filters( 'jetpack_social_media_icons_widget_output', $html );
	}

	// backend
	public function form( $instance ) {
		$instance = wp_parse_args( (array) $instance, $this->defaults );

		?>
			<p>
				<label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"><?php _e( 'Title:', 'jetpack' ); ?></label>
				<input
						class="widefat"
						id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"
						name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>"
						type="text"
						value="<?php echo esc_attr( $instance['title'] ); ?>"
					/>
			</p>
		<?php

		foreach ( $this->services as $service => $data ) {
			list( $service_name, $url ) = $data;
			?>
			
			<fieldset class="social-media-icons-widget">
				<legend><?php _e( $service_name, 'jetpack' ); ?></legend>
				
				<p>
				<label for="<?php echo esc_attr( $this->get_field_id( $service . '_username' ) ); ?>">
					<?php _e( 'Username:', 'jetpack' ); ?>
				</label>					
				<input
						class="widefat"
						id="<?php echo esc_attr( $this->get_field_id( $service . '_username' ) ); ?>"
						name="<?php echo esc_attr( $this->get_field_name( $service . '_username' ) ); ?>"
						type="text"
						value="<?php echo esc_attr( $instance[ $service . '_username'] ); ?>"
					/>
				<?php
				if( isset( $instance[ $service . '_publicize'] ) && 
					isset( $instance[ $service . '_publicize_id' ] ) ): ?>

					<?php if( Jetpack::is_module_active( 'publicize' ) ): ?>
						</p>
						<p>
						<?php
						$publicize_users = $this->get_publicize_users_for_service( $service );
						if( empty( $publicize_users ) ):
							?>
							<em><?php _e( 'No publicized users.', 'jetpack' ); ?></em><br />
							<a href="<?php echo admin_url( 'options-general.php?page=sharing' ); ?>" target="_blank">
								<?php printf( __( 'Connect your blog to %s.', 'jetpack' ), $service_name ); ?>
							</a>
							<?php
						else:
							?>
							<input
								id="<?php echo esc_attr( $this->get_field_id( $service . '_publicize' ) ); ?>"
								name="<?php echo esc_attr( $this->get_field_name( $service . '_publicize' ) ); ?>"
								type="checkbox"
								value="1"
								<?php checked( '1', $instance[ $service . '_publicize' ] ); ?>
							/>
							Use Publicize user: <br />
							<select
								class="widefat"
								id="<?php echo esc_attr( $this->get_field_id( $service . '_publicize_id' ) ); ?>"
								name="<?php echo esc_attr( $this->get_field_name( $service . '_publicize_id' ) ); ?>"
							>
								<?php foreach( $publicize_users as $user ): ?>
									<option value="<?php echo $user->ID; ?>"
										<?php selected( $instance[ $service . '_publicize_id' ], $user->ID ); ?>>
										<?php echo $user->user_login; ?>
									</option>
								<?php endforeach; ?>
							</select>
							<?php
						endif;
						?>
					<?php else: ?>
						<input 
							id="<?php echo esc_attr( $this->get_field_id( $service . '_publicize' ) ); ?>"
							name="<?php echo esc_attr( $this->get_field_name( $service . '_publicize' ) ); ?>"
							type="hidden"
							value=""
						/>
					<?php endif; ?>

				<?php endif; ?>
				</p>
				</legend>
			</fieldset>
			<?php
		}
	}

	// updating widget settings
	public function update( $new_instance, $old_instance ) {
		$new_instance = wp_parse_args( $new_instance, $this->defaults );
		$instance = (array) $old_instance;

		foreach ( $new_instance as $field => $value ) {
			$instance[$field] = sanitize_text_field( $new_instance[$field] );
		}

		// Stats
		$stats = array();
		foreach( $this->services as $service_name => $service ) {
			if( isset( $instance[ $service_name . '_publicize' ] ) && 
				$instance[ $service_name . '_publicize' ] == '1' &&
				! empty( $instance[ $service_name . '_publicize_id'] ) ) {
				$stats[] = $service_name;
			}
			elseif( isset( $instance[ $service_name . '_username'] ) &&
				$instance[ $service_name . '_username' ] ) {
				$stats[] = $service_name;
			}
		}

		foreach ( $stats as $val ) {
			/**
			 * Fires for each Social Media account being saved in the Social Media Widget settings.
			 *
			 * @module widgets
			 *
			 * @since 3.6.0
			 *
			 * @param string social-media-links-widget-svcs Type of action to track.
			 * @param string $val Name of the Social Media account being saved.
			 */
			do_action( 'jetpack_bump_stats_extras', 'social-media-links-widget-svcs', $val ) ;
		}

		return $instance;
	}

	// Remove username from value before to save stats
	public function remove_username( $val ) {
		return str_replace( '_username', '', $val );
	}

	public function get_publicize_connection( $service_name, $user_id )
	{
		$user_ids = array( 0, $user_id );

		$all_connections = Jetpack_Options::get_option( 'publicize_connections' );

		if( empty( $all_connections ) || 
			! is_array( $all_connections ) || 
			! isset( $all_connections[ $service_name ] ) ) {
			return FALSE;
		}

		foreach( $all_connections[ $service_name ] as $connection ) {
			if( in_array( $connection['connection_data']['user_id'], $user_ids ) ) {
				return $connection;
			}
		}

		return FALSE;
	}

	public function get_publicize_users_for_service( $service_name ) {
		$users = array();

		$all_connections = Jetpack_Options::get_option( 'publicize_connections' );

		if( !empty( $all_connections ) && 
			is_array( $all_connections ) && 
			isset( $all_connections[ $service_name ] ) ) {
			foreach( $all_connections[ $service_name ] as $connection ) {
				$user = get_user_by( 'id', $connection['connection_data']['user_id'] );
				if( ! $user ) {
					continue;
				}

				$users[] = $user;
			}
		}

		return $users;
	}

} // class ends here

// register and load the widget
function wpcom_social_media_icons_widget_load_widget() {
	register_widget( 'wpcom_social_media_icons_widget' );
}
add_action( 'widgets_init', 'wpcom_social_media_icons_widget_load_widget' );
