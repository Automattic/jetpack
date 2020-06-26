<?php

use Automattic\Jetpack\Device_Detection\User_Agent_Info;

abstract class Sharing_Source {
	public	  $button_style;
	public	  $smart;
	protected $open_link_in_new;
	protected $id;

	public function __construct( $id, array $settings ) {
		$this->id = $id;
		/**
		 * Filter the way sharing links open.
		 *
		 * By default, sharing links open in a new window.
		 *
		 * @module sharedaddy
		 *
		 * @since 3.4.0
		 *
		 * @param bool true Should Sharing links open in a new window. Default to true.
		 */
		$this->open_link_in_new = apply_filters( 'jetpack_open_sharing_in_new_window', true );

		if ( isset( $settings['button_style'] ) ) {
			$this->button_style = $settings['button_style'];
		}

		if ( isset( $settings['smart'] ) ) {
			$this->smart = $settings['smart'];
		}
	}

	public function is_deprecated() {
		return false;
	}

	public function http() {
		return is_ssl() ? 'https' : 'http';
	}

	public function get_id() {
		return $this->id;
	}

	public function get_class() {
		return $this->id;
	}

	public function get_share_url( $post_id ) {
		/**
		 * Filter the sharing permalink.
		 *
		 * @module sharedaddy
		 *
		 * @since 1.2.0
		 *
		 * @param string get_permalink( $post_id ) Post Permalink.
		 * @param int $post_id Post ID.
		 * @param int $this->id Sharing ID.
		 */
		return apply_filters( 'sharing_permalink', get_permalink( $post_id ), $post_id, $this->id );
	}

	public function get_share_title( $post_id ) {
		$post = get_post( $post_id );
		/**
		 * Filter the sharing title.
		 *
		 * @module sharedaddy
		 *
		 * @since 2.8.0
		 *
		 * @param string $post->post_title Post Title.
		 * @param int $post_id Post ID.
		 * @param int $this->id Sharing ID.
		 */
		$title = apply_filters( 'sharing_title', $post->post_title, $post_id, $this->id );

		return html_entity_decode( wp_kses( $title, null ) );
	}

	public function has_custom_button_style() {
		return false;
	}

	public function get_link( $url, $text, $title, $query = '', $id = false ) {
		$args = func_get_args();
		$klasses = array( 'share-' . $this->get_class(), 'sd-button' );

		if ( 'icon' == $this->button_style || 'icon-text' == $this->button_style ) {
			$klasses[] = 'share-icon';
		}

		if ( 'icon' == $this->button_style ) {
			$text = $title;
			$klasses[] = 'no-text';

			if ( true == $this->open_link_in_new ) {
				$text .= __( ' (Opens in new window)', 'jetpack' );
			}
		}

		/**
		 * Filter the sharing display ID.
		 *
		 * @module sharedaddy
		 *
		 * @since 3.4.0
		 *
		 * @param int|false $id Sharing ID.
		 * @param object $this Sharing service properties.
		 * @param array $args Array of sharing service options.
		 */
		$id = apply_filters( 'jetpack_sharing_display_id', $id, $this, $args );
		/**
		 * Filter the sharing display link.
		 *
		 * @module sharedaddy
		 *
		 * @since 2.8.0
		 *
		 * @param string $url Post URL.
		 * @param object $this Sharing service properties.
		 * @param int|false $id Sharing ID.
		 * @param array $args Array of sharing service options.
		 */
		$url = apply_filters( 'sharing_display_link', $url, $this, $id, $args ); // backwards compatibility
		/**
		 * Filter the sharing display link.
		 *
		 * @module sharedaddy
		 *
		 * @since 2.8.0
		 *
		 * @param string $url Post URL.
		 * @param object $this Sharing service properties.
		 * @param int|false $id Sharing ID.
		 * @param array $args Array of sharing service options.
		 */
		$url = apply_filters( 'jetpack_sharing_display_link', $url, $this, $id, $args );
		/**
		 * Filter the sharing display query.
		 *
		 * @module sharedaddy
		 *
		 * @since 2.8.0
		 *
		 * @param string $query Sharing service URL parameter.
		 * @param object $this Sharing service properties.
		 * @param int|false $id Sharing ID.
		 * @param array $args Array of sharing service options.
		 */
		$query = apply_filters( 'jetpack_sharing_display_query', $query, $this, $id, $args );

		if ( ! empty( $query ) ) {
			if ( false === stripos( $url, '?' ) ) {
				$url .= '?' . $query;
			} else {
				$url .= '&amp;' . $query;
			}
		}

		if ( 'text' == $this->button_style ) {
			$klasses[] = 'no-icon';
		}

		/**
		 * Filter the sharing display classes.
		 *
		 * @module sharedaddy
		 *
		 * @since 3.4.0
		 *
		 * @param array $klasses Sharing service classes.
		 * @param object $this Sharing service properties.
		 * @param int|false $id Sharing ID.
		 * @param array $args Array of sharing service options.
		 */
		$klasses = apply_filters( 'jetpack_sharing_display_classes', $klasses, $this, $id, $args );
		/**
		 * Filter the sharing display title.
		 *
		 * @module sharedaddy
		 *
		 * @since 3.4.0
		 *
		 * @param string $title Sharing service title.
		 * @param object $this Sharing service properties.
		 * @param int|false $id Sharing ID.
		 * @param array $args Array of sharing service options.
		 */
		$title = apply_filters( 'jetpack_sharing_display_title', $title, $this, $id, $args );
		/**
		 * Filter the sharing display text.
		 *
		 * @module sharedaddy
		 *
		 * @since 3.4.0
		 *
		 * @param string $text Sharing service text.
		 * @param object $this Sharing service properties.
		 * @param int|false $id Sharing ID.
		 * @param array $args Array of sharing service options.
		 */
		$text = apply_filters( 'jetpack_sharing_display_text', $text, $this, $id, $args );

		return sprintf(
			'<a rel="nofollow%s" data-shared="%s" class="%s" href="%s"%s title="%s"><span%s>%s</span></a>',
			( true == $this->open_link_in_new ) ? ' noopener noreferrer' : '',
			( $id ? esc_attr( $id ) : '' ),
			implode( ' ', $klasses ),
			$url,
			( true == $this->open_link_in_new ) ? ' target="_blank"' : '',
			$title,
			( 'icon' == $this->button_style ) ? '></span><span class="sharing-screen-reader-text"' : '',
			$text
		);
	}

	/**
	 * Get an unfiltered post permalink to use when generating a sharing URL with get_link.
	 * Use instead of get_share_url for non-official styles as get_permalink ensures that process_request
	 * will be executed more reliably, in the case that the filtered URL uses a service that strips query parameters.
	 *
	 * @since 3.7.0
	 * @param int $post_id Post ID.
	 * @uses get_permalink
	 * @return string get_permalink( $post_id ) Post permalink.
	 */
	public function get_process_request_url( $post_id ) {
		return get_permalink( $post_id );
	}

	abstract public function get_name();
	abstract public function get_display( $post );

	public function display_header() {
	}

	public function display_footer() {
	}

	public function has_advanced_options() {
		return false;
	}

	/**
	 * Get the AMP specific markup for a sharing button.
	 *
	 * @param \WP_Post $post The current post being viewed.
	 */
	public function get_amp_display( $post ) {
		// Only display markup if we're on a post.
		if ( empty( $post ) ) {
			return false;
		}

		return $this->build_amp_markup();
	}

	/**
	 * Generates and returns the markup for an AMP sharing button.
	 *
	 * @param array $attrs Custom attributes for rendering the social icon.
	 */
	protected function build_amp_markup( $attrs = array() ) {
		$attrs        = array_merge(
			array(
				'type'   => $this->get_id(),
				'height' => '32px',
				'width'  => '32px',
			),
			$attrs
		);
		$sharing_link = '<amp-social-share';
		foreach ( $attrs as $key => $value ) {
			$sharing_link .= sprintf( ' %s="%s"', sanitize_key( $key ), esc_attr( $value ) );
		}
		$sharing_link .= '></amp-social-share>';
		return $sharing_link;
	}

