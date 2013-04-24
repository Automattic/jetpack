<?php

/**
 * Twitter widget class
 * Display the latest N tweets from a Twitter screenname as a widget
 * Customize screenname, maximum number of tweets displayed, show or hide @replies, and text displayed between tweet text and a timestamp
 *
 */

/**
 * Register the widget for use in Appearance -> Widgets
 */
add_action( 'widgets_init', 'jetpack_twitter_widget_init' );

function jetpack_twitter_widget_init() {
	register_widget( 'Jetpack_Widget_Twitter' );
}

class Jetpack_Widget_Twitter extends WP_Widget {

	var $twitter_v1_shutdown = 1367884800; //1367884800 = Tue, 07 May 2013 00:00:00 +0000

	function __construct() {
		parent::__construct(
			'twitter',
			apply_filters( 'jetpack_widget_name', __( 'Twitter', 'jetpack' ) ),
			array(
				'classname' => 'widget_twitter',
				'description' => __( 'Display your Tweets from Twitter', 'jetpack' )
			)
		);

		if ( is_active_widget( false, false, $this->id_base ) || is_active_widget( false, false, 'monster' ) ) {
			add_action( 'wp_head', array( $this, 'style' ) );
		}
	}

	function style() {
?>
<style type="text/css">
.widget_twitter li {
	word-wrap: break-word;
}
</style>
<?php
	}

	function widget( $args, $instance ) {
		$account = trim( urlencode( $instance['account'] ) );

		/**
		* After Twitter disables v1 API calls, show a message to admins/theme managers only that they can show Tweets using a different widget.
		*/
		if ( time() >= $this->twitter_v1_shutdown ) {
			
			if ( current_user_can('edit_theme_options') ) {
				$title = apply_filters( 'widget_title', $instance['title'] );
				if ( empty( $title ) )
					$title = __( 'Twitter Updates', 'jetpack' );

				echo $args['before_widget'];
				echo "{$args['before_title']}<a href='" . esc_url( "http://twitter.com/{$account}" ) . "'>" . esc_html( $title ) . "</a>{$args['after_title']}";
				echo '<p>' . sprintf( __( 'Due to changes with how we interact with Twitter, this widget can no longer display Tweets. Please switch to the <a href="%s">Twitter Timeline</a> widget instead.', 'jetpack' ), admin_url( 'widgets.php' ) ) . '</p>';
				echo $args['after_widget'];
			}

			return;
		}

		if ( empty( $account ) ) {
			if ( current_user_can('edit_theme_options') ) {
				echo $args['before_widget'];
				echo '<p>' . sprintf( __( 'Please configure your Twitter username for the <a href="%s">Twitter Widget</a>.', 'jetpack' ), admin_url( 'widgets.php' ) ) . '</p>';
				echo $args['after_widget'];
			}

			return;
		}

		$title = apply_filters( 'widget_title', $instance['title'] );

		if ( empty( $title ) )
			$title = __( 'Twitter Updates', 'jetpack' );

		$show = absint( $instance['show'] );  // # of Updates to show

		if ( $show > 200 ) // Twitter paginates at 200 max tweets. update() should not have accepted greater than 20
			$show = 200;

		$hidereplies      = (bool) $instance['hidereplies'];
		$hidepublicized   = (bool) $instance['hidepublicized'];
		$include_retweets = (bool) $instance['includeretweets'];
		$follow_button    = (bool) $instance['followbutton'];

		echo "{$args['before_widget']}{$args['before_title']}<a href='" . esc_url( "http://twitter.com/{$account}" ) . "'>" . esc_html( $title ) . "</a>{$args['after_title']}";

		$tweets = $this->fetch_twitter_user_stream( $account, $hidereplies, $show, $include_retweets );

		if ( isset( $tweets['error'] ) && ( isset( $tweets['data'] ) && ! empty( $tweets['data'] ) ) )
			$tweets['error'] = '';

		if ( empty( $tweets['error'] ) ) {
			$before_tweet     = isset( $instance['beforetweet'] ) ? stripslashes( wp_filter_post_kses( $instance['beforetweet'] ) ) : '';
			$before_timesince = ( isset( $instance['beforetimesince'] ) && ! empty( $instance['beforetimesince'] ) ) ? esc_html( $instance['beforetimesince'] ) : ' ';

			$this->display_tweets( $show, $tweets['data'], $hidepublicized, $before_tweet, $before_timesince, $account );

			if ( $follow_button )
				$this->display_follow_button( $account );

			add_action( 'wp_footer', array( $this, 'twitter_widget_script' ) );
		} else {
			echo $tweets['error'];
		}

		echo $args['after_widget'];
		do_action( 'jetpack_bump_stats_extras', 'widget', 'twitter' );
	}

