<?php
echo '<fieldset class="options"><h4>' . __( 'Fix Configuration', 'wp-super-cache' ) . '</h4>';
echo '<form name="wp_restore" action="' . esc_url_raw( add_query_arg( 'tab', 'settings', $admin_url ) . '#top' ) . '" method="post">';
echo '<input type="hidden" name="wp_restore_config" />';
echo '<div class="submit"><input class="button-secondary" type="submit" ' . SUBMITDISABLED . 'id="deletepost" value="' . __( 'Restore Default Configuration', 'wp-super-cache' ) . '" /></div>';
wp_nonce_field('wp-cache');
echo "</form>\n";
echo '</fieldset>';