	public function display_preview( $echo = true, $force_smart = false, $button_style = null ) {
		$text = '&nbsp;';
		$button_style = ( ! empty( $button_style ) ) ? $button_style : $this->button_style;
		if ( ! $this->smart && ! $force_smart ) {
			if ( $button_style != 'icon' ) {
				$text = $this->get_name();
			}
		}

		$klasses = array( 'share-' . $this->get_class(), 'sd-button' );

		if ( $button_style == 'icon' || $button_style == 'icon-text' ) {
			$klasses[] = 'share-icon';
		}

		if ( $button_style == 'icon' ) {
			$klasses[] = 'no-text';
		}

		if ( $button_style == 'text' ) {
			$klasses[] = 'no-icon';
		}

		$is_deprecated = $this->is_deprecated();

		$link = sprintf(
			'<a rel="nofollow" class="%s" href="javascript:void(0)" title="%s"><span>%s</span></a>',
			implode( ' ', $klasses ),
			esc_attr(
				$is_deprecated
					/* translators: %1$s is the name of a deprecated Sharing Service like "Google+" */
					? sprintf( __( 'The %1$s service has shut down. This sharing button is not displayed to your visitors and should be removed.', 'jetpack' ), $this->get_name() )
					: $this->get_name()
			),
			esc_html(
				$is_deprecated
					/* translators: %1$s is the name of a deprecated Sharing Service like "Google+" */
					? sprintf( __( '%1$s has shut down', 'jetpack' ), $this->get_name() )
					: $text
			)
		);

		$smart = ( $this->smart || $force_smart ) ? 'on' : 'off';
		$return = "<div class='option option-smart-$smart'>$link</div>";
		if ( $echo ) {
			echo $return;
		}

		return $return;
	}

	public function get_total( $post = false ) {
		global $wpdb, $blog_id;

		$name = strtolower( $this->get_id() );

		if ( $post == false ) {
			// get total number of shares for service
			return (int) $wpdb->get_var( $wpdb->prepare( 'SELECT SUM( count ) FROM sharing_stats WHERE blog_id = %d AND share_service = %s', $blog_id, $name ) );
		}

		// get total shares for a post
		return (int) $wpdb->get_var( $wpdb->prepare( 'SELECT count FROM sharing_stats WHERE blog_id = %d AND post_id = %d AND share_service = %s', $blog_id, $post->ID, $name ) );
	}

	public function get_posts_total() {
		global $wpdb, $blog_id;

		$totals = array();
		$name	= strtolower( $this->get_id() );

		$my_data = $wpdb->get_results( $wpdb->prepare( 'SELECT post_id as id, SUM( count ) as total FROM sharing_stats WHERE blog_id = %d AND share_service = %s GROUP BY post_id ORDER BY count DESC ', $blog_id, $name ) );

		if ( ! empty( $my_data ) ) {
			foreach ( $my_data as $row ) {
				$totals[] = new Sharing_Post_Total( $row->id, $row->total );
			}
		}

		usort( $totals, array( 'Sharing_Post_Total', 'cmp' ) );

		return $totals;
	}

	public function process_request( $post, array $post_data ) {
		/**
		 * Fires when a post is shared via one of the sharing buttons.
		 *
		 * @module sharedaddy
		 *
		 * @since 1.1.0
		 *
		 * @param array $args Aray of information about the sharing service.
		 */
		do_action( 'sharing_bump_stats', array( 'service' => $this, 'post' => $post ) );
	}

	public function js_dialog( $name, $params = array() ) {
		if ( true !== $this->open_link_in_new ) {
			return;
		}

		$defaults = array(
			'menubar'	=> 1,
			'resizable' => 1,
			'width'		=> 600,
			'height'	=> 400,
		);
		$params = array_merge( $defaults, $params );
		$opts = array();
		foreach ( $params as $key => $val ) {
			$opts[] = "$key=$val";
		}
		$opts = implode( ',', $opts );

		// Add JS after sharing-js has been enqueued.
		wp_add_inline_script( 'sharing-js',
			"var windowOpen;
			jQuery( document.body ).on( 'click', 'a.share-$name', function() {
				// If there's another sharing window open, close it.
				if ( 'undefined' !== typeof windowOpen ) {
					windowOpen.close();
				}
				windowOpen = window.open( jQuery( this ).attr( 'href' ), 'wpcom$name', '$opts' );
				return false;
			});"
		);
	}
}

abstract class Deprecated_Sharing_Source extends Sharing_Source {
	public	  $button_style = 'text';
	public	  $smart = false;
	protected $open_link_in_new = false;
	protected $id;
	protected $deprecated = true;

	final public function __construct( $id, array $settings ) {
		$this->id = $id;

		if ( isset( $settings['button_style'] ) ) {
			$this->button_style = $settings['button_style'];
		}
	}

	final public function is_deprecated() {
		return true;
	}

	final public function get_share_url( $post_id ) {
		return get_permalink( $post_id );
	}

	/**
	 * No AMP display for deprecated sources.
	 *
	 * @param \WP_Post $post The current post being viewed.
	 */
	final public function get_amp_display( $post ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return false;
	}

	final public function display_preview( $echo = true, $force_smart = false, $button_style = null ) {
		return parent::display_preview( $echo, false, $button_style );
	}

	final public function get_total( $post = false ) {
		return 0;
	}

	final public function get_posts_total() {
		return 0;
	}

	final public function process_request( $post, array $post_data ) {
		parent::process_request( $post, $post_data );
	}

	final public function get_display( $post ) {
		if ( current_user_can( 'manage_options' ) ) {
			return $this->display_deprecated( $post );
		}

		return '';
	}

	public function display_deprecated( $post ) {
		return $this->get_link(
			$this->get_share_url( $post->ID ),
			/* translators: %1$s is the name of a deprecated Sharing Service like "Google+" */
			sprintf( __( '%1$s has shut down', 'jetpack' ), $this->get_name() ),
			/* translators: %1$s is the name of a deprecated Sharing Service like "Google+" */
			sprintf( __( 'The %1$s service has shut down. This sharing button is not displayed to your visitors and should be removed.', 'jetpack' ), $this->get_name() )
		);
	}
}

abstract class Sharing_Advanced_Source extends Sharing_Source {
	public function has_advanced_options() {
		return true;
	}

	abstract public function display_options();
	abstract public function update_options( array $data );
	abstract public function get_options();
}

class Share_Email extends Sharing_Source {
	public $shortname = 'email';
	public $icon = '\f410';
	public function __construct( $id, array $settings ) {
		parent::__construct( $id, $settings );

		if ( 'official' == $this->button_style ) {
			$this->smart = true;
		} else {
			$this->smart = false;
		}
	}

	public function get_name() {
		return _x( 'Email', 'as sharing source', 'jetpack' );
	}