	function display_tweets( $show, $tweets, $hidepublicized, $before_tweet, $before_timesince, $account ) {
		$tweets_out = 0;
		?><ul class='tweets'><?php

		foreach( (array) $tweets as $tweet ) {
			if ( $tweets_out >= $show )
				break;

			if ( empty( $tweet['text'] ) )
				continue;

			if( $hidepublicized && false !== strstr( $tweet['source'], 'http://publicize.wp.com/' ) )
				continue;

			$tweet['text'] = esc_html( $tweet['text'] ); // escape here so that Twitter handles in Tweets don't get mangled
			$tweet         = $this->expand_tco_links( $tweet );
			$tweet['text'] = make_clickable( $tweet['text'] );

			/*
			 * Create links from plain text based on Twitter patterns
			 * @link http://github.com/mzsanford/twitter-text-rb/blob/master/lib/regex.rb Official Twitter regex
			 */
			$tweet['text'] = preg_replace_callback( '/(^|[^0-9A-Z&\/]+)(#|\xef\xbc\x83)([0-9A-Z_]*[A-Z_]+[a-z0-9_\xc0-\xd6\xd8-\xf6\xf8\xff]*)/iu',  array( $this, '_jetpack_widget_twitter_hashtag' ), $tweet['text'] );
			$tweet['text'] = preg_replace_callback( '/([^a-zA-Z0-9_]|^)([@\xef\xbc\xa0]+)([a-zA-Z0-9_]{1,20})(\/[a-zA-Z][a-zA-Z0-9\x80-\xff-]{0,79})?/u', array( $this, '_jetpack_widget_twitter_username' ), $tweet['text'] );

			if ( isset( $tweet['id_str'] ) )
				$tweet_id = urlencode( $tweet['id_str'] );
			else
				$tweet_id = urlencode( $tweet['id'] );

			?>

			<li>
				<?php echo esc_attr( $before_tweet ) . $tweet['text'] . esc_attr( $before_timesince ) ?>
				<a href="<?php echo esc_url( "http://twitter.com/{$account}/statuses/{$tweet_id}" ); ?>" class="timesince"><?php echo esc_html( str_replace( ' ', '&nbsp;', $this->time_since( strtotime( $tweet['created_at'] ) ) ) ); ?>&nbsp;ago</a>
			</li>

			<?php

			unset( $tweet_it );
			$tweets_out++;
		}

		?></ul><?php
	}

	function display_follow_button( $account ) {
		global $themecolors;

		$follow_colors        = isset( $themecolors['link'] ) ? " data-link-color='#{$themecolors['link']}'" : '';
		$follow_colors       .= isset( $themecolors['text'] ) ? " data-text-color='#{$themecolors['text']}'" : '';
		$follow_button_attrs  = " class='twitter-follow-button' data-show-count='false'{$follow_colors}";

		?><a href="http://twitter.com/<?php echo esc_attr( $account ); ?>" <?php echo $follow_button_attrs; ?>>Follow @<?php echo esc_attr( $account ); ?></a><?php
	}

	function expand_tco_links( $tweet ) {
		if ( ! empty( $tweet['entities']['urls'] ) && is_array( $tweet['entities']['urls'] ) ) {
			foreach ( $tweet['entities']['urls'] as $entity_url ) {
				if ( ! empty( $entity_url['expanded_url'] ) ) {
					$tweet['text'] = str_replace(
										$entity_url['url'],
										'<a href="' . esc_url( $entity_url['expanded_url'] ) . '"> ' . esc_html( $entity_url['display_url'] ) . '</a>',
										$tweet['text']
									);
				}
			}
		}

		return $tweet;
	}

