<?php
echo '<a name="useragents"></a><fieldset class="options"><h4>' . __( 'Rejected User Agents', 'wp-super-cache' ) . '</h4>';
echo "<p>" . __( 'Strings in the HTTP &#8217;User Agent&#8217; header that prevent WP-Cache from caching bot, spiders, and crawlers&#8217; requests. Note that super cached files are still sent to these agents if they already exists.', 'wp-super-cache' ) . "</p>\n";
echo '<form name="wp_edit_rejected_user_agent" action="' . esc_url_raw( add_query_arg( 'tab', 'settings', $admin_url ) . '#useragents' ) . '" method="post">';
echo '<textarea name="wp_rejected_user_agent" cols="40" rows="4" style="width: 50%; font-size: 12px;" class="code">';
foreach( $cache_rejected_user_agent as $ua ) {
	echo esc_html( $ua ) . "\n";
}
echo '</textarea> ';
echo '<div class="submit"><input class="button-primary" type="submit" ' . SUBMITDISABLED . 'value="' . __( 'Save UA Strings', 'wp-super-cache' ) . '" /></div>';
wp_nonce_field('wp-cache');
echo '</form>';
echo "</fieldset>\n";

