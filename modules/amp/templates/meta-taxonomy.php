<?php $categories = get_the_category_list( _x( ', ', 'Used between list items, there is a space after the comma.', 'amp' ), '', $this->ID ); ?>
<?php if ( $categories ) : ?>
	<div class="amp-wp-meta amp-wp-tax-category">
		<?php printf( esc_html__( 'Categories: %s', 'amp' ), $categories ); ?>
	</div>
<?php endif; ?>

<?php
$tags = get_the_tag_list(
	'',
	_x( ', ', 'Used between list items, there is a space after the comma.', 'amp' ),
	'',
	$this->ID
); ?>
<?php if ( $tags && ! is_wp_error( $tags ) ) : ?>
	<div class="amp-wp-meta amp-wp-tax-tag">
		<?php printf( esc_html__( 'Tags: %s', 'amp' ), $tags ); ?>
	</div>
<?php endif; ?>