	function fetch_twitter_user_stream( $account, $hidereplies, $show, $include_retweets ) {
		$tweets    = get_transient( 'widget-twitter-' . $this->number );
		$the_error = get_transient( 'widget-twitter-error-' . $this->number );

		if ( ! $tweets ) {
			$params = array(
				'screen_name'      => $account, // Twitter account name
				'trim_user'        => true,     // only basic user data (slims the result)
				'include_entities' => true
			);

			// If combined with $count, $exclude_replies only filters that number of tweets (not all tweets up to the requested count).
			if ( $hidereplies )
				$params['exclude_replies'] = true;
			else
				$params['count'] = $show;

			if ( $include_retweets )
				$params['include_rts'] = true;

			$twitter_json_url = esc_url_raw( 'http://api.twitter.com/1/statuses/user_timeline.json?' . http_build_query( $params ), array( 'http', 'https' ) );
			unset( $params );

			$response = wp_remote_get( $twitter_json_url, array( 'User-Agent' => 'WordPress.com Twitter Widget' ) );
			$response_code = wp_remote_retrieve_response_code( $response );

			switch( $response_code ) {
				case 200 : // process tweets and display
					$tweets = json_decode( wp_remote_retrieve_body( $response ), true );

					if ( ! is_array( $tweets ) || isset( $tweets['error'] ) ) {
						do_action( 'jetpack_bump_stats_extras', 'twitter_widget', "request-fail-{$response_code}-bad-data" );
						$the_error = '<p>' . esc_html__( 'Error: Twitter did not respond. Please wait a few minutes and refresh this page.', 'jetpack' ) . '</p>';
						$tweet_cache_expire = 300;
						break;
					} else {
						set_transient( 'widget-twitter-backup-' . $this->number, $tweets, 86400 ); // A one day backup in case there is trouble talking to Twitter
					}

					do_action( 'jetpack_bump_stats_extras', 'twitter_widget', 'request-success' );
					$tweet_cache_expire =  900;
					break;
				case 401 : // display private stream notice
					do_action( 'jetpack_bump_stats_extras', 'twitter_widget', "request-fail-{$response_code}" );

					$tweets = array();
					$the_error = '<p>' . sprintf( esc_html__( 'Error: Please make sure the Twitter account is %1$spublic%2$s.', 'jetpack' ), '<a href="http://support.twitter.com/forums/10711/entries/14016">', '</a>' ) . '</p>';
					$tweet_cache_expire = 300;
					break;
				default :  // display an error message
					do_action( 'jetpack_bump_stats_extras', 'twitter_widget', "request-fail-{$response_code}" );

					$tweets = get_transient( 'widget-twitter-backup-' . $this->number );
					$the_error = '<p>' . esc_html__( 'Error: Twitter did not respond. Please wait a few minutes and refresh this page.', 'jetpack' ) . '</p>';
					$tweet_cache_expire = 300;
					break;
			}

			set_transient( 'widget-twitter-' . $this->number, $tweets, $tweet_cache_expire );
			set_transient( 'widget-twitter-error-' . $this->number, $the_error, $tweet_cache_expire );
		}

		return array( 'data' => $tweets, 'error' => $the_error );
	}

	function update( $new_instance, $old_instance ) {
		$instance = array();

		$instance['account'] = trim( wp_kses( $new_instance['account'], array() ) );
		$instance['account'] = str_replace( array( 'http://twitter.com/', '/', '@', '#!', ), array( '', '', '', '', ), $instance['account'] );

		$instance['title']           = wp_kses( $new_instance['title'], array() );
		$instance['show']            = absint( $new_instance['show'] );
		$instance['hidereplies']     = isset( $new_instance['hidereplies'] );
		$instance['hidepublicized']  = isset( $new_instance['hidepublicized'] );
		$instance['includeretweets'] = isset( $new_instance['includeretweets'] );

		if ( $instance['followbutton'] != $new_instance['followbutton'] ) {
			if ( $new_instance['followbutton'] )
				do_action( 'jetpack_bump_stats_extras', 'twitter_widget', 'follow_button_enabled' );
			else
				do_action( 'jetpack_bump_stats_extras', 'twitter_widget', 'follow_button_disabled' );
		}

		$instance['followbutton']    = ! isset( $new_instance['followbutton'] ) ? 0 : 1;
		$instance['beforetimesince'] = $new_instance['beforetimesince'];

		delete_transient( 'widget-twitter-' . $this->number );
		delete_transient( 'widget-twitter-error-' . $this->number );

		return $instance;
	}