	// Default does nothing
	public function process_request( $post, array $post_data ) {
		$ajax = false;
		if ( isset( $_SERVER['HTTP_X_REQUESTED_WITH'] ) && strtolower( $_SERVER['HTTP_X_REQUESTED_WITH'] ) == 'xmlhttprequest' ) {
			$ajax = true;
		}

		$source_email = $target_email = $source_name = false;

		if ( isset( $post_data['source_email'] ) && is_email( $post_data['source_email'] ) ) {
			$source_email = $post_data['source_email'];
		}

		if ( isset( $post_data['target_email'] ) && is_email( $post_data['target_email'] ) ) {
			$target_email = $post_data['target_email'];
		}

		if ( isset( $post_data['source_name'] ) && strlen( $post_data['source_name'] ) < 200 ) {
			$source_name = $post_data['source_name'];
		} elseif ( isset( $post_data['source_name'] ) ) {
			$source_name = substr( $post_data['source_name'], 0, 200 );
		} else {
			$source_name = '';
		}

		// Test email
		$error = 1;	  // Failure in data
		if ( empty( $post_data['source_f_name'] ) && $source_email && $target_email && $source_name ) {
			/**
			 * Allow plugins to stop the email sharing button from running the shared message through Akismet.
			 *
			 * @module sharedaddy
			 *
			 * @since 1.1.0
			 *
			 * @param bool true Should we check if the message isn't spam?
			 * @param object $post Post information.
			 * @param array $post_data Information about the shared message.
			 */
			if ( apply_filters( 'sharing_email_check', true, $post, $post_data ) ) {
				$data = array(
					'post'           => $post,
					'source'         => $source_email,
					'target'         => $target_email,
					'name'           => $source_name,
					'sharing_source' => $this,
				);
				// todo: implement an error message when email doesn't get sent.
				/**
				 * Filter whether an email can be sent from the Email sharing button.
				 *
				 * @module sharedaddy
				 *
				 * @since 1.1.0
				 *
				 * @param array $data Array of information about the shared message.
				 */
				if ( ( $data = apply_filters( 'sharing_email_can_send', $data ) ) !== false ) {
					// Record stats
					parent::process_request( $data['post'], $post_data );

					/**
					 * Fires when an email is sent via the Email sharing button.
					 *
					 * @module sharedaddy
					 *
					 * @since 1.1.0
					 *
					 * @param array $data Array of information about the shared message.
					 */
					do_action( 'sharing_email_send_post', $data );
				}

				// Return a positive regardless of whether the user is subscribed or not
				if ( $ajax ) {
?>
<div class="response">
	<div class="response-title"><?php _e( 'This post has been shared!', 'jetpack' ); ?></div>
	<div class="response-sub"><?php printf( __( 'You have shared this post with %s', 'jetpack' ), esc_html( $target_email ) ); ?></div>
	<div class="response-close"><a href="#" class="sharing_cancel"><?php _e( 'Close', 'jetpack' ); ?></a></div>
</div>
<?php
				} else {
					wp_safe_redirect( get_permalink( $post->ID ) . '?shared=email' );
				}

				die();
			} else {
				$error = 2;	  // Email check failed
			}
		}

		if ( $ajax ) {
			echo $error;
		} else {
			wp_safe_redirect( get_permalink( $post->ID ) . '?shared=email&msg=fail' );
		}

		die();
	}

	public function get_display( $post ) {
		return $this->get_link( $this->get_process_request_url( $post->ID ), _x( 'Email', 'share to', 'jetpack' ), __( 'Click to email this to a friend', 'jetpack' ), 'share=email' );
	}

	/**
	 * No AMP display for email.
	 *
	 * @param \WP_Post $post The current post being viewed.
	 */
	public function get_amp_display( $post ) { // phpcs:ignore
		return false;
	}

	/**
	 * Outputs the hidden email dialog
	 */
	public function display_footer() {
		global $current_user;

		$visible = $status = false;
?>
	<div id="sharing_email" style="display: none;">
		<form action="<?php echo esc_url( $_SERVER['REQUEST_URI'] ); ?>" method="post">
			<label for="target_email"><?php _e( 'Send to Email Address', 'jetpack' ) ?></label>
			<input type="email" name="target_email" id="target_email" value="" />

			<?php if ( is_user_logged_in() ) : ?>
				<input type="hidden" name="source_name" value="<?php echo esc_attr( $current_user->display_name ); ?>" />
				<input type="hidden" name="source_email" value="<?php echo esc_attr( $current_user->user_email ); ?>" />
			<?php else : ?>

				<label for="source_name"><?php _e( 'Your Name', 'jetpack' ) ?></label>
				<input type="text" name="source_name" id="source_name" value="" />

				<label for="source_email"><?php _e( 'Your Email Address', 'jetpack' ) ?></label>
				<input type="email" name="source_email" id="source_email" value="" />

			<?php endif; ?>
			<input type="text" id="jetpack-source_f_name" name="source_f_name" class="input" value="" size="25" autocomplete="off" title="<?php esc_attr_e( 'This field is for validation and should not be changed', 'jetpack' ); ?>" />
			<?php
				/**
				 * Fires when the Email sharing dialog is loaded.
				 *
				 * @module sharedaddy
				 *
				 * @since 1.1.0
				 *
				 * @param string jetpack Eail sharing source.
				 */
				do_action( 'sharing_email_dialog', 'jetpack' );
			?>

			<img style="float: right; display: none" class="loading" src="<?php
			/** This filter is documented in modules/stats.php */
			echo apply_filters( 'jetpack_static_url', plugin_dir_url( __FILE__ ) . 'images/loading.gif' ); ?>" alt="loading" width="16" height="16" />
			<input type="submit" value="<?php esc_attr_e( 'Send Email', 'jetpack' ); ?>" class="sharing_send" />
			<a rel="nofollow" href="#cancel" class="sharing_cancel" role="button"><?php _e( 'Cancel', 'jetpack' ); ?></a>

			<div class="errors errors-1" style="display: none;">
				<?php _e( 'Post was not sent - check your email addresses!', 'jetpack' ); ?>
			</div>

			<div class="errors errors-2" style="display: none;">
				<?php _e( 'Email check failed, please try again', 'jetpack' ); ?>
			</div>

			<div class="errors errors-3" style="display: none;">
				<?php _e( 'Sorry, your blog cannot share posts by email.', 'jetpack' ); ?>
			</div>
		</form>
	</div>
<?php
	}
}

class Share_Twitter extends Sharing_Source {
	public $shortname = 'twitter';
	public $icon = '\f202';
	// 'https://dev.twitter.com/rest/reference/get/help/configuration' ( 2015/02/06 ) short_url_length is 22, short_url_length_https is 23
	public $short_url_length = 24;

	public function __construct( $id, array $settings ) {
		parent::__construct( $id, $settings );

		if ( 'official' == $this->button_style ) {
			$this->smart = true;
		} else {
			$this->smart = false;
		}
	}

	public function get_name() {
		return __( 'Twitter', 'jetpack' );
	}

	/**
	 * Determine the Twitter 'via' value for a post.
	 *
	 * @param  WP_Post|int $post Post object or post ID.
	 * @return string Twitter handle without the preceding @.
	 **/
	public static function sharing_twitter_via( $post ) {
		$post = get_post( $post );
		/**
		 * Allow third-party plugins to customize the Twitter username used as "twitter:site" Twitter Card Meta Tag.
		 *
		 * @module sharedaddy
		 *
		 * @since 3.0.0
		 *
		 * @param string $string Twitter Username.
		 * @param array $args Array of Open Graph Meta Tags and Twitter Cards tags.
		 */
		$twitter_site_tag_value = apply_filters(
			'jetpack_twitter_cards_site_tag',
			'',
			/** This action is documented in modules/sharedaddy/sharing-sources.php */
			array( 'twitter:creator' => apply_filters( 'jetpack_sharing_twitter_via', '', $post->ID ) )
		);

		/*
		 * Hack to remove the unwanted behavior of adding 'via @jetpack' which
		 * was introduced with the adding of the Twitter cards.
		 * This should be a temporary solution until a better method is setup.
		 */
		if ( 'jetpack' == $twitter_site_tag_value ) {
			$twitter_site_tag_value = '';
		}

		/**
		 * Filters the Twitter username used as "via" in the Twitter sharing button.
		 *
		 * @module sharedaddy
		 *
		 * @since 1.7.0
		 *
		 * @param string $twitter_site_tag_value Twitter Username.
		 * @param int $post->ID Post ID.
		 */
		$twitter_site_tag_value = apply_filters( 'jetpack_sharing_twitter_via', $twitter_site_tag_value, $post->ID );

		// Strip out anything other than a letter, number, or underscore.
		// This will prevent the inadvertent inclusion of an extra @, as well as normalizing the handle.
		return preg_replace( '/[^\da-z_]+/i', '', $twitter_site_tag_value );
	}

	/**
	 * Determine the 'related' Twitter accounts for a post.
	 *
	 * @param  WP_Post|int $post Post object or post ID.
	 * @return string Comma-separated list of Twitter handles.
	 **/
	public static function get_related_accounts( $post ) {
		$post = get_post( $post );
		/**
		 * Filter the list of related Twitter accounts added to the Twitter sharing button.
		 *
		 * @module sharedaddy
		 *
		 * @since 1.7.0
		 *
		 * @param array $args Array of Twitter usernames. Format is 'username' => 'Optional description'
		 * @param int $post->ID Post ID.
		 */
		$related_accounts = apply_filters( 'jetpack_sharing_twitter_related', array(), $post->ID );

		// Example related string: account1,account2:Account 2 description,account3
		$related = array();

		foreach ( $related_accounts as $related_account_username => $related_account_description ) {
			// Join the description onto the end of the username
			if ( $related_account_description ) {
				$related_account_username .= ':' . $related_account_description;
			}

			$related[] = $related_account_username;
		}

		return implode( ',', $related );
	}

