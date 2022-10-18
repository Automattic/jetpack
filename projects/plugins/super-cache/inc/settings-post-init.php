<?php
/**
 * All the settings stuff which was AFTER the settings page renders
 */

if ( isset( $wp_supercache_cache_list ) && $wp_supercache_cache_list ) {
	$start_date = get_option( 'wpsupercache_start' );
	if ( ! $start_date ) {
		$start_date = time();
	}
	?>
	<p><?php printf( __( 'Cached pages since %1$s : <strong>%2$s</strong>', 'wp-super-cache' ), date( 'M j, Y', $start_date ), number_format( get_option( 'wpsupercache_count' ) ) ); ?></p>
	<p><?php _e( 'Newest Cached Pages:', 'wp-super-cache' ); ?><ol>
		<?php
		foreach ( array_reverse( (array) get_option( 'supercache_last_cached' ) ) as $url ) {
			$since = time() - strtotime( $url['date'] );
			echo "<li><a title='" . sprintf( esc_html__( 'Cached %s seconds ago', 'wp-super-cache' ), (int) $since ) . "' href='" . site_url( $url['url'] ) . "'>" . substr( $url['url'], 0, 20 ) . "</a></li>\n";
		}
		?>
		</ol>
		<small><?php esc_html_e( '(may not always be accurate on busy sites)', 'wp-super-cache' ); ?></small>
	</p><?php
} elseif ( false == get_option( 'wpsupercache_start' ) ) {
		update_option( 'wpsupercache_start', time() );
		update_option( 'wpsupercache_count', 0 );
}

?>
