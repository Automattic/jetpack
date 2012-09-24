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
		<a href="<?php echo home_url( '?ak_action=reject_mobile' ); ?>">View Full Site</a><br />
		<?php do_action( 'wp_mobile_theme_footer' ); ?>
		<?php do_action( 'minileven_credits' ); ?>
		<a href="<?php echo esc_url( __( 'http://wordpress.org/', 'jetpack' ) ); ?>" title="<?php esc_attr_e( 'Semantic Personal Publishing Platform', 'minileven' , 'jetpack'); ?>" rel="generator"><?php printf( __( 'Proudly powered by %s', 'minileven' , 'jetpack'), 'WordPress' ); ?></a>
	</div>
</footer><!-- #colophon -->

<?php wp_footer(); ?>

</body>
</html>