	public function get_display( $post ) {
		$via = $this->sharing_twitter_via( $post );

		if ( $via ) {
			$via = 'data-via="' . esc_attr( $via ) . '"';
		} else {
			$via = '';
		}

		$related = $this->get_related_accounts( $post );
		if ( ! empty( $related ) && $related !== $via ) {
			$related = 'data-related="' . esc_attr( $related ) . '"';
		} else {
			$related = '';
		}

		if ( $this->smart ) {
			$share_url = $this->get_share_url( $post->ID );
			$post_title = $this->get_share_title( $post->ID );
			return sprintf(
				'<a href="https://twitter.com/share" class="twitter-share-button" data-url="%1$s" data-text="%2$s" %3$s %4$s>Tweet</a>',
				esc_url( $share_url ),
				esc_attr( $post_title ),
				$via,
				$related
			);
		} else {
			if (
				/**
				 * Allow plugins to disable sharing counts for specific sharing services.
				 *
				 * @module sharedaddy
				 *
				 * @since 3.0.0
				 *
				 * @param bool true Should sharing counts be enabled for this specific service. Default to true.
				 * @param int $post->ID Post ID.
				 * @param string $str Sharing service name.
				 */
				apply_filters( 'jetpack_register_post_for_share_counts', true, $post->ID, 'twitter' )
			) {
				sharing_register_post_for_share_counts( $post->ID );
			}
			return $this->get_link( $this->get_process_request_url( $post->ID ), _x( 'Twitter', 'share to', 'jetpack' ), __( 'Click to share on Twitter', 'jetpack' ), 'share=twitter', 'sharing-twitter-' . $post->ID );
		}
	}

	public function process_request( $post, array $post_data ) {
		$post_title = $this->get_share_title( $post->ID );
		$post_link = $this->get_share_url( $post->ID );

		if ( function_exists( 'mb_stripos' ) ) {
			$strlen = 'mb_strlen';
			$substr = 'mb_substr';
		} else {
			$strlen = 'strlen';
			$substr = 'substr';
		}

		$via = $this->sharing_twitter_via( $post );
		$related = $this->get_related_accounts( $post );
		if ( $via ) {
			$sig = " via @$via";
			if ( $related === $via ) {
				$related = false;
			}
		} else {
			$via = false;
			$sig = '';
		}

		$suffix_length = $this->short_url_length + $strlen( $sig );
		// $sig is handled by twitter in their 'via' argument.
		// $post_link is handled by twitter in their 'url' argument.
		if ( 280 < $strlen( $post_title ) + $suffix_length ) {
			// The -1 is for "\xE2\x80\xA6", a UTF-8 ellipsis.
			$text = $substr( $post_title, 0, 280 - $suffix_length - 1 ) . "\xE2\x80\xA6";
		} else {
			$text = $post_title;
		}

		// Record stats
		parent::process_request( $post, $post_data );

		$url = $post_link;
		$twitter_url = add_query_arg(
			rawurlencode_deep( array_filter( compact( 'via', 'related', 'text', 'url' ) ) ),
			'https://twitter.com/intent/tweet'
		);

		// Redirect to Twitter
		wp_redirect( $twitter_url );
		die();
	}

	public function has_custom_button_style() {
		return $this->smart;
	}

	public function display_footer() {
		if ( $this->smart ) {
			?>
			<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');</script>
			<?php
		} else {
			$this->js_dialog( $this->shortname, array( 'height' => 350 ) );
		}
	}
}


class Share_Reddit extends Sharing_Source {
	public $shortname = 'reddit';
	public $icon = '\f222';
	public function __construct( $id, array $settings ) {
		parent::__construct( $id, $settings );

		if ( 'official' == $this->button_style ) {
			$this->smart = true;
		} else {
			$this->smart = false;
		}
	}

	public function get_name() {
		return __( 'Reddit', 'jetpack' );
	}

	public function get_display( $post ) {
		if ( $this->smart ) {
			return '<div class="reddit_button"><iframe src="' . $this->http() . '://www.reddit.com/static/button/button1.html?newwindow=true&width=120&amp;url=' . rawurlencode( $this->get_share_url( $post->ID ) ) . '&amp;title=' . rawurlencode( $this->get_share_title( $post->ID ) ) . '" height="22" width="120" scrolling="no" frameborder="0"></iframe></div>';
		} else {
			return $this->get_link( $this->get_process_request_url( $post->ID ), _x( 'Reddit', 'share to', 'jetpack' ), __( 'Click to share on Reddit', 'jetpack' ), 'share=reddit' );
		}
	}

	/**
	 * AMP display for Reddit.
	 *
	 * @param \WP_Post $post The current post being viewed.
	 */
	public function get_amp_display( $post ) {
		$attrs = array(
			'data-share-endpoint' => esc_url_raw( 'https://reddit.com/submit?url=' . rawurlencode( $this->get_share_url( $post->ID ) ) . '&title=' . rawurlencode( $this->get_share_title( $post->ID ) ) ),
		);

		return $this->build_amp_markup( $attrs );
	}

	public function process_request( $post, array $post_data ) {
		$reddit_url = $this->http() . '://reddit.com/submit?url=' . rawurlencode( $this->get_share_url( $post->ID ) ) . '&title=' . rawurlencode( $this->get_share_title( $post->ID ) );

		// Record stats
		parent::process_request( $post, $post_data );

		// Redirect to Reddit
		wp_redirect( $reddit_url );
		die();
	}
}

class Share_LinkedIn extends Sharing_Source {
	public $shortname = 'linkedin';
	public $icon = '\f207';
	public function __construct( $id, array $settings ) {
		parent::__construct( $id, $settings );

		if ( 'official' == $this->button_style ) {
			$this->smart = true;
		} else {
			$this->smart = false;
		}
	}

	public function get_name() {
		return __( 'LinkedIn', 'jetpack' );
	}

	public function has_custom_button_style() {
		return $this->smart;
	}

	public function get_display( $post ) {
		$display = '';

		if ( $this->smart ) {
			$share_url = $this->get_share_url( $post->ID );
			$display .= sprintf( '<div class="linkedin_button"><script type="in/share" data-url="%s" data-counter="right"></script></div>', esc_url( $share_url ) );
		} else {
			$display = $this->get_link( $this->get_process_request_url( $post->ID ), _x( 'LinkedIn', 'share to', 'jetpack' ), __( 'Click to share on LinkedIn', 'jetpack' ), 'share=linkedin', 'sharing-linkedin-' . $post->ID );
		}

		/** This filter is already documented in modules/sharedaddy/sharing-sources.php */
		if ( apply_filters( 'jetpack_register_post_for_share_counts', true, $post->ID, 'linkedin' ) ) {
			sharing_register_post_for_share_counts( $post->ID );
		}

		return $display;
	}

	public function process_request( $post, array $post_data ) {

		$post_link = $this->get_share_url( $post->ID );

		// Using the same URL as the official button, which is *not* LinkedIn's documented sharing link
		// https://www.linkedin.com/cws/share?url={url}&token=&isFramed=false
		$linkedin_url = add_query_arg( array(
			'url' => rawurlencode( $post_link ),
		), 'https://www.linkedin.com/cws/share?token=&isFramed=false' );

		// Record stats
		parent::process_request( $post, $post_data );

		// Redirect to LinkedIn
		wp_redirect( $linkedin_url );
		die();
	}