	function form( $instance ) {
		//Defaults
		$account          = isset( $instance['account'] )                                                  ? wp_kses( $instance['account'], array() ) : '';
		$title            = isset( $instance['title'] )                                                    ? $instance['title']                       : '';
		$show             = isset( $instance['show'] )                                                     ? absint( $instance['show'] )              : 5;
		$show             = ( $show < 1 || 20 < $show )                                                    ? 5                                        : $show;
		$hidereplies      = isset( $instance['hidereplies'] ) && ! empty( $instance['hidereplies'] )         ? (bool) $instance['hidereplies']          : false;
		$hidepublicized   = isset( $instance['hidepublicized'] ) && ! empty( $instance['hidepublicized'] )   ? (bool) $instance['hidepublicized']       : false;
		$include_retweets = isset( $instance['includeretweets'] ) && ! empty( $instance['includeretweets'] ) ? (bool) $instance['includeretweets']      : false;
		$follow_button    = isset( $instance['followbutton'] ) && ! empty( $instance['followbutton'] )       ? 1                                        : 0;
		$before_timesince = isset( $instance['beforetimesince'] ) && ! empty( $instance['beforetimesince'] ) ? esc_attr( $instance['beforetimesince'] ) : '';

		/**
		* Show a notice at the top of the widget configuation that they need to switch widgets.
		*/
		?>
		<p><em><?php printf( __( "On May 7th the twitter widget will stop operating due to <a href='%s'>API changes</a> that Twitter is making. To continue displaying your Tweets you should switch to the 'Twitter Timeline' widget.", 'jetpack' ), 'https://dev.twitter.com/blog/api-v1-retirement-final-dates' ); ?></em></p>
		

		<p>
			<label for="<?php echo $this->get_field_id( 'title' ); ?>">
				<?php esc_html_e( 'Title:', 'jetpack' )?>
				<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" type="text" value="<?php echo esc_attr( $title ); ?>" />
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'account' ); ?>">
				<?php esc_html_e( 'Twitter username:', 'jetpack' ); ?> <a href="http://support.wordpress.com/widgets/twitter-widget/#twitter-username" target="_blank">( ? )</a>
				<input class="widefat" id="<?php echo $this->get_field_id( 'account' ); ?>" name="<?php echo $this->get_field_name( 'account' ); ?>" type="text" value="<?php echo esc_attr( $account ); ?>" />
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'show' ); ?>">
				<?php esc_html_e( 'Maximum number of Tweets to show:', 'jetpack' ); ?>
				<select id="<?php echo $this->get_field_id( 'show' ); ?>" name="<?php echo $this->get_field_name( 'show' ); ?>">
					<?php
					for ( $i = 1; $i <= 20; ++$i ) :
						?><option value="<?php echo esc_attr( $i ); ?>" <?php selected( $show, $i ); ?>><?php echo esc_attr( $i ); ?></option><?php
					endfor;
					?>
				</select>
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'hidereplies' ); ?>">
				<input id="<?php echo $this->get_field_id( 'hidereplies' );?>" class="checkbox" type="checkbox" name="<?php echo $this->get_field_name( 'hidereplies' ); ?>" <?php checked( $hidereplies, true ); ?> />
				<?php esc_html_e( 'Hide replies', 'jetpack' ); ?>
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'hidepublicized' ); ?>">
				<input id="<?php echo $this->get_field_id( 'hidepublicized' ); ?>" class="checkbox" type="checkbox" name="<?php echo $this->get_field_name( 'hidepublicized' ); ?>" <?php checked( $hidepublicized, true ); ?> />
 				<?php esc_html_e( 'Hide Tweets pushed by Publicize', 'jetpack' ); ?>
 			</label>
 		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'includeretweets' ); ?>">
				<input id="<?php echo $this->get_field_id( 'includeretweets' ); ?>" class="checkbox" type="checkbox" name="<?php echo $this->get_field_name( 'includeretweets' ); ?>" <?php checked( $include_retweets, true ); ?> />
				<?php esc_html_e( 'Include retweets', 'jetpack' ); ?>
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'followbutton' ); ?>">
				<input id="<?php echo $this->get_field_id( 'followbutton' ); ?>" class="checkbox" type="checkbox" name="<?php echo $this->get_field_name( 'followbutton' ); ?>" <?php checked( $follow_button, 1 ); ?> />
				<?php esc_html_e( 'Display Follow Button', 'jetpack' ); ?>
			</label>
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'beforetimesince' ); ?>">
				<?php esc_html_e( 'Text to display between Tweet and timestamp:', 'jetpack' ); ?>
				<input class="widefat" id="<?php echo $this->get_field_id( 'beforetimesince' ); ?>" name="<?php echo $this->get_field_name( 'beforetimesince' ); ?>" type="text" value="<?php echo esc_attr( $before_timesince ); ?>" />
			</label>
		</p>

		<?php
	}

	function time_since( $original, $do_more = 0 ) {
		// array of time period chunks
		$chunks = array(
			array(60 * 60 * 24 * 365 , 'year'),
			array(60 * 60 * 24 * 30 , 'month'),
			array(60 * 60 * 24 * 7, 'week'),
			array(60 * 60 * 24 , 'day'),
			array(60 * 60 , 'hour'),
			array(60 , 'minute'),
		);

		$today = time();
		$since = $today - $original;

		for ($i = 0, $j = count($chunks); $i < $j; $i++) {
			$seconds = $chunks[$i][0];
			$name = $chunks[$i][1];

			if (($count = floor($since / $seconds)) != 0)
				break;
		}

		$print = ($count == 1) ? '1 '.$name : "$count {$name}s";

		if ($i + 1 < $j) {
			$seconds2 = $chunks[$i + 1][0];
			$name2 = $chunks[$i + 1][1];

			// add second item if it's greater than 0
			if ( (($count2 = floor(($since - ($seconds * $count)) / $seconds2)) != 0) && $do_more )
				$print .= ($count2 == 1) ? ', 1 '.$name2 : ", $count2 {$name2}s";
		}
		return $print;
	}

	/**
	 * Link a Twitter user mentioned in the tweet text to the user's page on Twitter.
	 *
 	 * @param array $matches regex match
	 * @return string Tweet text with inserted @user link
	 */
	function _jetpack_widget_twitter_username( array $matches ) { // $matches has already been through wp_specialchars
		return "$matches[1]@<a href='" . esc_url( 'http://twitter.com/' . urlencode( $matches[3] ) ) . "'>$matches[3]</a>";
	}

	/**
	 * Link a Twitter hashtag with a search results page on Twitter.com
	 *
	 * @param array $matches regex match
	 * @return string Tweet text with inserted #hashtag link
	 */
	function _jetpack_widget_twitter_hashtag( array $matches ) { // $matches has already been through wp_specialchars
		return "$matches[1]<a href='" . esc_url( 'http://twitter.com/search?q=%23' . urlencode( $matches[3] ) ) . "'>#$matches[3]</a>";
	}

	function twitter_widget_script() {
		if ( ! wp_script_is( 'twitter-widgets', 'registered' ) ) {
			if ( is_ssl() )
				$twitter_widget_js = 'https://platform.twitter.com/widgets.js';
			else
				$twitter_widget_js = 'http://platform.twitter.com/widgets.js';
			wp_register_script( 'twitter-widgets', $twitter_widget_js,  array(), '20111117', true );
			wp_print_scripts( 'twitter-widgets' );
		}
	}
}
