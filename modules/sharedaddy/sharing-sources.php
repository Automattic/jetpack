<?php

abstract class Sharing_Source {
	public    $button_style;
	protected $open_links;
	protected $id;
	
	public function __construct( $id, array $settings ) {
		$this->id = $id;

		if ( isset( $settings['button_style'] ) )
			$this->button_style = $settings['button_style'];

		if ( isset( $settings['open_links'] ) )
			$this->open_links = $settings['open_links'];
	}
	
	public function get_id() {
		return $this->id;
	}
	
	public function get_class() {
		return $this->id;
	}
	
	public function has_custom_button_style() {
		return false;
	}
	
	public function get_link( $url, $text, $title, $query = '' ) {
		$klasses = array( 'share-'.$this->get_class() );
		
		if ( $this->button_style == 'icon' || $this->button_style == 'icon-text' )
			$klasses[] = 'share-icon';
		
		if ( $this->button_style == 'icon' ) {
			$text = '';
			$klasses[] = 'no-text';
		}
		
		if ( !empty( $query ) ) {
			if ( stripos( $url, '?' ) === false )
				$url .= '?'.$query;
			else
				$url .= '&amp;'.$query;
		}
			
		if ( $this->button_style == 'text' )
			$klasses[] = 'no-icon';

		return sprintf( '<a rel="nofollow" class="%s" href="%s"%s title="%s">%s</a>', implode( ' ', $klasses ), $url, ( $this->open_links == 'new' ) ? ' target="_blank"' : '', $title, $text );
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
	
	public function display_preview() {
		echo '<div class="option">';
		
		if ( $this->button_style == 'text' || $this->button_style == 'icon-text' )
			echo $this->get_name();
		else
			echo '&nbsp;';
			
		echo '</div>';
	}

	public function get_total( $post = false ) {
		global $wpdb, $blog_id;
		
		$name = strtolower( $this->get_id() ); 
		
		if ( $post == false ) {
			// get total number of shares for service
			return (int) $wpdb->get_var( $wpdb->prepare( "SELECT SUM( count ) FROM sharing_stats WHERE blog_id = %d AND share_service = %s", $blog_id, $name ) );
		}
		
		//get total shares for a post
		return (int) $wpdb->get_var( $wpdb->prepare( "SELECT count FROM sharing_stats WHERE blog_id = %d AND post_id = %d AND share_service = %s", $blog_id, $post->ID, $name ) );
	}	
	
	public function get_posts_total() {
		global $wpdb, $blog_id;
		
		$totals = array();
		$name   = strtolower( $this->get_id() ); 
		
		$my_data = $wpdb->get_results( $wpdb->prepare( "SELECT post_id as id, SUM( count ) as total FROM sharing_stats WHERE blog_id = %d AND share_service = %s GROUP BY post_id ORDER BY count DESC ", $blog_id, $name ) );
		
		if ( !empty( $my_data ) )
			foreach( $my_data as $row )
				$totals[] = new Sharing_Post_Total( $row->id, $row->total );
		
		usort( $totals, array( 'Sharing_Post_Total', 'cmp' ) );
		
		return $totals;
	}
	
	public function process_request( $post, array $post_data ) {
		do_action( 'sharing_bump_stats', array( 'service' => $this, 'post' => $post ) );
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
	public function get_name() {
		return __( 'Email', 'jetpack' );
	}

	// Default does nothing	
	public function process_request( $post, array $post_data ) {
		$ajax = false;
		if ( isset( $_SERVER['HTTP_X_REQUESTED_WITH'] ) && strtolower( $_SERVER['HTTP_X_REQUESTED_WITH'] ) == 'xmlhttprequest' )
			$ajax = true;

		$source_email = $target_email = $source_name = false;

		if ( isset( $post_data['source_email'] ) && is_email( $post_data['source_email'] ) )
			$source_email = $post_data['source_email'];

		if ( isset( $post_data['target_email'] ) && is_email( $post_data['target_email'] ) )
			$target_email = $post_data['target_email'];
			
		if ( isset( $post_data['source_name'] ) )
			$source_name = $post_data['source_name'];
		
		// Test email
		$error = 1;   // Failure in data
		if ( $source_email && $target_email && $source_name ) {
			if ( apply_filters( 'sharing_email_check', true, $post, $post_data ) ) {
				$data = array(
					'post'   => $post,
					'source' => $source_email,
					'target' => $target_email,
					'name'   => $source_name
				);
				
				if ( ( $data = apply_filters( 'sharing_email_can_send', $data ) ) !== false ) {
					// Record stats
					parent::process_request( $data['post'], $post_data );

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
				}
				else
					wp_safe_redirect( get_permalink( $post->ID ).'?shared=email' );

				die();
			}
			else
				$error = 2;   // Email check failed
		}
				
		if ( $ajax )
			echo $error;
		else
			wp_safe_redirect( get_permalink( $post->ID ).'?shared=email&msg=fail' );

		die();
	}
	
	public function get_display( $post ) {
		return $this->get_link( get_permalink( $post->ID ), _x( 'Email', 'share to', 'jetpack' ), __( 'Click to email this to a friend', 'jetpack' ), 'share=email' );
	}
	
	/**
	 * Outputs the hidden email dialog
	 */
	 
	public function display_footer() {
		global $current_user;
		
		$visible = $status = false;
?>
	<div id="sharing_email" style="<?php if ( $visible === false ) echo 'display: none;'; ?>">
		<form action="" method="post">
			<label for="target_email"><?php _e( 'Send to Email Address', 'jetpack' ) ?></label>
			<input type="text" name="target_email" id="target_email" value="" />
			
			<?php if ( is_user_logged_in() ) : ?>
				<input type="hidden" name="source_name" value="<?php echo esc_attr( $current_user->display_name ); ?>" />
				<input type="hidden" name="source_email" value="<?php echo esc_attr( $current_user->user_email ); ?>" />
			<?php else : ?>

				<label for="source_name"><?php _e( 'Your Name', 'jetpack' ) ?></label>
				<input type="text" name="source_name" id="source_name" value="" />
				
				<label for="source_email"><?php _e( 'Your Email Address', 'jetpack' ) ?></label>
				<input type="text" name="source_email" id="source_email" value="" />

			<?php endif; ?>
			
			<?php do_action( 'sharing_email_dialog', 'sharedaddy' ); ?>

			<img style="float: right; display: none" class="loading" src="<?php echo plugin_dir_url( __FILE__ ); ?>images/loading.gif" alt="loading" width="16" height="16" />
			<input type="submit" value="<?php _e( 'Send Email', 'jetpack' ); ?>" class="sharing_send" />
			<a href="#cancel" class="sharing_cancel"><?php _e( 'Cancel', 'jetpack' ); ?></a>
			
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

class Share_Twitter extends Sharing_Advanced_Source {
	private $smart = true;
	
	public function __construct( $id, array $settings ) {
		parent::__construct( $id, $settings );

		if ( isset( $settings['smart'] ) )
			$this->smart = $settings['smart'];
	}
	
	public function get_name() {
		return __( 'Twitter', 'jetpack' );
	}

	public function get_display( $post ) {
		if ( $this->smart == 'smart' )
			return '<div class="twitter_button"><iframe allowtransparency="true" frameborder="0" scrolling="no" src="http://platform.twitter.com/widgets/tweet_button.html?url=' . rawurlencode( apply_filters( 'sharing_permalink', get_permalink( $post->ID ), $post->ID, $this->id ) ) . '&amp;counturl=' . rawurlencode( str_replace( 'https://', 'http://', get_permalink( $post->ID ) ) ) . '&amp;count=horizontal&amp;text=' . rawurlencode( apply_filters( 'sharing_post_title', $post->post_title, $post->ID, $this->id ) ) . ': " style="width:97px; height:20px;"></iframe></div>';
		else
			return $this->get_link( get_permalink( $post->ID ), _x( 'Twitter', 'share to', 'jetpack' ), __( 'Click to share on Twitter', 'jetpack' ), 'share=twitter' );
	}	
	
	public function process_request( $post, array $post_data ) {
		$post_title = apply_filters( 'sharing_post_title', $post->post_title, $post->ID, $this->id );
		$post_link = apply_filters( 'sharing_permalink', get_permalink( $post->ID ), $post->ID, $this->id );
		
		$twitter_url = '';	
		if ( function_exists( 'mb_stripos' ) )
			$mb = true;
	  else
			$mb = false;
		
		if ( ( $mb && ( mb_strlen( $post_title ) + 1 + mb_strlen( $post_link ) ) > 140 ) || ( !$mb && ( strlen( $post_title ) + 1 + strlen( $post_link ) ) > 140 ) ) {
			if ( $mb ) {
				$twitter_url = 'http://twitter.com/?status=' . rawurlencode( ( mb_substr( $post_title, 0, (140 - mb_strlen ( $post_link ) - 4 ) ) ) . '... ' . $post_link );		
			} else {
				$twitter_url = 'http://twitter.com/?status=' . rawurlencode( ( substr( $post_title, 0, (140 - strlen ( $post_link ) - 4 ) ) ) . '... ' . $post_link );		
			}
		}
		else {
			$twitter_url = 'http://twitter.com/?status=' . rawurlencode( $post_title . ' ' . $post_link );
		}
		
		// Record stats
		parent::process_request( $post, $post_data );
		
		// Redirect to Twitter
		wp_redirect( $twitter_url );
		die();
	}
	
	public function has_custom_button_style() {
		return $this->smart;
	}

	public function display_preview() {
?>
	<div class="option option-smart-<?php echo $this->smart ? 'on' : 'off'; ?>">
		<?php
			if ( !$this->smart ) {
				if ( $this->button_style == 'text' || $this->button_style == 'icon-text' )
					echo $this->get_name();
				else
					echo '&nbsp;';
			}
		?>
	</div>
<?php
	}
	
	public function update_options( array $data ) {
		$this->smart = false;

		if ( isset( $data['smart'] ) )
			$this->smart = true;
	}

	public function get_options() {
		return array(
			'smart' => $this->smart
		);
	}

	public function display_options() {
?>
	<div class="input">
		<label>
			<input name="smart" type="checkbox"<?php if ( $this->smart ) echo ' checked="checked"'; ?>/>
			
			<?php _e( 'Use smart button', 'jetpack' ); ?>
		</label>
	</div>
<?php
	}
}

class Share_Stumbleupon extends Sharing_Advanced_Source {
	private $smart = false;
	
	public function __construct( $id, array $settings ) {
		parent::__construct( $id, $settings );

		if ( isset( $settings['smart'] ) )
			$this->smart = $settings['smart'];
	}
	
	public function get_name() {
		return __( 'StumbleUpon', 'jetpack' );
	}

	public function has_custom_button_style() {
		return $this->smart;
	}

	public function get_display( $post ) {
		if ( $this->smart == 'smart' )
			return '<div class="stumbleupon_button"><iframe src="http://www.stumbleupon.com/badge/embed/1/?url=' . urlencode( apply_filters( 'sharing_permalink', get_permalink( $post->ID ), $post->ID, $this->id ) ) . '&amp;title=' . urlencode( apply_filters( 'sharing_post_title', $post->post_title, $post->ID, $this->id ) ) . '" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:74px; height: 18px;" allowTransparency="true"></iframe></div>';
		else
			return $this->get_link( get_permalink( $post->ID ), _x( 'StumbleUpon', 'share to', 'jetpack' ), __( 'Click to share on StumbleUpon', 'jetpack' ), 'share=stumbleupon' );
	}		
	
	public function display_preview() {
?>
	<div class="option option-smart-<?php echo $this->smart ? 'on' : 'off'; ?>">
		<?php
			if ( !$this->smart ) {
				if ( $this->button_style == 'text' || $this->button_style == 'icon-text' )
					echo $this->get_name();
				else
					echo '&nbsp;';
			}
		?>
	</div>
<?php
	}
	
	public function process_request( $post, array $post_data ) {
		$stumbleupon_url = 'http://www.stumbleupon.com/submit?url=' . urlencode( apply_filters( 'sharing_permalink', get_permalink( $post->ID ), $post->ID, $this->id ) ) . '&title=' . urlencode( apply_filters( 'sharing_post_title', $post->post_title, $post->ID, $this->id ) );	
		
		// Record stats
		parent::process_request( $post, $post_data );
		
		// Redirect to Stumbleupon
		wp_redirect( $stumbleupon_url );
		die();
	}
	
	public function update_options( array $data ) {
		$this->smart = false;

		if ( isset( $data['smart'] ) )
			$this->smart = true;
	}

	public function get_options() {
		return array(
			'smart' => $this->smart
		);
	}

	public function display_options() {
?>
	<div class="input">
		<label>
			<input name="smart" type="checkbox"<?php if ( $this->smart ) echo ' checked="checked"'; ?>/>
			
			<?php _e( 'Use smart button', 'jetpack' ); ?>
		</label>
	</div>
<?php 
	}
}

class Share_Reddit extends Sharing_Advanced_Source {
	private $smart = false;
	
	public function __construct( $id, array $settings ) {
		parent::__construct( $id, $settings );

		if ( isset( $settings['smart'] ) )
			$this->smart = $settings['smart'];
	}

	public function get_name() {
		return __( 'Reddit', 'jetpack' );
	}

	public function get_display( $post ) {
		if ( $this->smart == 'smart' )
			return '<div class="reddit_button"><iframe src="http://www.reddit.com/static/button/button1.html?width=120&amp;url=' . urlencode( apply_filters( 'sharing_permalink', get_permalink( $post->ID ), $post->ID, $this->id ) ) . '&amp;title=' . rawurlencode( apply_filters( 'sharing_post_title', $post->post_title, $post->ID, $this->id ) ) . '" height="22" width="120" scrolling="no" frameborder="0"></iframe></div>';
		else
			return $this->get_link( get_permalink( $post->ID ), __( 'Reddit', 'share to', 'jetpack' ), __( 'Click to share on Reddit', 'jetpack' ), 'share=reddit' );
	}	
	
	public function update_options( array $data ) {
		$this->smart = false;

		if ( isset( $data['smart'] ) )
			$this->smart = true;
	}

	public function has_custom_button_style() {
		return $this->smart;
	}

	public function get_options() {
		return array(
			'smart' => $this->smart
		);
	}

	public function display_options() {
?>
	<div class="input">
		<label>
			<input name="smart" type="checkbox"<?php if ( $this->smart ) echo ' checked="checked"'; ?>/>
			
			<?php _e( 'Use smart button', 'jetpack' ); ?>
		</label>
	</div>
<?php
	}
	
	public function display_preview() {
?>
	<div class="option option-smart-<?php echo $this->smart ? 'on' : 'off'; ?>">
		<?php
			if ( !$this->smart ) {
				if ( $this->button_style == 'text' || $this->button_style == 'icon-text' )
					echo $this->get_name();
				else
					echo '&nbsp;';
			}
		?>
	</div>
<?php
	}
	
	public function process_request( $post, array $post_data ) {
		$reddit_url = 'http://reddit.com/submit?url=' . urlencode( apply_filters( 'sharing_permalink', get_permalink( $post->ID ), $post->ID, $this->id ) ) . '&title=' . urlencode( apply_filters( 'sharing_post_title', $post->post_title, $post->ID, $this->id ) );	
		
		// Record stats
		parent::process_request( $post, $post_data );
		
		// Redirect to Reddit
		wp_redirect( $reddit_url );
		die();
	}
}

class Share_Digg extends Sharing_Advanced_Source {
	private $smart = false;
	
	public function __construct( $id, array $settings ) {
		parent::__construct( $id, $settings );

		if ( isset( $settings['smart'] ) )
			$this->smart = $settings['smart'];
	}
	
	public function get_name() {
		return __( 'Digg', 'jetpack' );
	}

	public function has_custom_button_style() {
		return $this->smart;
	}

	public function get_display( $post ) {
		if ( $this->smart ) {
			$url = $this->get_link( 'http://digg.com/submit?url='. urlencode( apply_filters( 'sharing_permalink', get_permalink( $post->ID ), $post->ID, $this->id ) ) . '&amp;title=' . urlencode( apply_filters( 'sharing_post_title', $post->post_title, $post->ID, $this->id ) ), 'Digg', __( 'Click to Digg this post', 'jetpack' ) );
			return '<div class="digg_button">' . str_replace( 'class="', 'class="DiggThisButton DiggCompact ', $url ) . '</div>';
		}
		else
			return $this->get_link( get_permalink( $post->ID ), _x( 'Digg', 'share to', 'jetpack' ), __( 'Click to Digg this post', 'jetpack' ), 'share=digg' );
	}	
	
	public function process_request( $post, array $post_data ) {
		$digg_url = 'http://digg.com/submit?url=' . urlencode( apply_filters( 'sharing_permalink', get_permalink( $post->ID ), $post->ID, $this->id ) ) . '&title=' . urlencode( apply_filters( 'sharing_post_title', $post->post_title, $post->ID, $this->id ) );	
		
		// Record stats
		parent::process_request( $post, $post_data );
		
		// Redirect to Digg
		wp_redirect( $digg_url );
		die();
	}
	
	public function display_header() {
		if ( $this->smart ) {
?>
<script type="text/javascript">
(function() {
	var s = document.createElement('SCRIPT'), s1 = document.getElementsByTagName('SCRIPT')[0];
	s.type = 'text/javascript';
	s.async = true;
	s.src = 'http://widgets.digg.com/buttons.js';
	s1.parentNode.insertBefore(s, s1);
})();
</script>
<?php
		}
	}
	
	public function update_options( array $data ) {
		$this->smart = false;

		if ( isset( $data['smart'] ) )
			$this->smart = true;
	}

	public function get_options() {
		return array(
			'smart' => $this->smart
		);
	}

	public function display_options() {
?>
	<div class="input">
		<label>
			<input name="smart" type="checkbox"<?php if ( $this->smart ) echo ' checked="checked"'; ?>/>
			
			<?php _e( 'Use smart button', 'jetpack' ); ?>
		</label>
	</div>
<?php
	}
	
	public function display_preview() {
?>
	<div class="option option-smart-<?php echo $this->smart ? 'on' : 'off'; ?>">
		<?php
			if ( !$this->smart ) {
				if ( $this->button_style == 'text' || $this->button_style == 'icon-text' )
					echo $this->get_name();
				else
					echo '&nbsp;';
			}
		?>
	</div>
<?php
	}
}

class Share_LinkedIn extends Sharing_Advanced_Source {
	private $smart = true;
	
	public function __construct( $id, array $settings ) {
		parent::__construct( $id, $settings );

		if ( isset( $settings['smart'] ) )
			$this->smart = (bool) $settings['smart'];
	}

	public function get_name() {
		return __( 'LinkedIn', 'jetpack' );
	}

	public function has_custom_button_style() {
		return (bool) $this->smart;
	}
	
	public function display_header() {
	}
	
	public function get_display( $post ) {
		static $added_linkedin_js = false;
		$proto = ( is_ssl() ) ? 'https://' : 'http://';
		$permalink = get_permalink( $post->ID );
		$display = '';
		
		if( $this->smart ) {
			
			// So we don't spit out the linkedin js for each post on index pages
			if( ! $added_linkedin_js ) {
				$display .= sprintf( '<script type="text/javascript" src="%splatform.linkedin.com/in.js"></script>', $proto );
				$added_linkedin_js = true;
			}
			
			$display .= sprintf( '<div class="linkedin_button"><script type="in/share" data-url="%s" data-counter="right"></script></div>', esc_url( $permalink ) );
			
		} else {
		
			$display = $this->get_link( $permalink, _x( 'LinkedIn', 'share to', 'jetpack' ), __( 'Click to share on LinkedIn', 'jetpack' ), 'share=linkedin' );
			
		}
		return $display;
	}
	
	public function process_request( $post, array $post_data ) {
		$post_link = apply_filters( 'sharing_permalink', get_permalink( $post->ID ), $post->ID, $this->id );

		// http://www.linkedin.com/shareArticle?mini=true&url={articleUrl}&title={articleTitle}&summary={articleSummary}&source={articleSource}

		$encoded_title = rawurlencode( $post->post_title );
		if( strlen( $encoded_title ) > 200 )
			$encoded_title = substr( $encoded_title, 0, 197 ) . '...';

		$encoded_summary = rawurlencode( get_the_excerpt() );
		if( strlen( $encoded_summary ) > 256 )
			$encoded_summary = substr( $encoded_summary, 0, 253 ) . '...';
	
		$source = get_bloginfo( 'name' );

		$query = add_query_arg( array(
			'title' => $encoded_title,
			'url' => rawurlencode( $post_link ),
			'source' => rawurlencode( $source ),
			'summary' => $encoded_summary,
		) );

		$linkedin_url = 'http://www.linkedin.com/shareArticle?mini=true' . $query;
		
		// Record stats
		parent::process_request( $post, $post_data );

		// Redirect to LinkedIn
		wp_redirect( $linkedin_url );
		die();
	}
	
	public function update_options( array $data ) {
		$this->smart = false;

		if ( isset( $data['smart'] ) )
			$this->smart = true;
	}

	public function get_options() {
		return array(
			'smart' => $this->smart
		);
	}

	public function display_options() {
		?><div class="input">
			<label>
				<input name="smart" type="checkbox"<?php checked( $this->smart ); ?>/>
				<?php _e( 'Use smart button', 'jetpack' ); ?>
			</label>
		</div><?php
	}
	
	public function display_preview() {
		?>
		<div class="option option-smart-<?php echo $this->smart ? 'on' : 'off'; ?>">
		<?php
		if ( ! $this->smart ) {
			if ( $this->button_style == 'text' || $this->button_style == 'icon-text' )
				echo $this->get_name();
			else
				echo '&nbsp;';
		} ?>
		</div><?php
	}
}

class Share_Facebook extends Sharing_Advanced_Source {
	private $share_type = 'default';
	
	public function __construct( $id, array $settings ) {
		parent::__construct( $id, $settings );

		if ( isset( $settings['share_type'] ) )
			$this->share_type = $settings['share_type'];
	}

	public function get_name() {
		return __( 'Facebook', 'jetpack' );
	}

	public function has_custom_button_style() {
		return $this->share_type != 'default';
	}
	
	public function display_header() {
		if ( $this->share_type == 'share' ) {
			// Set the open graph description, otherwise Facebook may pick up some random text from the page
			global $post;
			
			if ( $post && $post->ID > 0 )
				echo '<meta property="og:description" content="'.esc_attr( apply_filters( 'sharing_post_title', $post->post_title, $post->ID, $this->id ) ).'" />';
		}
	}

	function guess_locale_from_lang( $lang ) {
		$lang = strtolower( str_replace( '-', '_', $lang ) );
		if ( 5 == strlen( $lang ) )
			$lang = substr( $lang, 0, 3 ) . strtoupper( substr( $lang, 3, 2 ) ); // Already in xx_xx, just make sure it's uppered
		else if ( 3 == strlen( $lang ) )
			$lang = $lang; // Don't know what to do with these
		else
			$lang = $lang . '_' . strtoupper( $lang ); // Sometimes this gives a workable locale
		return $lang;
	}

	public function get_display( $post ) {
		if ( $this->share_type == 'share' ) {
			return '<div class="facebook_button"><a name="fb_share" rel="nofollow" type="button" share_url="' . apply_filters( 'sharing_permalink', get_permalink( $post->ID ), $post->ID, $this->id ) . '" href="http://www.facebook.com/sharer.php?u=' . rawurlencode( get_permalink( $post->ID ) ) . '&t=' . rawurlencode( apply_filters( 'sharing_post_title', $post->post_title, $post->ID, $this->id ) ) . '">'.__( 'Share' , 'jetpack' ).'</a><script src="http://static.ak.fbcdn.net/connect.php/js/FB.Share" type="text/javascript"></script></div>';
		} else if ( $this->share_type == 'like' ) {
			$url = 'http://www.facebook.com/plugins/like.php?href=' . rawurlencode( get_permalink( $post->ID ) ) . '&amp;layout=button_count&amp;show_faces=false&amp;action=like&amp;colorscheme=light&amp;height=21';
			
			// Default widths to suit English
			$inner_w = 90;
			
			// Locale-specific widths/overrides
			$widths = array(
				'de' => array( 'width' => 100, 'locale' => 'de_DE' ),
				'da' => array( 'width' => 120, 'locale' => 'da_DK' ),
				'fi' => array( 'width' => 100, 'locale' => 'fi_FI' ),
			);

			$widths = apply_filters( 'sharing_facebook_like_widths', $widths );
			
			// Fix the button to the blogs locale and then adjust the width
			$locale = str_replace( '-', '_', get_locale() );
			
			if ( isset( $widths[substr( $locale, 0, 2 )] ) ) {
				$inner_w = $widths[substr( $locale, 0, 2 )]['width'];
				$locale  = $widths[substr( $locale, 0, 2 )]['locale'];
			} else {
				$locale  = $this->guess_locale_from_lang( get_locale() );
			}
			
			if ( $locale && 'en_US' != $locale )
				$url .= '&amp;locale=' . $locale;

			$url .= '&amp;width='.$inner_w;
			return '<div class="like_button"><iframe src="'.$url.'" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:'.( $inner_w + 6 ).'px; height:21px;" allowTransparency="true"></iframe></div>';
		}
			
		return $this->get_link( get_permalink( $post->ID ), _x( 'Facebook', 'share to', 'jetpack' ), __( 'Share on Facebook', 'jetpack' ), 'share=facebook' );
	}
	
	
	public function update_options( array $data ) {
		$this->share_type = 'default';

		if ( isset( $data['share_type'] ) && in_array( $data['share_type'], array( 'default', 'like', 'share' ) ) )
			$this->share_type = $data['share_type'];
	}

	public function get_options() {
		return array(
			'share_type' => $this->share_type
		);
	}

	public function display_options() {
?>
	<div class="input">
		<label>
			<select name="share_type">
				<option value="default"<?php if ( $this->share_type == 'default' ) echo ' selected="selected"'; ?>><?php _e( 'Default button', 'jetpack' ); ?></option>
				<option value="share"<?php if ( $this->share_type == 'share' ) echo ' selected="selected"'; ?>><?php _e( 'Share button', 'jetpack' ); ?></option>
				<option value="like"<?php if ( $this->share_type == 'like' ) echo ' selected="selected"'; ?>><?php _e( 'Like button', 'jetpack' ); ?></option>
			</select>
		</label>
	</div>
<?php
	}
	
	public function display_preview() {
?>
	<div class="option option-smart-<?php 
	
	if ( $this->share_type == 'share'  ) {
		echo ( 'on">' );
		echo '&nbsp;';
	}
	elseif ( $this->share_type == 'like' ) {
		echo ( 'like">' );
		echo '&nbsp;';
	}
	else {
		echo ( 'off">' );
		if ( $this->button_style == 'text' || $this->button_style == 'icon-text' )
			echo $this->get_name();
		else
			echo '&nbsp;';
	}
	?>
	</div>
<?php
	}

	public function process_request( $post, array $post_data ) {
		$fb_url = 'http://www.facebook.com/sharer.php?u=' . urlencode( apply_filters( 'sharing_permalink', get_permalink( $post->ID ), $post->ID, $this->id ) ) . '&t=' . urlencode( apply_filters( 'sharing_post_title', $post->post_title, $post->ID, $this->id ) );	
		
		// Record stats
		parent::process_request( $post, $post_data );
		
		// Redirect to Facebook
		wp_redirect( $fb_url );
		die();
	}
}

class Share_Print extends Sharing_Source {
	public function get_name() {
		return __( 'Print', 'jetpack' );
	}

	public function get_display( $post ) {
		return $this->get_link( get_permalink( $post->ID ). ( ( is_single() || is_page() ) ? '#print': '' ), _x( 'Print', 'share to', 'jetpack' ), __( 'Click to print', 'jetpack' ) );
	}
}

class Share_PressThis extends Sharing_Source {
	public function get_name() {
		return __( 'Press This', 'jetpack' );
	}

	public function process_request( $post, array $post_data ) {
		global $current_user;
		
		$blogs = get_blogs_of_user( $current_user->ID );
		if ( empty( $blogs ) ) {
			wp_safe_redirect( get_permalink( $post->ID ) ); 
			die();
		}
		
		$blog = current( $blogs );

		$url = $blog->siteurl.'/wp-admin/press-this.php?u='.urlencode( apply_filters( 'sharing_permalink', get_permalink( $post->ID ), $post->ID, $this->id ) ).'&t='.urlencode( apply_filters( 'sharing_post_title', $post->post_title, $post->ID, $this->id ) ).'&v=4';

		if ( isset( $_GET['sel'] ) )
			$url .= '&s='.urlencode( $_GET['sel'] );

		// Record stats
		parent::process_request( $post, $post_data );
		
		// Redirect to Press This
		wp_safe_redirect( $url );
		die();
	}

	public function get_display( $post ) {
		return $this->get_link( get_permalink( $post->ID ), _x( 'Press This', 'share to', 'jetpack' ), __( 'Click to Press This!', 'jetpack' ), 'share=press-this' );
	}
}

class Share_GooglePlus1 extends Sharing_Source {	
	private $state = false;
	
	public function get_name() {
		return __( 'Google +1', 'jetpack' );
	}

	public function get_display( $post ) {
		return '<div class="googleplus1_button"><div class="g-plusone" data-size="medium" data-callback="sharing_plusone" data-href="' . esc_attr( get_permalink( $post->ID ) ) . '"></div></div>';
	}		
	
	public function display_preview() {
?>
	<div class="option option-smart-on"></div>
<?php
	}
	
	public function get_state() {
		return $this->state;
	}
	
	public function process_request( $post, array $post_data ) {		
		
		if ( isset( $post_data['state'] ) ) {
			$this->state = $post_data['state'];
		}
		// Record stats
		parent::process_request( $post, $post_data );
		die();
	}
	
	public function display_footer() {
		global $post;
?>
	<script type="text/javascript" charset="utf-8">
	function sharing_plusone( obj ) { 
		jQuery.ajax( {
			url: '<?php echo get_permalink( $post->ID ) . '?share=google-plus-1'; ?>',
			type: 'POST',
			data: obj
		} );
	}
	</script>
	<script type="text/javascript" src="http://apis.google.com/js/plusone.js"></script>
<?php
	}	

	public function get_total( $post = false ) {
		global $wpdb, $blog_id;
		
		$name = strtolower( $this->get_id() ); 
		
		if ( $post == false ) {
			// get total number of shares for service
			return $wpdb->get_var( $wpdb->prepare( "SELECT SUM( count ) FROM sharing_stats WHERE blog_id = %d AND share_service = %s", $blog_id, $name ) );
		}
		
		//get total shares for a post
		return $wpdb->get_var( $wpdb->prepare( "SELECT count FROM sharing_stats WHERE blog_id = %d AND post_id = %d AND share_service = %s", $blog_id, $post->ID, $name ) );
	}
}

class Share_Custom extends Sharing_Advanced_Source {
	private $name;
	private $icon;
	private $url;
	
	public function get_class() {
		return 'custom';
	}

	public function __construct( $id, array $settings ) {
		parent::__construct( $id, $settings );

		if ( isset( $settings['name'] ) )
			$this->name = $settings['name'];

		if ( isset( $settings['icon'] ) )
			$this->icon = $settings['icon'];

		if ( isset( $settings['url'] ) )
			$this->url = $settings['url'];
	}
	
	public function get_name() {
		return $this->name;
	}
	
	public function get_display( $post ) {
		$str = $this->get_link( get_permalink( $post->ID ), esc_html( $this->name ), __( 'Click to share', 'jetpack' ), 'share='.$this->id );
		return str_replace( 'class="', 'style="background:url(' . esc_url( $this->icon ) . ') no-repeat center left;" class="', $str );
	}

	public function process_request( $post, array $post_data ) {
		$url = $this->url;
		$url = str_replace( '%post_url%', urlencode( apply_filters( 'sharing_permalink', get_permalink( $post->ID ), $post->ID, $this->id ) ), $url );
		$url = str_replace( '%post_full_url%', urlencode( get_permalink( $post->ID ) ), $url );
		$url = str_replace( '%post_title%', urlencode( apply_filters( 'sharing_post_title', $post->post_title, $post->ID, $this->id ) ), $url );

		if ( strpos( $url, '%post_tags%' ) !== false ) {
			$tags   = get_the_tags( $post->ID );
			$tagged = '';
			
			if ( $tags ) {
				foreach ( $tags AS $tag ) {
					$tagged[] = urlencode( $tag->name );
				}
			
				$tagged = implode( ',', $tagged );
			}

			$url = str_replace( '%post_tags%', $tagged, $url );
		}
		
		if ( strpos( $url, '%post_excerpt%' ) !== false ) {
			$url_excerpt = $post->post_excerpt;
			if ( empty( $url_excerpt ) )
				$url_excerpt = $post->post_content;
			
			$url_excerpt = strip_tags( strip_shortcodes( $url_excerpt ) );
			$url_excerpt = wp_html_excerpt( $url_excerpt, 100 );
			$url_excerpt = rtrim( preg_replace( '/[^ .]*$/', '', $url_excerpt ) );
			$url = str_replace( '%post_excerpt%', urlencode( $url_excerpt ), $url );
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
					<input class="button-secondary" type="submit"value="<?php _e( 'Save', 'jetpack' ); ?>" />
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
		
		if ( $name )
			$this->name = $name;

		if ( $url )
			$this->url  = $url;
			
		if ( $icon )
			$this->icon = $icon;
	}

	public function get_options() {
		return array(
			'name' => $this->name,
			'icon' => $this->icon,
			'url'  => $this->url,
		);
	}
}