	public function display_footer() {
		if ( ! $this->smart ) {
			$this->js_dialog( $this->shortname, array( 'width' => 580, 'height' => 450 ) );
		} else {
			?><script type="text/javascript">
			jQuery( document ).ready( function() {
				jQuery.getScript( 'https://platform.linkedin.com/in.js?async=true', function success() {
					IN.init();
				});
			});
			jQuery( document.body ).on( 'post-load', function() {
				if ( typeof IN != 'undefined' )
					IN.parse();
			});
			</script><?php
		}
	}
}

class Share_Facebook extends Sharing_Source {
	public $shortname = 'facebook';
	public $icon = '\f204';
	private $share_type = 'default';

	public function __construct( $id, array $settings ) {
		parent::__construct( $id, $settings );

		if ( isset( $settings['share_type'] ) ) {
			$this->share_type = $settings['share_type'];
		}

		if ( 'official' == $this->button_style ) {
			$this->smart = true;
		} else {
			$this->smart = false;
		}
	}

	public function get_name() {
		return __( 'Facebook', 'jetpack' );
	}

	public function display_header() {
	}

	function guess_locale_from_lang( $lang ) {
		if ( 'en' == $lang || 'en_US' == $lang || ! $lang ) {
			return 'en_US';
		}

		if ( ! class_exists( 'GP_Locales' ) ) {
			if ( ! defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' ) || ! file_exists( JETPACK__GLOTPRESS_LOCALES_PATH ) ) {
				return false;
			}

			require JETPACK__GLOTPRESS_LOCALES_PATH;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			// WP.com: get_locale() returns 'it'
			$locale = GP_Locales::by_slug( $lang );
		} else {
			// Jetpack: get_locale() returns 'it_IT';
			$locale = GP_Locales::by_field( 'wp_locale', $lang );
		}

		if ( ! $locale ) {
			return false;
		}

		if ( empty( $locale->facebook_locale ) ) {
			if ( empty( $locale->wp_locale ) ) {
				return false;
			} else {
				// Facebook SDK is smart enough to fall back to en_US if a
				// locale isn't supported. Since supported Facebook locales
				// can fall out of sync, we'll attempt to use the known
				// wp_locale value and rely on said fallback.
				return $locale->wp_locale;
			}
		}

		return $locale->facebook_locale;
	}

	public function get_display( $post ) {
		if ( $this->smart ) {
			$share_url = $this->get_share_url( $post->ID );
			$fb_share_html = '<div class="fb-share-button" data-href="' . esc_attr( $share_url ) . '" data-layout="button_count"></div>';
			/**
			 * Filter the output of the Facebook Sharing button.
			 *
			 * @module sharedaddy
			 *
			 * @since 3.6.0
			 *
			 * @param string $fb_share_html Facebook Sharing button HTML.
			 * @param string $share_url URL of the post to share.
			 */
			return apply_filters( 'jetpack_sharing_facebook_official_button_output', $fb_share_html, $share_url );
		}

		/** This filter is already documented in modules/sharedaddy/sharing-sources.php */
		if ( apply_filters( 'jetpack_register_post_for_share_counts', true, $post->ID, 'facebook' ) ) {
			sharing_register_post_for_share_counts( $post->ID );
		}
		return $this->get_link( $this->get_process_request_url( $post->ID ), _x( 'Facebook', 'share to', 'jetpack' ), __( 'Click to share on Facebook', 'jetpack' ), 'share=facebook', 'sharing-facebook-' . $post->ID );
	}

	/**
	 * AMP display for Facebook.
	 *
	 * @param \WP_Post $post The current post being viewed.
	 */
	public function get_amp_display( $post ) {
		$attrs = array(
			/** This filter is documented in modules/sharedaddy/sharing-sources.php */
			'data-param-app_id' => apply_filters( 'jetpack_sharing_facebook_app_id', '249643311490' ),
		);

		return $this->build_amp_markup( $attrs );
	}

	public function process_request( $post, array $post_data ) {
		$fb_url = $this->http() . '://www.facebook.com/sharer.php?u=' . rawurlencode( $this->get_share_url( $post->ID ) ) . '&t=' . rawurlencode( $this->get_share_title( $post->ID ) );

		// Record stats
		parent::process_request( $post, $post_data );

		// Redirect to Facebook
		wp_redirect( $fb_url );
		die();
	}

	public function display_footer() {
		$this->js_dialog( $this->shortname );
		if ( $this->smart ) {
			$locale = $this->guess_locale_from_lang( get_locale() );
			if ( ! $locale ) {
				$locale = 'en_US';
			}
			/**
			 * Filter the App ID used in the official Facebook Share button.
			 *
			 * @since 3.8.0
			 *
			 * @param int $fb_app_id Facebook App ID. Default to 249643311490 (WordPress.com's App ID).
			 */
			$fb_app_id = apply_filters( 'jetpack_sharing_facebook_app_id', '249643311490' );
			if ( is_numeric( $fb_app_id ) ) {
				$fb_app_id = '&appId=' . $fb_app_id;
			} else {
				$fb_app_id = '';
			}
			?><div id="fb-root"></div>
			<script>(function(d, s, id) { var js, fjs = d.getElementsByTagName(s)[0]; if (d.getElementById(id)) return; js = d.createElement(s); js.id = id; js.src = 'https://connect.facebook.net/<?php echo $locale; ?>/sdk.js#xfbml=1<?php echo $fb_app_id; ?>&version=v2.3'; fjs.parentNode.insertBefore(js, fjs); }(document, 'script', 'facebook-jssdk'));</script>
			<script>
			document.body.addEventListener( 'post-load', function() {
				if ( 'undefined' !== typeof FB ) {
					FB.XFBML.parse();
				}
			} );
			</script>
			<?php
		}
	}
}

class Share_Print extends Sharing_Source {
	public $shortname = 'print';
	public $icon = '\f469';
	public function __construct( $id, array $settings ) {
		parent::__construct( $id, $settings );

		if ( 'official' == $this->button_style ) {
			$this->smart = true;
		} else {
			$this->smart = false;
		}
	}

	public function get_name() {
		return __( 'Print', 'jetpack' );
	}

	public function get_display( $post ) {
		return $this->get_link( $this->get_process_request_url( $post->ID ) . ( ( is_single() || is_page() ) ? '#print': '' ), _x( 'Print', 'share to', 'jetpack' ), __( 'Click to print', 'jetpack' ) );
	}

	/**
	 * AMP display for Print.
	 *
	 * @param \WP_Post $post The current post being viewed.
	 */
	public function get_amp_display( $post ) {
		if ( empty( $post ) ) {
			return false;
		}

		return '<button class="amp-social-share print" on="tap:AMP.print">Print</button>';
	}
}

class Share_PressThis extends Sharing_Source {
	public $shortname = 'pressthis';
	public $icon = '\f205';
	public function __construct( $id, array $settings ) {
		parent::__construct( $id, $settings );

		if ( 'official' == $this->button_style ) {
			$this->smart = true;
		} else {
			$this->smart = false;
		}
	}

	public function get_name() {
		return __( 'Press This', 'jetpack' );
	}

	public function process_request( $post, array $post_data ) {
		global $current_user;

		$primary_blog = (int) get_user_meta( $current_user->ID, 'primary_blog', true );
		if ( $primary_blog ) {
			$primary_blog_details = get_blog_details( $primary_blog );
		} else {
			$primary_blog_details = false;
		}

		if ( $primary_blog_details ) {
			$blogs = array( $primary_blog_details );
		} elseif ( function_exists( 'get_active_blogs_for_user' ) ) {
			$blogs = get_active_blogs_for_user();
			if ( empty( $blogs ) ) {
				$blogs = get_blogs_of_user( $current_user->ID );
			}
		} else {
			$blogs = get_blogs_of_user( $current_user->ID );
		}

		if ( empty( $blogs ) ) {
			wp_safe_redirect( get_permalink( $post->ID ) );
			die();
		}

		$blog = current( $blogs );

		$args = array(
			'u' => rawurlencode( $this->get_share_url( $post->ID ) ),
			);

		$args[ 'url-scan-submit' ] = 'Scan';
		$args[ '_wpnonce' ]        = wp_create_nonce( 'scan-site' );

		$url = $blog->siteurl . '/wp-admin/press-this.php';
		$url = add_query_arg( $args, $url );

		// Record stats
		parent::process_request( $post, $post_data );

		// Redirect to Press This
		wp_redirect( $url );
		die();
	}

