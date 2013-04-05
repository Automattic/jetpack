<?php

/**
 * Digg changed their button API.
 *
 * The old style button was something like this:
 * [digg=http://digg.com/some-digg-permalink] - uses digg permalink as id.
 *
 * The new style is:
 * [digg class="wide"] # The class options are: 'wide', 'medium', 'compact', 'icon'
 * and uses get_permalink() as id.
 *
 * @author Veselin Nikolov
 */

function digg_shortcode_js() {
	echo '
<script type="text/javascript">
(function(){var s=document.createElement("SCRIPT"),s1=document.getElementsByTagName("SCRIPT")[0];s.type="text/javascript";s.async=true;s.src="http://widgets.digg.com/buttons.js";s1.parentNode.insertBefore(s,s1);})();
</script>
';
}

function digg_shortcode( $atts ) {
	static $printed_digg_code = false;

	if ( ! $printed_digg_code ) {
		add_action( 'wp_footer', 'digg_shortcode_js' );
		$printed_digg_code = true;
	}

	if ( isset( $atts['class']) && in_array( $atts['class'], array( 'wide', 'medium', 'compact', 'icon' ) ) )
		$class = ucfirst( $atts['class'] );
	else
		$class = 'Medium';

	return '<a class="DiggThisButton Digg' . $class . '" href="http://digg.com/submit?url=' . urlencode( get_permalink() ) . '&amp;title=' . urlencode( get_the_title() ) . '"></a>';
}

add_shortcode( 'digg', 'digg_shortcode' );
