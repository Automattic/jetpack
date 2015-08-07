<?php
	if ( is_plugin_active( 'vaultpress/vaultpress.php' ) ) {
		if ( VaultPress::init()->is_registered() ) {
			$vp_link = 'https://dashboard.vaultpress.com';
			$target = '_blank';
		} else {
			$vp_link = admin_url( 'admin.php?page=vaultpress' );
			$target = '_self';
		}
	} else {
		$vp_link = 'https://vaultpress.com/jetpack';
		$target = '_blank';
	}
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
	<div href="{{ data.url }}" tabindex="0" data-index="{{ data.index }}" data-name="{{ data.name }}" class="module{{ ( data.new ) ? ' new' : '' }}{{ data.activated ? ' active' : '' }}">
		<h3 class="icon {{ data.module }}">{{{ data.name }}}<# if ( ! data.free ) { #><span class="paid"><?php echo esc_html_x( 'Paid', 'As in Premium. Premium module description', 'jetpack' ); ?></span><# } #></h3>
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
<script id="tmpl-mod-jumpstart" type="text/html">
	<div class="j-col j-lrg-4 jp-jumpstart {{ ( data.activated ) ? 'active' : '' }}">
		<strong>{{{ data.name }}}</strong>
		<# if ( data.activated ) { #>
			<span class="jp-config-status"><?php esc_html_e( 'Activated', 'jetpack' ); ?></span>
		<# } #>
		<small>{{{ data.jumpstart_desc }}}</small>
	</div>
</script>
<?php // NUX - Performance and security section ?>
<script id="tmpl-mod-nux" type="text/html">
	<div id="toggle-{{ data.module }}" class="{{ data.activated ? 'activated' : '' }} j-row">
		<div href="{{ data.url }}" tabindex="0" data-index="{{ data.index }}" data-name="{{ data.name }}" class="feat j-col j-lrg-8 j-md-12 j-sm-7">
			<h4 title="{{ data.name }}" style="cursor: pointer; display: inline;">{{{ data.name }}}</h4>
			<# if ( 'vaultpress' == data.module ) { #>
				<span class="paid" title="<?php esc_attr_e( 'Premium Jetpack Service', 'jetpack' ); ?>"><?php esc_attr_e( 'PAID', 'jetpack' ); ?></span>
			<# } else if ( data.configurable ) { #>
				<a href="{{ data.configure_url }}" class="dashicons dashicons-admin-generic" title="<?php esc_attr_e( 'Configure', 'jetpack' ); ?>"></a>
			<# } #>
			<p title="{{ data.short_description }}">{{{ data.short_description }}}</p>
		</div>
		<div class="act j-col j-lrg-4 j-md-12 j-sm-5">
			<div class="module-action">
				<span>
					<# if ( data.activated ) { #>
						<input class="is-compact form-toggle" type="checkbox" id="active-{{ data.module }}" checked />
					<# } else { #>
						<input class="is-compact form-toggle" type="checkbox" id="active-{{ data.module }}" />
					<# } #>
					<label class="form-toggle__label" for="active-{{ data.module }}">
						<img class="module-spinner-{{ data.module }}" style="display: none;" width="16" src="<?php echo esc_url( plugins_url( 'images/wpspin_light-2x.gif', JETPACK__PLUGIN_FILE) ); ?>" alt="Loading ..." />
						<# if ( 'vaultpress' !== data.module ) { #>
							<label class="plugin-action__label" for="active-{{ data.module }}">
								<# if ( data.activated ) { #>
									<?php _e( 'Active', 'jetpack' ); ?>
								<# } else { #>
									<?php _e( 'Inactive', 'jetpack' ); ?>
								<# } #>
							</label>
						<# } #>

						<# if ( 'vaultpress' == data.module ) { #>
							<a href="<?php echo esc_url( $vp_link ); ?>" class="dashicons dashicons-external" title="<?php esc_attr_e( 'Configure', 'jetpack' ); ?>" target="<?php echo $target; ?>"></a>
						<# } else { #>
							<span class="form-toggle__switch"></span>
						<# } #>
					</label>
				</span>
			</div>
		</div>
	</div><?php // j-row ?>
</script>
