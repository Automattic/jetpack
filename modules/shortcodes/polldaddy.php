<?php

if ( !class_exists( 'PolldaddyShortcode' ) ) {
	/**
* Class wrapper for polldaddy shortcodes
*/
class PolldaddyShortcode {

	static $add_script = false;
	static $scripts = false;

	/**
	 * Add all the actions & resgister the shortcode
	 */
	function __construct() {
		if ( defined( 'GLOBAL_TAGS' ) == false )
			add_shortcode( 'polldaddy', array( $this, 'polldaddy_shortcode' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'check_infinite' ) );
		add_action( 'infinite_scroll_render', array( $this, 'polldaddy_shortcode_infinite' ), 11 );
	}

	/**
	 * Shortcode for polldadddy
	 * [polldaddy poll|survey|rating="123456"]
	 *
	 * */
	function polldaddy_shortcode( $atts ) {
		global $post;
		global $content_width;

		extract( shortcode_atts( array(
			'survey'     => null,
			'link_text'  => 'Take Our Survey',
			'poll'       => 'empty',
			'rating'     => 'empty',
			'unique_id'  => null,
			'item_id'    => null,
			'title'      => null,
			'permalink'  => null,
			'cb'         => 0,
			'type'       => 'button',
			'body'       => '',
			'button'     => '',
			'text_color' => '000000',
			'back_color' => 'FFFFFF',
			'align'      => '',
			'style'      => '',
			'width'      => $content_width,
			'height'     => floor( $content_width * 3 / 4 ),
			'delay'      => 100,
			'visit'      => 'single',
			'domain'     => '',
			'id'         => ''
		), $atts, 'polldaddy' ) );

		if ( ! is_array( $atts ) ) {
			return '<!-- Polldaddy shortcode passed invalid attributes -->';
		}

		$inline          = false;
		$no_script       = false;
		$infinite_scroll = false;

		if ( is_home() && current_theme_supports( 'infinite-scroll' ) )
			$infinite_scroll = true;

		if ( defined( 'PADPRESS_LOADED' ) )
			$inline = true;

		if ( function_exists( 'get_option' ) && get_option( 'polldaddy_load_poll_inline' ) )
			$inline = true;

		if ( is_feed() || ( defined( 'DOING_AJAX' ) && !$infinite_scroll ) )
			$no_script = false;

		self::$add_script = $infinite_scroll;

		if ( intval( $rating ) > 0 && !$no_script ) { //rating embed

			if ( empty( $unique_id ) )
				$unique_id = is_page() ? 'wp-page-'.$post->ID : 'wp-post-'.$post->ID;

			if ( empty( $item_id ) )
				$item_id = is_page() ? '_page_'.$post->ID : '_post_'.$post->ID;

			if ( empty( $title ) )
				/** This filter is documented in core/src/wp-includes/general-template.php */
				$title = apply_filters( 'wp_title', $post->post_title, '', '' );

			if ( empty( $permalink ) )
				$permalink = get_permalink( $post->ID );

			$rating    = intval( $rating );
			$unique_id = wp_strip_all_tags( $unique_id );
			$item_id   = wp_strip_all_tags( $item_id );
			$item_id   = preg_replace( '/[^_a-z0-9]/i', '', $item_id );

			$settings = json_encode( array(
				'id'        => $rating,
				'unique_id' => $unique_id,
				'title'     => rawurlencode( trim( $title ) ),
				'permalink' => esc_url( $permalink ),
				'item_id'   => $item_id
			) );

			$item_id = esc_js( $item_id );

			if ( $inline ) {
				return <<<SCRIPT
<div class="pd-rating" id="pd_rating_holder_{$rating}{$item_id}"></div>
<script type="text/javascript" charset="UTF-8"><!--//--><![CDATA[//><!--
PDRTJS_settings_{$rating}{$item_id}={$settings};
//--><!]]></script>
<script type="text/javascript" charset="UTF-8" src="http://i.polldaddy.com/ratings/rating.js"></script>
SCRIPT;
			}
			else {
				if ( self::$scripts === false )
					self::$scripts = array();

				$data = array( 'id' => $rating, 'item_id' => $item_id, 'settings' => $settings );

				self::$scripts['rating'][] = $data;

				add_action( 'wp_footer', array( $this, 'generate_scripts' ) );

				$data = esc_attr( json_encode( $data ) );

				if ( $infinite_scroll )
					return <<<CONTAINER
<div class="pd-rating" id="pd_rating_holder_{$rating}{$item_id}" data-settings="{$data}"></div>
CONTAINER;
				else
					return <<<CONTAINER
<div class="pd-rating" id="pd_rating_holder_{$rating}{$item_id}"></div>
CONTAINER;
			}
		}
		elseif ( intval( $poll ) > 0 ) { //poll embed

			$poll      = intval( $poll );
			$poll_url  = sprintf( 'http://polldaddy.com/poll/%d', $poll );
			$poll_js   = sprintf( '%s.polldaddy.com/p/%d.js', ( is_ssl() ? 'https://secure' : 'http://static' ), $poll );
			$poll_link = sprintf( '<a href="%s">Take Our Poll</a>', $poll_url );

			if ( $no_script )
				return $poll_link;
			else {
				if ( $type == 'slider' && !$inline ) {

					if( !in_array( $visit, array( 'single', 'multiple' ) ) )
						$visit = 'single';

					$settings = json_encode( array(
						'type'  => 'slider',
						'embed' => 'poll',
						'delay' => intval( $delay ),
						'visit' => $visit,
						'id'    => intval( $poll )
					) );

					return <<<SCRIPT
<script type="text/javascript" charset="UTF-8" src="http://i0.poll.fm/survey.js"></script>
<script type="text/javascript" charset="UTF-8"><!--//--><![CDATA[//><!--
polldaddy.add( {$settings} );
//--><!]]></script>
<noscript>{$poll_link}</noscript>
SCRIPT;
				}
				else {
					$cb      = ( $cb == 1 ? '?cb='.mktime() : false );
					$margins = '';
					$float   = '';

					if ( in_array( $align, array( 'right', 'left' ) ) ) {
						$float = sprintf( 'float: %s;', $align );

						if ( $align == 'left')
							$margins = 'margin: 0px 10px 0px 0px;';
						elseif ( $align == 'right' )
							$margins = 'margin: 0px 0px 0px 10px';
					}

					if ( $cb === false && !$inline ) {
						if ( self::$scripts === false )
							self::$scripts = array();

						$data = array( 'url' => $poll_js );

						self::$scripts['poll'][] = $data;

						add_action( 'wp_footer', array( $this, 'generate_scripts' ) );

						$data = esc_attr( json_encode( $data ) );

						return <<<CONTAINER
<a id="pd_a_{$poll}"></a>
<div class="PDS_Poll" id="PDI_container{$poll}" data-settings="{$data}" style="display:inline-block;{$float}{$margins}"></div>
<div id="PD_superContainer"></div>
<noscript>{$poll_link}</noscript>
CONTAINER;
					}
					else {
						if ( $inline )
							$cb = '';

						return <<<CONTAINER
<a id="pd_a_{$poll}"></a>
<div class="PDS_Poll" id="PDI_container{$poll}" style="display:inline-block;{$float}{$margins}"></div>
<div id="PD_superContainer"></div>
<script type="text/javascript" charset="UTF-8" src="{$poll_js}{$cb}"></script>
<noscript>{$poll_link}</noscript>
CONTAINER;
					}
				}
			}
		}
		elseif ( !empty( $survey ) ) { //survey embed

			if ( in_array( $type, array( 'iframe', 'button', 'banner', 'slider' ) ) ) {

				if ( empty( $title ) ) {
					$title = 'Take Our Survey';
					if( !empty( $link_text ) )
						$title = $link_text;
				}

				$survey      = preg_replace( '/[^a-f0-9]/i', '', $survey );
				$survey_url  = esc_url( "http://polldaddy.com/s/{$survey}" );
				$survey_link = sprintf( '<a href="%s">%s</a>', $survey_url, esc_html( $title ) );

				if ( $no_script || $inline || $infinite_scroll )
					return $survey_link;

				if ( $type == 'iframe' ) {
					if ( $height != 'auto' ) {
						if ( isset( $content_width ) && is_numeric( $width ) && $width > $content_width )
							$width = $content_width;

						if ( !$width )
							$width = '100%';
						else
							$width = (int) $width;

						if ( !$height )
							$height = '600';
						else
							$height = (int) $height;

						return <<<CONTAINER
<iframe src="{$survey_url}?iframe=1" frameborder="0" width="{$width}" height="{$height}" scrolling="auto" allowtransparency="true" marginheight="0" marginwidth="0">{$survey_link}</iframe>
CONTAINER;
					}
					elseif ( !empty( $domain ) && !empty( $id ) ) {

						$auto_src = esc_url( "http://{$domain}.polldaddy.com/s/{$id}" );
						$auto_src = parse_url( $auto_src );

						if ( !is_array( $auto_src ) || count( $auto_src ) == 0 )
							return '<!-- no polldaddy output -->';

						if ( !isset( $auto_src['host'] ) || !isset( $auto_src['path'] ) )
							return '<!-- no polldaddy output -->';

						$domain   = $auto_src['host'].'/s/';
						$id       = str_ireplace( '/s/', '', $auto_src['path'] );

						$settings = json_encode( array(
							'type'       => $type,
							'auto'       => true,
							'domain'     => $domain,
							'id'         => $id
						) );
					}
				}
				else {
					$text_color = preg_replace( '/[^a-f0-9]/i', '', $text_color );
					$back_color = preg_replace( '/[^a-f0-9]/i', '', $back_color );

					if ( !in_array( $align, array( 'right', 'left', 'top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right' ) ) )
						$align = '';

					if ( !in_array( $style, array( 'inline', 'side', 'corner', 'rounded', 'square' ) ) )
						$style = '';

					$title  = wp_strip_all_tags( $title );
					$body   = wp_strip_all_tags( $body );
					$button = wp_strip_all_tags( $button );

					$settings = json_encode( array_filter( array(
						'title'      => $title,
						'type'       => $type,
						'body'       => $body,
						'button'     => $button,
						'text_color' => $text_color,
						'back_color' => $back_color,
						'align'      => $align,
						'style'      => $style,
						'id'         => $survey
					) ) );
				}
				return <<<CONTAINER
<script type="text/javascript" charset="UTF-8" src="http://i0.poll.fm/survey.js"></script>
<script type="text/javascript" charset="UTF-8"><!--//--><![CDATA[//><!--
polldaddy.add( {$settings} );
//--><!]]></script>
<noscript>{$survey_link}</noscript>
CONTAINER;
			}
		}
		else
			return '<!-- no polldaddy output -->';
	}

	function generate_scripts() {
		$script = '';

		if ( is_array( self::$scripts ) ) {
			if ( isset( self::$scripts['rating'] ) ) {
				$script = "<script type='text/javascript' charset='UTF-8' id='polldaddyRatings'><!--//--><![CDATA[//><!--\n";
				foreach( self::$scripts['rating'] as $rating ) {
					$script .= "PDRTJS_settings_{$rating['id']}{$rating['item_id']}={$rating['settings']}; if ( typeof PDRTJS_RATING !== 'undefined' ){if ( typeof PDRTJS_{$rating['id']}{$rating['item_id']} == 'undefined' ){PDRTJS_{$rating['id']}{$rating['item_id']} = new PDRTJS_RATING( PDRTJS_settings_{$rating['id']}{$rating['item_id']} );}}";
				}
				$script .= "\n//--><!]]></script><script type='text/javascript' charset='UTF-8' src='http://i.polldaddy.com/ratings/rating.js'></script>";

			}

			if ( isset( self::$scripts['poll'] ) ) {
				foreach( self::$scripts['poll'] as $poll ) {
					$script .= "<script type='text/javascript' charset='UTF-8' src='{$poll['url']}'></script>";
				}
			}
		}

		self::$scripts = false;
		echo $script;
	}

	/**
	 * If the theme uses infinite scroll, include jquery at the start
	 */
	function check_infinite() {
		if ( current_theme_supports( 'infinite-scroll' ) ) {
			wp_enqueue_script( 'jquery' );
		}
	}

	/**
	 * Dynamically load the .js, if needed
	 *
	 * This hooks in late (priority 11) to infinite_scroll_render to determine
	 * a posteriori if a shortcode has been called.
	 */
	function polldaddy_shortcode_infinite() {
		// only try to load if a shortcode has been called and theme supports infinite scroll
		if( self::$add_script ) {
			$script_url = json_encode( esc_url_raw( plugins_url( 'js/polldaddy-shortcode.js', __FILE__ ) ) );

			// if the script hasn't been loaded, load it
			// if the script loads successfully, fire an 'as-script-load' event
			echo <<<SCRIPT
				<script type='text/javascript'>
				//<![CDATA[
				if ( typeof window.polldaddyshortcode === 'undefined' ) {
					var wp_pd_js = document.createElement( 'script' );
					wp_pd_js.type = 'text/javascript';
					wp_pd_js.src = $script_url;
					wp_pd_js.async = true;
					wp_pd_js.onload = function() {
						jQuery( document.body ).trigger( 'pd-script-load' );
					};
					document.getElementsByTagName( 'head' )[0].appendChild( wp_pd_js );
				} else {
					jQuery( document.body ).trigger( 'pd-script-load' );
				}
				//]]>
				</script>
SCRIPT;

		}
	}
}

// kick it all off
new PolldaddyShortcode();

if ( ! function_exists( 'polldaddy_link' ) ) {
	// http://polldaddy.com/poll/1562975/?view=results&msg=voted
	function polldaddy_link( $content ) {
		return preg_replace( '!(?:\n|\A)http://polldaddy.com/poll/([0-9]+?)/(.+)?(?:\n|\Z)!i', "\n<script type='text/javascript' language='javascript' charset='utf-8' src='http://static.polldaddy.com/p/$1.js'></script><noscript> <a href='http://polldaddy.com/poll/$1/'>View Poll</a></noscript>\n", $content );
	}

	// higher priority because we need it before auto-link and autop get to it
	add_filter( 'the_content', 'polldaddy_link', 1 );
	add_filter( 'the_content_rss', 'polldaddy_link', 1 );

	/** This filter is documented in modules/shortcodes/youtube.php */
	if ( apply_filters( 'jetpack_comments_allow_oembed', get_option( 'embed_autourls' ) ) ) {
		add_filter( 'comment_text', 'polldaddy_link', 1 );
	}
}

}
