<?php

/*
 polldaddy.com
 [polldaddy poll="139742"]
 */

if ( !function_exists( 'polldaddy_shortcode_handler' ) ) {
	
	function polldaddy_shortcode_handler_set_data() {
		$resource = wp_remote_get( 'http://polldaddy.com/xml/keywords.xml' );
		$body = wp_remote_retrieve_body( $resource );
		$keywords_xml = simplexml_load_string ( $body );
		$keywords = array();
		$keywords['generated'] = time();
	
		foreach ( $keywords_xml->keyword as $keyword_xml ){
			$keywords[] = array( 'keyword' => (string) $keyword_xml, 'url' => (string) $keyword_xml['url'] );
		}
		wp_cache_set( 'pd-keywords', $keywords, 'site-options', 864000 );
	
		return $keywords;
	}
	
	function polldaddy_add_rating_js() {
		wp_print_scripts( 'polldaddy-rating-js' );
	}
	
	function polldaddy_shortcode_handler( $atts, $content = null ) {
		global $post;
	
		extract( shortcode_atts( array(	
			'survey'     => null,
			'link_text'  => 'View Survey',
			'poll'       => 'empty',
			'rating'     => 'empty',
			'unique_id'  => null,
			'title'      => null,
			'permalink'  => null,
			'cb'         => 0,
			'type'       => null,
			'body'       => '',
			'button'     => '',
			'text_color' => 'FFFFFF',
			'back_color' => '000000',
			'align'      => '',
			'style'      => ''
		), $atts ) );
	
		$survey = esc_attr( str_replace( "'", "", $survey ) );
		$link_text = esc_attr( $link_text );
		
		if ( null != $survey ) {
	
			// This is the new survey embed
			if ( $type != null ) {
				$title      = preg_replace( '/&amp;(\w*);/', '&$1;', esc_js( esc_attr( $title ) ) );
				$type       = preg_replace( '/&amp;(\w*);/', '&$1;', esc_js( esc_attr( $type ) ) );
				$body       = preg_replace( '/&amp;(\w*);/', '&$1;', esc_js( esc_attr( $body ) ) );
				$button     = preg_replace( '/&amp;(\w*);/', '&$1;', esc_js( esc_attr( $button ) ) );
				$text_color = preg_replace( '/&amp;(\w*);/', '&$1;', esc_js( esc_attr( $text_color ) ) );
				$back_color = preg_replace( '/&amp;(\w*);/', '&$1;', esc_js( esc_attr( $back_color ) ) );
				$align      = preg_replace( '/&amp;(\w*);/', '&$1;', esc_js( esc_attr( $align ) ) );
				$style      = preg_replace( '/&amp;(\w*);/', '&$1;', esc_js( esc_attr( $style ) ) );
	
				return "
					<script type='text/javascript' src='http://i0.poll.fm/survey.js' charset='UTF-8'></script>
					<noscript><a href='http://polldaddy.com/s/$survey'>$title</a></noscript>
					<script type='text/javascript'>
					  polldaddy.add( {
					    title: '$title',
					    type: '$type',
					    body: '$body',
					    button: '$button',
					    text_color: '$text_color',
					    back_color: '$back_color',
					    align: '$align',
					    style: '$style',
					    id: '$survey'
					  } );
					</script>			
				";
			
			} else {
				return "
					<script language='javascript' type='text/javascript'>
					var PDF_surveyID = '$survey';
					var PDF_openText = '$link_text';
					</script>
					<script type='text/javascript' language='javascript' src='http://www.polldaddy.com/s.js'></script>
					<noscript><a href='http://surveys.polldaddy.com/s/$survey/'>$link_text</a></noscript>
		
				";
			}
		}
	
		$poll = (int) $poll;
		$rating = (int) $rating;
		$cb = (int) $cb;
	
		if ( $rating > 0 ) {
			if ( null != $unique_id ) { 
				$unique_id = wp_specialchars( $unique_id );
			} else {
				$unique_id = is_page() ? 'wp-page-' : 'wp-post-';
				$unique_id .= $post->ID;
			}
	
			if ( null != $title )
				$title = wp_specialchars( $title );
			else
				$title = urlencode( $post->post_title );
	
			if ( null != $permalink )
				$permalink = clean_url( $permalink );
			else
				$permalink = urlencode( get_permalink( $post->ID ) );
			
			wp_register_script( 'polldaddy-rating-js', 'http://i.polldaddy.com/ratings/rating.js' );
			add_filter( 'wp_footer', 'polldaddy_add_rating_js' );
			
			return '<div id="pd_rating_holder_' . $rating . '"></div>
	<script language="javascript">
		PDRTJS_settings_' . $rating . ' = {
			"id" : "' . $rating . '",
			"unique_id" : "' . $unique_id . '",
			"title" : "' . $title . '",
			"permalink" : "' . $permalink . '"
		};
	</script>';
		} elseif ( $poll > 0 ) {
			$cb = ( $cb == 1 ? '?cb=' . mktime() : '' );
			$keywords = wp_cache_get( 'pd-keywords', 'site-options' );
			if ( ! $keywords || $keywords['generated'] <= ( time() - 300 ) ) {
				if ( ! wp_cache_get( 'pd-keywords-fetching', 'site-options' ) ) {
					wp_cache_set( 'pd-keywords-fetching', 1, 'site-options', 30 );
					$keywords = polldaddy_shortcode_handler_set_data();
				}
			}
	
			if ( !$keywords )
				$keywords = array();
		
			$mod = ( $poll % ( count( $keywords ) - 1 ) );
	
			return '<a name="pd_a_' . $poll . '"></a><div class="PDS_Poll" id="PDI_container' . $poll . '" style="display:inline-block;"></div><script type="text/javascript" language="javascript" charset="utf-8" src="http://static.polldaddy.com/p/' . $poll . '.js' . $cb . '"></script>
			<noscript>
			<a href="http://answers.polldaddy.com/poll/' . $poll . '/">View This Poll</a><br/><span style="font-size:10px;"><a href="' . $keywords[ $mod ][ 'url' ] . '">' . $keywords[ $mod ][ 'keyword' ] . '</a></span>
			</noscript>';
		}
	
		return '<!-- no polldaddy output -->';
	}
	
	add_shortcode( 'polldaddy', 'polldaddy_shortcode_handler' );
	
	// http://answers.polldaddy.com/poll/1562975/?view=results&msg=voted
	function polldaddy_link( $content ) {
		return preg_replace( '!(?:\n|\A)http://answers.polldaddy.com/poll/([0-9]+?)/(.+)?(?:\n|\Z)!i', "\n<script type='text/javascript' language='javascript' charset='utf-8' src='http://s3.polldaddy.com/p/$1.js'></script><noscript> <a href='http://answers.polldaddy.com/poll/$1/'>View Poll</a></noscript>\n", $content );
	}
	
	// higher priority because we need it before auto-link and autop get to it
	add_filter( 'the_content', 'polldaddy_link', 1 );
	add_filter( 'the_content_rss', 'polldaddy_link', 1 );
	add_filter( 'comment_text', 'polldaddy_link', 1 );
	
}