	public function get_display( $post ) {
		return $this->get_link( $this->get_process_request_url( $post->ID ), _x( 'Press This', 'share to', 'jetpack' ), __( 'Click to Press This!', 'jetpack' ), 'share=press-this' );
	}

	/**
	 * No AMP display for PressThis.
	 *
	 * @param \WP_Post $post The current post being viewed.
	 */
	public function get_amp_display( $post ) { // phpcs:ignore
		return false;
	}
}

class Share_Custom extends Sharing_Advanced_Source {
	private $name;
	private $icon;
	private $url;
	public $smart = true;
	public $shortname;

	public function get_class() {
		return 'custom share-custom-' . sanitize_html_class( strtolower( $this->name ) );
	}

	public function __construct( $id, array $settings ) {
		parent::__construct( $id, $settings );

		$opts = $this->get_options();

		if ( isset( $settings['name'] ) ) {
			$this->name = $settings['name'];
			$this->shortname = preg_replace( '/[^a-z0-9]*/', '', $settings['name'] );
		}

		if ( isset( $settings['icon'] ) ) {
			$this->icon = $settings['icon'];

			$new_icon = esc_url_raw( wp_specialchars_decode( $this->icon, ENT_QUOTES ) );
			$i = 0;
			while ( $new_icon != $this->icon ) {
				if ( $i > 5 ) {
					$this->icon = false;
					break;
				} else {
					$this->icon = $new_icon;
					$new_icon = esc_url_raw( wp_specialchars_decode( $this->icon, ENT_QUOTES ) );
				}
				$i++;
			}
		}

		if ( isset( $settings['url'] ) ) {
			$this->url = $settings['url'];
		}
	}

	public function get_name() {
		return $this->name;
	}

	public function get_display( $post ) {
		$str = $this->get_link( $this->get_process_request_url( $post->ID ), esc_html( $this->name ), sprintf( __( 'Click to share on %s', 'jetpack' ), esc_attr( $this->name ) ), 'share=' . $this->id );
		return str_replace( '<span>', '<span style="' . esc_attr( 'background-image:url("' . addcslashes( esc_url_raw( $this->icon ), '"' ) . '");' ) . '">', $str );
	}

	/**
	 * No AMP display for custom elements.
	 *
	 * @param \WP_Post $post The current post being viewed.
	 */
	public function get_amp_display( $post ) { // phpcs:ignore
		return false;
	}

	public function process_request( $post, array $post_data ) {
		$url = str_replace( '&amp;', '&', $this->url );
		$url = str_replace( '%post_id%', rawurlencode( $post->ID ), $url );
		$url = str_replace( '%post_url%', rawurlencode( $this->get_share_url( $post->ID ) ), $url );
		$url = str_replace( '%post_full_url%', rawurlencode( get_permalink( $post->ID ) ), $url );
		$url = str_replace( '%post_title%', rawurlencode( $this->get_share_title( $post->ID ) ), $url );
		$url = str_replace( '%home_url%', rawurlencode( home_url() ), $url );
		$url = str_replace( '%post_slug%', rawurlencode( $post->post_name ), $url );

		if ( strpos( $url, '%post_tags%' ) !== false ) {
			$tags	= get_the_tags( $post->ID );
			$tagged = '';

			if ( $tags ) {
				$tagged_raw = array();
				foreach ( $tags as $tag ) {
					$tagged_raw[] = rawurlencode( $tag->name );
				}

				$tagged = implode( ',', $tagged_raw );
			}

			$url = str_replace( '%post_tags%', $tagged, $url );
		}

		if ( strpos( $url, '%post_excerpt%' ) !== false ) {
			$url_excerpt = $post->post_excerpt;
			if ( empty( $url_excerpt ) ) {
				$url_excerpt = $post->post_content;
			}

			$url_excerpt = strip_tags( strip_shortcodes( $url_excerpt ) );
			$url_excerpt = wp_html_excerpt( $url_excerpt, 100 );
			$url_excerpt = rtrim( preg_replace( '/[^ .]*$/', '', $url_excerpt ) );
			$url = str_replace( '%post_excerpt%', rawurlencode( $url_excerpt ), $url );
		}

		// Record stats
		parent::process_request( $post, $post_data );

		// Redirect
		wp_redirect( $url );
		die();
	}

	public function display_options() {
?>
<div class="input">
	<table class="form-table">
		<tbody>
			<tr>
				<th scope="row"><?php _e( 'Label', 'jetpack' ); ?></th>
				<td><input type="text" name="name" value="<?php echo esc_attr( $this->name ); ?>" /></td>
			</tr>

			<tr>
				<th scope="row"><?php _e( 'URL', 'jetpack' ); ?></th>
				<td><input type="text" name="url" value="<?php echo esc_attr( $this->url ); ?>" /></td>
			</tr>

			<tr>
				<th scope="row"><?php _e( 'Icon', 'jetpack' ); ?></th>
				<td><input type="text" name="icon" value="<?php echo esc_attr( $this->icon ); ?>" /></td>
			</tr>

			<tr>
				<th scope="row"></th>
				<td>
					<input class="button-secondary" type="submit" value="<?php esc_attr_e( 'Save', 'jetpack' ); ?>" />
					<a href="#" class="remove"><small><?php _e( 'Remove Service', 'jetpack' ); ?></small></a>
				</td>
			</tr>
		</tbody>
	</table>
</div>
<?php
	}

	public function update_options( array $data ) {
		$name  = trim( wp_html_excerpt( wp_kses( stripslashes( $data['name'] ), array() ), 30 ) );
		$url   = trim( esc_url_raw( $data['url'] ) );
		$icon  = trim( esc_url_raw( $data['icon'] ) );

		if ( $name ) {
			$this->name = $name;
		}

		if ( $url ) {
			$this->url	= $url;
		}

		if ( $icon ) {
			$this->icon = $icon;
		}
	}

	public function get_options() {
		return array(
			'name' => $this->name,
			'icon' => $this->icon,
			'url'  => $this->url,
		);
	}

	public function display_preview( $echo = true, $force_smart = false, $button_style = null ) {
		$opts = $this->get_options();

		$text = '&nbsp;';
		if ( ! $this->smart ) {
			if ( $this->button_style != 'icon' ) {
				$text = $this->get_name();
			}
		}

		$klasses = array( 'share-' . $this->shortname );

		if ( $this->button_style == 'icon' || $this->button_style == 'icon-text' ) {
			$klasses[] = 'share-icon';
		}

		if ( $this->button_style == 'icon' ) {
			$text = '';
			$klasses[] = 'no-text';
		}

		if ( $this->button_style == 'text' ) {
			$klasses[] = 'no-icon';
		}

		$link = sprintf(
			'<a rel="nofollow" class="%s" href="javascript:void(0)" title="%s"><span style="background-image:url(&quot;%s&quot;) !important;background-position:left center;background-repeat:no-repeat;">%s</span></a>',
			implode( ' ', $klasses ),
			$this->get_name(),
			addcslashes( esc_url_raw( $opts['icon'] ), '"' ),
			$text
		);
		?>
		<div class="option option-smart-off">
		<?php echo $link ; ?>
		</div><?php
	}
}

class Share_Tumblr extends Sharing_Source {
	public $shortname = 'tumblr';
	public $icon = '\f214';
	public function __construct( $id, array $settings ) {
		parent::__construct( $id, $settings );
		if ( 'official' == $this->button_style ) {
			$this->smart = true;
		} else {
			$this->smart = false;
		}
	}

	public function get_name() {
		return __( 'Tumblr', 'jetpack' );
	}

