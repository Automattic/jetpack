<?php $post_author = $this->get( 'post_author' ); ?>
<?php if ( $post_author ) : ?>
	<?php $author_avatar_url = get_avatar_url( $post_author->user_email, array( 'size' => 24 ) ); ?>
	<div class="amp-wp-meta amp-wp-byline">
		<?php if ( function_exists( 'get_avatar_url' ) ) : ?>
			<amp-img src="<?php echo esc_url( $author_avatar_url ); ?>" width="24" height="24" layout="fixed"></amp-img>
		<?php endif; ?>
		<span class="amp-wp-author author vcard"><?php echo esc_html( $post_author->display_name ); ?></span>
	</div>
<?php endif; ?>
