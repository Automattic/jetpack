<?php
/**
 * The template for displaying the footer.
 *
 * Contains the closing of the id=main div and all content after
 *
 * @package Minileven
 */
?>

	</div><!-- #main -->
</div><!-- #page -->
<?php get_sidebar(); ?>

</div><!-- #wrapper -->

<footer id="colophon" role="contentinfo">
	<div id="site-generator">

<?php
	global $wp;
	$current_url =  trailingslashit( home_url( add_query_arg( array(), $wp->request ) ) );
?>
		<a href="<?php echo $current_url . '?ak_action=reject_mobile'; ?>"><?php _e( 'View Full Site', 'jetpack' ); ?></a><br />
		<?php do_action( 'wp_mobile_theme_footer' ); ?>
		<?php do_action( 'minileven_credits' ); ?>
		<a href="<?php echo esc_url( __( 'http://wordpress.org/', 'jetpack' ) ); ?>" title="<?php esc_attr_e( 'Semantic Personal Publishing Platform', 'jetpack' ); ?>" rel="generator"><?php printf( __( 'Proudly powered by %s', 'jetpack' ), 'WordPress' ); ?></a>
	</div>
</footer><!-- #colophon -->

<?php wp_footer(); ?>

</body>
</html>