	public function get_display( $post ) {
		if ( $this->smart ) {
			$target = '';
			if ( true == $this->open_link_in_new ) {
				$target = '_blank';
			}

			/**
			 * If we are looking at a single post, let Tumblr figure out the post type (text, photo, link, quote, chat, or video)
			 * based on the content available on the page.
			 * If we are not looking at a single post, content from other posts can appear on the page and Tumblr will pick that up.
			 * In this case, we want Tumblr to focus on our current post, so we will limit the post type to link, where we can give Tumblr a link to our post.
			 */
			if ( ! is_single() ) {
				$posttype = 'data-posttype="link"';
			} else {
				$posttype = '';
			}

			// Documentation: https://www.tumblr.com/docs/en/share_button
			return sprintf(
				'<a class="tumblr-share-button" target="%1$s" href="%2$s" data-title="%3$s" data-content="%4$s" title="%5$s"%6$s>%5$s</a>',
				$target,
				'https://www.tumblr.com/share',
				$this->get_share_title( $post->ID ),
				$this->get_share_url( $post->ID ),
				__( 'Share on Tumblr', 'jetpack' ),
				$posttype
			);
		 } else {
			return $this->get_link( $this->get_process_request_url( $post->ID ), _x( 'Tumblr', 'share to', 'jetpack' ), __( 'Click to share on Tumblr', 'jetpack' ), 'share=tumblr' );
		}
	}

	public function process_request( $post, array $post_data ) {
		// Record stats
		parent::process_request( $post, $post_data );

		// Redirect to Tumblr's sharing endpoint (a la their bookmarklet)
		$url = 'https://www.tumblr.com/share?v=3&u=' . rawurlencode( $this->get_share_url( $post->ID ) ) . '&t=' . rawurlencode( $this->get_share_title( $post->ID ) ) . '&s=';
		wp_redirect( $url );
		die();
	}

	public function display_footer() {
		if ( $this->smart ) {
			?><script id="tumblr-js" type="text/javascript" src="https://assets.tumblr.com/share-button.js"></script><?php
		} else {
			$this->js_dialog( $this->shortname, array( 'width' => 450, 'height' => 450 ) );
		}
	}
}

class Share_Pinterest extends Sharing_Source {
	public $shortname = 'pinterest';
	public $icon = '\f209';

	public function __construct( $id, array $settings ) {
		parent::__construct( $id, $settings );
		if ( 'official' == $this->button_style ) {
			$this->smart = true;
		} else {
			$this->smart = false;
		}
	}

	public function get_name() {
		return __( 'Pinterest', 'jetpack' );
	}

	public function get_image( $post ) {
		if ( class_exists( 'Jetpack_PostImages' ) ) {
			$image = Jetpack_PostImages::get_image( $post->ID, array( 'fallback_to_avatars' => true ) );
			if ( ! empty( $image ) ) {
				return $image['src'];
			}
		}

		/**
		 * Filters the default image used by the Pinterest Pin It share button.
		 *
		 * @module sharedaddy
		 *
		 * @since 3.6.0
		 *
		 * @param string $url Default image URL.
		 */
		return apply_filters( 'jetpack_sharing_pinterest_default_image', 'https://s0.wp.com/i/blank.jpg' );
	}

	public function get_external_url( $post ) {
		$url = 'https://www.pinterest.com/pin/create/button/?url=' . rawurlencode( $this->get_share_url( $post->ID ) ) . '&media=' . rawurlencode( $this->get_image( $post ) ) . '&description=' . rawurlencode( $post->post_title );

		/**
		 * Filters the Pinterest share URL used in sharing button output.
		 *
		 * @module sharedaddy
		 *
		 * @since 3.6.0
		 *
		 * @param string $url Pinterest share URL.
		 */
		return apply_filters( 'jetpack_sharing_pinterest_share_url', $url );
	}

	public function get_widget_type() {
		/**
		 * Filters the Pinterest widget type.
		 *
		 * @see https://business.pinterest.com/en/widget-builder
		 *
		 * @module sharedaddy
		 *
		 * @since 3.6.0
		 *
		 * @param string $type Pinterest widget type. Default of 'buttonPin' for single-image selection. 'buttonBookmark' for multi-image modal.
		 */
		return apply_filters( 'jetpack_sharing_pinterest_widget_type', 'buttonPin' );
	}

	public function get_display( $post ) {
		$display = '';

		if ( $this->smart ) {
			$display = sprintf(
				'<div class="pinterest_button"><a href="%s" data-pin-do="%s" data-pin-config="beside"><img src="//assets.pinterest.com/images/pidgets/pinit_fg_en_rect_gray_20.png" /></a></div>',
				esc_url( $this->get_external_url( $post ) ),
				esc_attr( $this->get_widget_type() )
			);
		} else {
			$display = $this->get_link( $this->get_process_request_url( $post->ID ), _x( 'Pinterest', 'share to', 'jetpack' ), __( 'Click to share on Pinterest', 'jetpack' ), 'share=pinterest', 'sharing-pinterest-' . $post->ID );
		}

		/** This filter is already documented in modules/sharedaddy/sharing-sources.php */
		if ( apply_filters( 'jetpack_register_post_for_share_counts', true, $post->ID, 'linkedin' ) ) {
			sharing_register_post_for_share_counts( $post->ID );
		}

		return $display;
	}

	public function process_request( $post, array $post_data ) {
		// Record stats
		parent::process_request( $post, $post_data );
		// If we're triggering the multi-select panel, then we don't need to redirect to Pinterest
		if ( ! isset( $_GET['js_only'] ) ) {
			$pinterest_url = esc_url_raw( $this->get_external_url( $post ) );
			wp_redirect( $pinterest_url );
		} else {
			echo '// share count bumped';
		}
		die();
	}

	public function display_footer() {
		/**
		 * Filter the Pin it button appearing when hovering over images when using the official button style.
		 *
		 * @module sharedaddy
		 *
		 * @since 3.6.0
		 *
		 * @param bool $jetpack_pinit_over True by default, displays the Pin it button when hovering over images.
		 */
		$jetpack_pinit_over = apply_filters( 'jetpack_pinit_over_button', true );
		?>
		<?php if ( $this->smart ) : ?>
			<script type="text/javascript">
				// Pinterest shared resources
				var s = document.createElement("script");
				s.type = "text/javascript";
				s.async = true;
				<?php if ( $jetpack_pinit_over ) {
				echo "s.setAttribute('data-pin-hover', true);";
				} ?>
				s.src = window.location.protocol + "//assets.pinterest.com/js/pinit.js";
				var x = document.getElementsByTagName("script")[0];
				x.parentNode.insertBefore(s, x);
				// if 'Pin it' button has 'counts' make container wider
				jQuery(window).load( function(){ jQuery( 'li.share-pinterest a span:visible' ).closest( '.share-pinterest' ).width( '80px' ); } );
			</script>
		<?php elseif ( 'buttonPin' != $this->get_widget_type() ) : ?>
			<script type="text/javascript">
				jQuery(document).ready( function(){
					jQuery('body').on('click', 'a.share-pinterest', function(e){
						e.preventDefault();
						// Load Pinterest Bookmarklet code
						var s = document.createElement("script");
						s.type = "text/javascript";
						s.src = window.location.protocol + "//assets.pinterest.com/js/pinmarklet.js?r=" + ( Math.random() * 99999999 );
						var x = document.getElementsByTagName("script")[0];
						x.parentNode.insertBefore(s, x);
						// Trigger Stats
						var s = document.createElement("script");
						s.type = "text/javascript";
						s.src = this + ( this.toString().indexOf( '?' ) ? '&' : '?' ) + 'js_only=1';
						var x = document.getElementsByTagName("script")[0];
						x.parentNode.insertBefore(s, x);
					});
				});
			</script>
		<?php endif;
	}
}

class Share_Pocket extends Sharing_Source {
	public $shortname = 'pocket';
	public $icon = '\f224';

	public function __construct( $id, array $settings ) {
		parent::__construct( $id, $settings );

		if ( 'official' == $this->button_style ) {
			$this->smart = true;
		} else {
			$this->smart = false;
		}
	}

	public function get_name() {
		return __( 'Pocket', 'jetpack' );
	}

	public function process_request( $post, array $post_data ) {
		// Record stats
		parent::process_request( $post, $post_data );

		$pocket_url = esc_url_raw( 'https://getpocket.com/save/?url=' . rawurlencode( $this->get_share_url( $post->ID ) ) . '&title=' . rawurlencode( $this->get_share_title( $post->ID ) ) );
		wp_redirect( $pocket_url );
		exit;
	}

