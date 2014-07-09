<?php
	$modules = 	array('Appearance', 'Developers', 'Mobile', 'Other', 'Photos and Videos', 'Social', 'WordPress.com Stats', 'Writing' );
?>
<script id="tmpl-category" type="text/html">
	<?php foreach( $modules as $module ){
		$translated_module = Jetpack::translate_module_tag( $module );
		$module_slug = strtolower ( str_replace( array( ' ', '.' ) , array( '-', '' ) , $translated_module ) ); ?>
		<div class="cat category-<?php echo esc_attr( $module_slug  ); ?> "><h3><?php echo esc_html( $translated_module ); ?></h3><div class="clear"></div></div>
	<?php } ?>
</script>
<script id="tmpl-modalLoading" type="text/html">
	<div class="loading"><span><?php esc_html_e( 'loading&hellip;', 'jetpack' ); ?></span></div>
</script>
<script id="tmpl-mod" type="text/html">
	<div href="{{ data.url }}" data-index="{{ data.index }}" data-name="{{ data.name }}" class="module{{ ( data.new ) ? ' new' : '' }}">
		<h3 class="icon {{ data.module }}">{{{ data.name }}}<# if ( ! data.free ) { #><span class="paid"><?php esc_html_e( 'Paid', 'jetpack' ); ?></span><# } #></h3>
		<p>{{{ data.short_description }}}</p>
	</div>
</script>
<script id="tmpl-modconfig" type="text/html">
	<tr class="configs{{ ( data.active ) ? ' active' : '' }}">
		<td class="sm"><input type="checkbox"></td>
		<td><a href="{{ data.url }}" data-name="{{ data.name }}">{{{ data.name }}}</a></td>
		<td class="med"><a href="{{ data.url }}" data-name="{{{ data.name }}}"><span class="genericon genericon-help" title="<?php esc_attr_e( 'Learn more', 'jetpack' ); ?>"></span></a><# if ( data.hasConfig ) { #><a href="{{ data.url }}" data-name="{{ data.name }}"><span class="genericon genericon-cog" title="<?php esc_attr_e( 'Configure', 'jetpack' ); ?>"></span></a><# } #></td>
	</tr>
</script>