	public function get_display( $post ) {
		if ( $this->smart ) {
			$post_count = 'horizontal';

			$button = '';
			$button .= '<div class="pocket_button">';
			$button .= sprintf( '<a href="https://getpocket.com/save" class="pocket-btn" data-lang="%s" data-save-url="%s" data-pocket-count="%s" >%s</a>', 'en', esc_attr( $this->get_share_url( $post->ID ) ), $post_count, esc_attr__( 'Pocket', 'jetpack' ) );
			$button .= '</div>';

			return $button;
		} else {
			return $this->get_link( $this->get_process_request_url( $post->ID ), _x( 'Pocket', 'share to', 'jetpack' ), __( 'Click to share on Pocket', 'jetpack' ), 'share=pocket' );
		}

	}

	/**
	 * AMP display for Pocket.
	 *
	 * @param \WP_Post $post The current post being viewed.
	 */
	public function get_amp_display( $post ) {
		$attrs = array(
			'data-share-endpoint' => esc_url_raw( 'https://getpocket.com/save/?url=' . rawurlencode( $this->get_share_url( $post->ID ) ) . '&title=' . rawurlencode( $this->get_share_title( $post->ID ) ) ),
		);

		return $this->build_amp_markup( $attrs );
	}

	function display_footer() {
		if ( $this->smart ) :
		?>
		<script>
		// Don't use Pocket's default JS as it we need to force init new Pocket share buttons loaded via JS.
		function jetpack_sharing_pocket_init() {
			jQuery.getScript( 'https://widgets.getpocket.com/v1/j/btn.js?v=1' );
		}
		jQuery( document ).ready( jetpack_sharing_pocket_init );
		jQuery( document.body ).on( 'post-load', jetpack_sharing_pocket_init );
		</script>
		<?php
		else :
			$this->js_dialog( $this->shortname, array( 'width' => 450, 'height' => 450 ) );
		endif;

	}

}

class Share_Telegram extends Sharing_Source {
	public $shortname = 'telegram';

	public function __construct( $id, array $settings ) {
		parent::__construct( $id, $settings );
	}

	public function get_name() {
		return __( 'Telegram', 'jetpack' );
	}
	public function process_request( $post, array $post_data ) {
		// Record stats
		parent::process_request( $post, $post_data );
		$telegram_url = esc_url_raw( 'https://telegram.me/share/url?url=' . rawurlencode( $this->get_share_url( $post->ID ) ) . '&text=' . rawurlencode( $this->get_share_title( $post->ID ) ) );
		wp_redirect( $telegram_url );
		exit;
	}

	public function get_display( $post ) {
		return $this->get_link( $this->get_process_request_url( $post->ID ), _x( 'Telegram', 'share to', 'jetpack' ), __( 'Click to share on Telegram', 'jetpack' ), 'share=telegram' );
	}

	/**
	 * AMP display for Telegram.
	 *
	 * @param \WP_Post $post The current post being viewed.
	 */
	public function get_amp_display( $post ) {
		$attrs = array(
			'data-share-endpoint' => esc_url_raw( 'https://telegram.me/share/url?url=' . rawurlencode( $this->get_share_url( $post->ID ) ) . '&text=' . rawurlencode( $this->get_share_title( $post->ID ) ) ),
		);

		return $this->build_amp_markup( $attrs );
	}

	function display_footer() {
		$this->js_dialog( $this->shortname, array( 'width' => 450, 'height' => 450 ) );
	}
}

class Jetpack_Share_WhatsApp extends Sharing_Source {
	public $shortname = 'jetpack-whatsapp';

	public function __construct( $id, array $settings ) {
		parent::__construct( $id, $settings );
	}

	public function get_name() {
		return __( 'WhatsApp', 'jetpack' );
	}

	public function get_display( $post ) {
		return $this->get_link( $this->get_process_request_url( $post->ID ), _x( 'WhatsApp', 'share to', 'jetpack' ), __( 'Click to share on WhatsApp', 'jetpack' ), 'share=jetpack-whatsapp' );
	}

	/**
	 * AMP display for Whatsapp.
	 *
	 * @param \WP_Post $post The current post being viewed.
	 */
	public function get_amp_display( $post ) {
		$attrs = array(
			'type' => 'whatsapp',
		);

		return $this->build_amp_markup( $attrs );
	}

	public function process_request( $post, array $post_data ) {
		// Record stats
		parent::process_request( $post, $post_data );

		// Firefox for desktop doesn't handle the "api.whatsapp.com" URL properly, so use "web.whatsapp.com"
		if ( User_Agent_Info::is_firefox_desktop() ) {
			$url = 'https://web.whatsapp.com/send?text=';
		} else {
			$url = 'https://api.whatsapp.com/send?text=';
		}

		$url .= rawurlencode( $this->get_share_title( $post->ID ) . ' ' . $this->get_share_url( $post->ID ) );
		wp_redirect( $url );
		exit;
	}
}

class Share_Skype extends Sharing_Source {
	public $shortname = 'skype';
	public $icon = '\f220';
	private $share_type = 'default';

	public function __construct( $id, array $settings ) {
		parent::__construct( $id, $settings );

		if ( isset( $settings['share_type'] ) ) {
			$this->share_type = $settings['share_type'];
		}

		if ( 'official' == $this->button_style ) {
			$this->smart = true;
		} else {
			$this->smart = false;
		}

	}

	public function get_name() {
		return __( 'Skype', 'jetpack' );
	}

	public function get_display( $post ) {
		if ( $this->smart ) {
			$skype_share_html = sprintf(
				'<div class="skype-share" data-href="%1$s" data-lang="%2$s" data-style="small" data-source="jetpack" ></div>',
				esc_attr( $this->get_share_url( $post->ID ) ),
				'en-US'
			);
			return $skype_share_html;
		}

		/** This filter is already documented in modules/sharedaddy/sharing-sources.php */
		if ( apply_filters( 'jetpack_register_post_for_share_counts', true, $post->ID, 'skype' ) ) {
			sharing_register_post_for_share_counts( $post->ID );
		}
		return $this->get_link(
			$this->get_process_request_url( $post->ID ), _x( 'Skype', 'share to', 'jetpack' ), __( 'Click to share on Skype', 'jetpack' ), 'share=skype', 'sharing-skype-' . $post->ID );
	}

	/**
	 * AMP display for Skype.
	 *
	 * @param \WP_Post $post The current post being viewed.
	 */
	public function get_amp_display( $post ) {
		$attrs = array(
			'data-share-endpoint' => sprintf(
				'https://web.skype.com/share?url=%1$s&lang=%2$s=&source=jetpack',
				rawurlencode( $this->get_share_url( $post->ID ) ),
				'en-US'
			),
		);

		return $this->build_amp_markup( $attrs );
	}

	public function process_request( $post, array $post_data ) {
		$skype_url = sprintf(
			'https://web.skype.com/share?url=%1$s&lang=%2$s=&source=jetpack',
			rawurlencode( $this->get_share_url( $post->ID ) ),
			'en-US'
		);

		// Record stats
		parent::process_request( $post, $post_data );

		// Redirect to Skype
		wp_redirect( $skype_url );
		die();
	}

	public function display_footer() {
		if ( $this->smart ) :
			?>
			<script>
				(function(r, d, s) {
					r.loadSkypeWebSdkAsync = r.loadSkypeWebSdkAsync || function(p) {
							var js, sjs = d.getElementsByTagName(s)[0];
							if (d.getElementById(p.id)) { return; }
							js = d.createElement(s);
							js.id = p.id;
							js.src = p.scriptToLoad;
							js.onload = p.callback
							sjs.parentNode.insertBefore(js, sjs);
						};
					var p = {
						scriptToLoad: 'https://swx.cdn.skype.com/shared/v/latest/skypewebsdk.js',
						id: 'skype_web_sdk'
					};
					r.loadSkypeWebSdkAsync(p);
				})(window, document, 'script');
			</script>
			<?php
		else :
			$this->js_dialog( $this->shortname, array( 'width' => 305, 'height' => 665 ) );
		endif;
	}
}
