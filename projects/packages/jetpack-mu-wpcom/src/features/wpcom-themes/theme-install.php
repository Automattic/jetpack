<?php
/**
 * Install theme administration panel.
 *
 * @package WordPress
 * @subpackage Administration
 */

// required for shielding the function definitions in this file
// from the ones already defined in themes.php
namespace WPCOM\Theme_Showcase;

// required for access to global from inside the namespace
global $submenu;

// required to define the name of this page for the load-themes.php action
global $plugin_page;
$plugin_page = 'theme-install.php';

/** WordPress Administration Bootstrap */
// @patched Use the abspath since this file is not in wp-admin folder.
require_once ABSPATH . 'wp-admin/admin.php';

require ABSPATH . 'wp-admin/includes/theme-install.php';

$tab = ! empty( $_REQUEST['tab'] ) ? sanitize_text_field( $_REQUEST['tab'] ) : '';

// @patched Remove capbility check & multisite check.
// if ( ! current_user_can( 'install_themes' ) ) {
// wp_die( __( 'Sorry, you are not allowed to install themes on this site.' ) );
// }

// if ( is_multisite() && ! is_network_admin() ) {
// wp_redirect( network_admin_url( 'theme-install.php' ) );
// exit;
// }

// Used in the HTML title tag.
$title       = __( 'Add Themes', 'jetpack-mu-wpcom' );
$parent_file = 'themes.php';

if ( ! is_network_admin() ) {
	$submenu_file = 'themes.php';
}

$installed_themes = search_theme_directories();

if ( false === $installed_themes ) {
	$installed_themes = array();
}

foreach ( $installed_themes as $theme_slug => $theme_data ) {
	// Ignore child themes.
	if ( str_contains( $theme_slug, '/' ) ) {
		unset( $installed_themes[ $theme_slug ] );
	}
}

wp_localize_script(
	'theme',
	'_wpThemeSettings',
	array(
		'themes'          => false,
		'settings'        => array(
			'isInstall'  => true,
			'canInstall' => current_user_can( 'install_themes' ),
			'installURI' => current_user_can( 'install_themes' ) ? self_admin_url( 'theme-install.php' ) : null,
			'adminUrl'   => parse_url( self_admin_url(), PHP_URL_PATH ),
		),
		'l10n'            => array(
			'addNew'              => __( 'Add New Theme', 'jetpack-mu-wpcom' ),
			'search'              => __( 'Search Themes', 'jetpack-mu-wpcom' ),
			'upload'              => __( 'Upload Theme', 'jetpack-mu-wpcom' ),
			'back'                => __( 'Back', 'jetpack-mu-wpcom' ),
			'error'               => sprintf(
				/* translators: %s: Support forums URL. */
				__( 'An unexpected error occurred. Something may be wrong with WordPress.org or this server&#8217;s configuration. If you continue to have problems, please try the <a href="%s">support forums</a>.', 'jetpack-mu-wpcom' ),
				__( 'https://wordpress.org/support/forums/', 'jetpack-mu-wpcom' )
			),
			'tryAgain'            => __( 'Try Again', 'jetpack-mu-wpcom' ),
			/* translators: %d: Number of themes. */
			'themesFound'         => __( 'Number of Themes found: %d', 'jetpack-mu-wpcom' ),
			'noThemesFound'       => __( 'No themes found. Try a different search.', 'jetpack-mu-wpcom' ),
			'collapseSidebar'     => __( 'Collapse Sidebar', 'jetpack-mu-wpcom' ),
			'expandSidebar'       => __( 'Expand Sidebar', 'jetpack-mu-wpcom' ),
			/* translators: Hidden accessibility text. */
			'selectFeatureFilter' => __( 'Select one or more Theme features to filter by', 'jetpack-mu-wpcom' ),
		),
		'installedThemes' => array_keys( $installed_themes ),
		'activeTheme'     => get_stylesheet(),
	)
);

wp_enqueue_script( 'theme' );
wp_enqueue_script( 'updates' );

if ( $tab ) {
	/**
	 * Fires before each of the tabs are rendered on the Install Themes page.
	 *
	 * The dynamic portion of the hook name, `$tab`, refers to the current
	 * theme installation tab.
	 *
	 * Possible hook names include:
	 *
	 *  - `install_themes_pre_block-themes`
	 *  - `install_themes_pre_dashboard`
	 *  - `install_themes_pre_featured`
	 *  - `install_themes_pre_new`
	 *  - `install_themes_pre_search`
	 *  - `install_themes_pre_updated`
	 *  - `install_themes_pre_upload`
	 *
	 * @since 2.8.0
	 * @since 6.1.0 Added the `install_themes_pre_block-themes` hook name.
	 */
	do_action( "install_themes_pre_{$tab}" );
}

$help_overview =
	'<p>' . sprintf(
		/* translators: %s: Theme Directory URL. */
		__( 'You can find additional themes for your site by using the Theme Browser/Installer on this screen, which will display themes from the <a href="%s">WordPress Theme Directory</a>. These themes are designed and developed by third parties, are available free of charge, and are compatible with the license WordPress uses.', 'jetpack-mu-wpcom' ),
		__( 'https://wordpress.org/themes/', 'jetpack-mu-wpcom' )
	) . '</p>' .
	'<p>' . __( 'You can Search for themes by keyword, author, or tag, or can get more specific and search by criteria listed in the feature filter.', 'jetpack-mu-wpcom' ) . ' <span id="live-search-desc">' . __( 'The search results will be updated as you type.', 'jetpack-mu-wpcom' ) . '</span></p>' .
	'<p>' . __( 'Alternately, you can browse the themes that are Popular or Latest. When you find a theme you like, you can preview it or install it.', 'jetpack-mu-wpcom' ) . '</p>' .
	'<p>' . sprintf(
		/* translators: %s: /wp-content/themes */
		__( 'You can Upload a theme manually if you have already downloaded its ZIP archive onto your computer (make sure it is from a trusted and original source). You can also do it the old-fashioned way and copy a downloaded theme&#8217;s folder via FTP into your %s directory.', 'jetpack-mu-wpcom' ),
		'<code>/wp-content/themes</code>'
	) . '</p>';

get_current_screen()->add_help_tab(
	array(
		'id'      => 'overview',
		'title'   => __( 'Overview', 'jetpack-mu-wpcom' ),
		'content' => $help_overview,
	)
);

$help_installing =
	'<p>' . __( 'Once you have generated a list of themes, you can preview and install any of them. Click on the thumbnail of the theme you are interested in previewing. It will open up in a full-screen Preview page to give you a better idea of how that theme will look.', 'jetpack-mu-wpcom' ) . '</p>' .
	'<p>' . __( 'To install the theme so you can preview it with your site&#8217;s content and customize its theme options, click the "Install" button at the top of the left-hand pane. The theme files will be downloaded to your website automatically. When this is complete, the theme is now available for activation, which you can do by clicking the "Activate" link, or by navigating to your Manage Themes screen and clicking the "Live Preview" link under any installed theme&#8217;s thumbnail image.', 'jetpack-mu-wpcom' ) . '</p>';

get_current_screen()->add_help_tab(
	array(
		'id'      => 'installing',
		'title'   => __( 'Previewing and Installing', 'jetpack-mu-wpcom' ),
		'content' => $help_installing,
	)
);

// Help tab: Block themes.
$help_block_themes =
	'<p>' . __( 'A block theme is a theme that uses blocks for all parts of a site including navigation menus, header, content, and site footer. These themes are built for the features that allow you to edit and customize all parts of your site.', 'jetpack-mu-wpcom' ) . '</p>' .
	'<p>' . __( 'With a block theme, you can place and edit blocks without affecting your content by customizing or creating new templates.', 'jetpack-mu-wpcom' ) . '</p>';

get_current_screen()->add_help_tab(
	array(
		'id'      => 'block_themes',
		'title'   => __( 'Block themes', 'jetpack-mu-wpcom' ),
		'content' => $help_block_themes,
	)
);

get_current_screen()->set_help_sidebar(
	'<p><strong>' . __( 'For more information:', 'jetpack-mu-wpcom' ) . '</strong></p>' .
	'<p>' . __( '<a href="https://wordpress.org/documentation/article/appearance-themes-screen/#install-themes">Documentation on Adding New Themes</a>', 'jetpack-mu-wpcom' ) . '</p>' .
	'<p>' . __( '<a href="https://wordpress.org/documentation/article/block-themes/">Documentation on Block Themes</a>', 'jetpack-mu-wpcom' ) . '</p>' .
	'<p>' . __( '<a href="https://wordpress.org/support/forums/">Support forums</a>', 'jetpack-mu-wpcom' ) . '</p>'
);

require_once ABSPATH . 'wp-admin/admin-header.php';

?>
<div class="wrap">
	<h1 class="wp-heading-inline"><?php echo esc_html( $title ); ?></h1>

	<?php

	/**
	 * Filters the tabs shown on the Add Themes screen.
	 *
	 * This filter is for backward compatibility only, for the suppression of the upload tab.
	 *
	 * @since 2.8.0
	 *
	 * @param string[] $tabs Associative array of the tabs shown on the Add Themes screen. Default is 'upload'.
	 */
	$tabs = apply_filters( 'install_themes_tabs', array( 'upload' => __( 'Upload Theme', 'jetpack-mu-wpcom' ) ) );

	if ( apply_filters( 'install_themes_should_display_upload_button', ! empty( $tabs['upload'] ) && current_user_can( 'upload_themes' ) ) ) { // WPCOM hack - add install_themes_should_display_upload_button filter
		echo ' <button type="button" class="upload-view-toggle page-title-action hide-if-no-js" aria-expanded="false">' . __( 'Upload Theme', 'jetpack-mu-wpcom' ) . '</button>';
	}
	?>

	<hr class="wp-header-end">

	<?php
	wp_admin_notice(
		__( 'The Theme Installer screen requires JavaScript.', 'jetpack-mu-wpcom' ),
		array(
			'additional_classes' => array( 'error', 'hide-if-js' ),
		)
	);
	?>

	<div class="upload-theme">
	<?php install_themes_upload(); ?>
	</div>

	<h2 class="screen-reader-text hide-if-no-js">
		<?php
		/* translators: Hidden accessibility text. */
		_e( 'Filter themes list', 'jetpack-mu-wpcom' );
		?>
	</h2>

	<div class="wp-filter hide-if-no-js">
		<div class="filter-count">
			<span class="count theme-count"></span>
		</div>

		<ul class="filter-links">
			<li><a href="#" data-sort="popular"><?php _ex( 'Popular', 'themes', 'jetpack-mu-wpcom' ); ?></a></li>
			<li><a href="#" data-sort="new"><?php _ex( 'Latest', 'themes', 'jetpack-mu-wpcom' ); ?></a></li>
			<li><a href="#" data-sort="block-themes"><?php _ex( 'Block Themes', 'themes', 'jetpack-mu-wpcom' ); ?></a></li>
			<li><a href="#" data-sort="favorites"><?php _ex( 'Favorites', 'themes', 'jetpack-mu-wpcom' ); ?></a></li>
		</ul>

		<button type="button" class="button drawer-toggle" aria-expanded="false"><?php _e( 'Feature Filter', 'jetpack-mu-wpcom' ); ?></button>

		<form class="search-form"><p class="search-box"></p></form>

		<div class="favorites-form">
			<?php
			$action = 'save_wporg_username_' . get_current_user_id();
			if ( isset( $_GET['_wpnonce'] ) && wp_verify_nonce( wp_unslash( $_GET['_wpnonce'] ), $action ) ) {
				$user = isset( $_GET['user'] ) ? wp_unslash( $_GET['user'] ) : get_user_option( 'wporg_favorites' );
				update_user_meta( get_current_user_id(), 'wporg_favorites', $user );
			} else {
				$user = get_user_option( 'wporg_favorites' );
			}
			?>
			<p class="install-help"><?php _e( 'If you have marked themes as favorites on WordPress.org, you can browse them here.', 'jetpack-mu-wpcom' ); ?></p>

			<p class="favorites-username">
				<label for="wporg-username-input"><?php _e( 'Your WordPress.org username:', 'jetpack-mu-wpcom' ); ?></label>
				<input type="hidden" id="wporg-username-nonce" name="_wpnonce" value="<?php echo esc_attr( wp_create_nonce( $action ) ); ?>" />
				<input type="search" id="wporg-username-input" value="<?php echo esc_attr( $user ); ?>" />
				<input type="button" class="button favorites-form-submit" value="<?php esc_attr_e( 'Get Favorites', 'jetpack-mu-wpcom' ); ?>" />
			</p>
		</div>

		<div class="filter-drawer">
			<div class="buttons">
				<button type="button" class="apply-filters button"><?php _e( 'Apply Filters', 'jetpack-mu-wpcom' ); ?><span></span></button>
				<button type="button" class="clear-filters button" aria-label="<?php esc_attr_e( 'Clear current filters', 'jetpack-mu-wpcom' ); ?>"><?php _e( 'Clear', 'jetpack-mu-wpcom' ); ?></button>
			</div>
		<?php
		// Use the core list, rather than the .org API, due to inconsistencies
		// and to ensure tags are translated.
		$feature_list = get_theme_feature_list( false );

		foreach ( $feature_list as $feature_group => $features ) {
			echo '<fieldset class="filter-group">';
			echo '<legend>' . esc_html( $feature_group ) . '</legend>';
			echo '<div class="filter-group-feature">';
			foreach ( $features as $feature => $feature_name ) {
				$feature = esc_attr( $feature );
				echo '<input type="checkbox" id="filter-id-' . $feature . '" value="' . $feature . '" /> ';
				echo '<label for="filter-id-' . $feature . '">' . esc_html( $feature_name ) . '</label>';
			}
			echo '</div>';
			echo '</fieldset>';
		}
		?>
			<div class="buttons">
				<button type="button" class="apply-filters button"><?php _e( 'Apply Filters', 'jetpack-mu-wpcom' ); ?><span></span></button>
				<button type="button" class="clear-filters button" aria-label="<?php esc_attr_e( 'Clear current filters', 'jetpack-mu-wpcom' ); ?>"><?php _e( 'Clear', 'jetpack-mu-wpcom' ); ?></button>
			</div>
			<div class="filtered-by">
				<span><?php _e( 'Filtering by:', 'jetpack-mu-wpcom' ); ?></span>
				<div class="tags"></div>
				<button type="button" class="button-link edit-filters"><?php _e( 'Edit Filters', 'jetpack-mu-wpcom' ); ?></button>
			</div>
		</div>
	</div>
	<h2 class="screen-reader-text hide-if-no-js">
		<?php
		/* translators: Hidden accessibility text. */
		_e( 'Themes list', 'jetpack-mu-wpcom' );
		?>
	</h2>
	<div class="theme-browser content-filterable"></div>
	<div class="theme-install-overlay wp-full-overlay expanded"></div>

	<p class="no-themes"><?php _e( 'No themes found. Try a different search.', 'jetpack-mu-wpcom' ); ?></p>
	<span class="spinner"></span>

<?php
if ( $tab ) {
	/**
	 * Fires at the top of each of the tabs on the Install Themes page.
	 *
	 * The dynamic portion of the hook name, `$tab`, refers to the current
	 * theme installation tab.
	 *
	 * Possible hook names include:
	 *
	 *  - `install_themes_block-themes`
	 *  - `install_themes_dashboard`
	 *  - `install_themes_featured`
	 *  - `install_themes_new`
	 *  - `install_themes_search`
	 *  - `install_themes_updated`
	 *  - `install_themes_upload`
	 *
	 * @since 2.8.0
	 * @since 6.1.0 Added the `install_themes_block-themes` hook name.
	 *
	 * @param int $paged Number of the current page of results being viewed.
	 */
	do_action( "install_themes_{$tab}", $paged );
}
?>
</div>

<script id="tmpl-theme" type="text/template">
	<?php ob_start(); ?>
	<# if ( data.screenshot_url ) { #>
		<div class="theme-screenshot">
			<img src="{{ data.screenshot_url }}?ver={{ data.version }}" alt="" />
		</div>
	<# } else { #>
		<div class="theme-screenshot blank"></div>
	<# } #>

	<# if ( data.installed ) { #>
		<?php
		wp_admin_notice(
			_x( 'Installed', 'theme', 'jetpack-mu-wpcom' ),
			array(
				'type'               => 'success',
				'additional_classes' => array( 'notice-alt' ),
			)
		);
		?>
	<# } #>

	<# if ( ! data.compatible_wp || ! data.compatible_php ) { #>
		<div class="notice notice-error notice-alt"><p>
			<# if ( ! data.compatible_wp && ! data.compatible_php ) { #>
				<?php
				_e( 'This theme does not work with your versions of WordPress and PHP.', 'jetpack-mu-wpcom' );
				if ( current_user_can( 'update_core' ) && current_user_can( 'update_php' ) ) {
					printf(
						/* translators: 1: URL to WordPress Updates screen, 2: URL to Update PHP page. */
						' ' . __( '<a href="%1$s">Please update WordPress</a>, and then <a href="%2$s">learn more about updating PHP</a>.', 'jetpack-mu-wpcom' ),
						self_admin_url( 'update-core.php' ),
						esc_url( wp_get_update_php_url() )
					);
					wp_update_php_annotation( '</p><p><em>', '</em>' );
				} elseif ( current_user_can( 'update_core' ) ) {
					printf(
						/* translators: %s: URL to WordPress Updates screen. */
						' ' . __( '<a href="%s">Please update WordPress</a>.', 'jetpack-mu-wpcom' ),
						self_admin_url( 'update-core.php' )
					);
				} elseif ( current_user_can( 'update_php' ) ) {
					printf(
						/* translators: %s: URL to Update PHP page. */
						' ' . __( '<a href="%s">Learn more about updating PHP</a>.', 'jetpack-mu-wpcom' ),
						esc_url( wp_get_update_php_url() )
					);
					wp_update_php_annotation( '</p><p><em>', '</em>' );
				}
				?>
			<# } else if ( ! data.compatible_wp ) { #>
				<?php
				_e( 'This theme does not work with your version of WordPress.', 'jetpack-mu-wpcom' );
				if ( current_user_can( 'update_core' ) ) {
					printf(
						/* translators: %s: URL to WordPress Updates screen. */
						' ' . __( '<a href="%s">Please update WordPress</a>.', 'jetpack-mu-wpcom' ),
						self_admin_url( 'update-core.php' )
					);
				}
				?>
			<# } else if ( ! data.compatible_php ) { #>
				<?php
				_e( 'This theme does not work with your version of PHP.', 'jetpack-mu-wpcom' );
				if ( current_user_can( 'update_php' ) ) {
					printf(
						/* translators: %s: URL to Update PHP page. */
						' ' . __( '<a href="%s">Learn more about updating PHP</a>.', 'jetpack-mu-wpcom' ),
						esc_url( wp_get_update_php_url() )
					);
					wp_update_php_annotation( '</p><p><em>', '</em>' );
				}
				?>
			<# } #>
		</p></div>
	<# } #>

	<span class="more-details"><?php _ex( 'Details &amp; Preview', 'theme', 'jetpack-mu-wpcom' ); ?></span>
	<div class="theme-author">
		<?php
		/* translators: %s: Theme author name. */
		printf( __( 'By %s', 'jetpack-mu-wpcom' ), '{{ data.author }}' );
		?>
	</div>

	<div class="theme-id-container">
		<h3 class="theme-name">{{ data.name }}</h3>

		<div class="theme-actions">
			<# if ( data.installed ) { #>
				<# if ( data.compatible_wp && data.compatible_php ) { #>
					<?php
					/* translators: %s: Theme name. */
					$aria_label = sprintf( _x( 'Activate %s', 'theme', 'jetpack-mu-wpcom' ), '{{ data.name }}' );
					?>
					<# if ( data.activate_url ) { #>
						<# if ( ! data.active ) { #>
							<a class="button button-primary activate" href="{{ data.activate_url }}" aria-label="<?php echo esc_attr( $aria_label ); ?>"><?php _e( 'Activate', 'jetpack-mu-wpcom' ); ?></a>
						<# } else { #>
							<button class="button button-primary disabled"><?php _ex( 'Activated', 'theme', 'jetpack-mu-wpcom' ); ?></button>
						<# } #>
					<# } #>
					<# if ( data.customize_url ) { #>
						<# if ( ! data.active ) { #>
							<# if ( ! data.block_theme ) { #>
								<a class="button load-customize" href="{{ data.customize_url }}"><?php _e( 'Live Preview', 'jetpack-mu-wpcom' ); ?></a>
							<# } #>
						<# } else { #>
							<a class="button load-customize" href="{{ data.customize_url }}"><?php _e( 'Customize', 'jetpack-mu-wpcom' ); ?></a>
						<# } #>
					<# } else { #>
						<button class="button preview install-theme-preview"><?php _e( 'Preview', 'jetpack-mu-wpcom' ); ?></button>
					<# } #>
				<# } else { #>
					<?php
					/* translators: %s: Theme name. */
					$aria_label = sprintf( _x( 'Cannot Activate %s', 'theme', 'jetpack-mu-wpcom' ), '{{ data.name }}' );
					?>
					<# if ( data.activate_url ) { #>
						<a class="button button-primary disabled" aria-label="<?php echo esc_attr( $aria_label ); ?>"><?php _ex( 'Cannot Activate', 'theme', 'jetpack-mu-wpcom' ); ?></a>
					<# } #>
					<# if ( data.customize_url ) { #>
						<a class="button disabled"><?php _e( 'Live Preview', 'jetpack-mu-wpcom' ); ?></a>
					<# } else { #>
						<button class="button disabled"><?php _e( 'Preview', 'jetpack-mu-wpcom' ); ?></button>
					<# } #>
				<# } #>
			<# } else { #>
				<# if ( data.compatible_wp && data.compatible_php ) { #>
					<?php
					/* translators: %s: Theme name. */
					$aria_label = sprintf( _x( 'Install %s', 'theme', 'jetpack-mu-wpcom' ), '{{ data.name }}' );
					?>
					<a class="button button-primary theme-install" data-name="{{ data.name }}" data-slug="{{ data.id }}" href="{{ data.install_url }}" aria-label="<?php echo esc_attr( $aria_label ); ?>"><?php _e( 'Install', 'jetpack-mu-wpcom' ); ?></a>
					<button class="button preview install-theme-preview"><?php _e( 'Preview', 'jetpack-mu-wpcom' ); ?></button>
				<# } else { #>
					<?php
					/* translators: %s: Theme name. */
					$aria_label = sprintf( _x( 'Cannot Install %s', 'theme', 'jetpack-mu-wpcom' ), '{{ data.name }}' );
					?>
					<a class="button button-primary disabled" data-name="{{ data.name }}" aria-label="<?php echo esc_attr( $aria_label ); ?>"><?php _ex( 'Cannot Install', 'theme', 'jetpack-mu-wpcom' ); ?></a>
					<button class="button disabled"><?php _e( 'Preview', 'jetpack-mu-wpcom' ); ?></button>
				<# } #>
			<# } #>
		</div>
	</div>
	<?php
		// @patched Add filter for theme card view template.
		$content = ob_get_clean();
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo apply_filters( 'wpcom_themes_tmpl_theme', $content );
	?>
</script>

<script id="tmpl-theme-preview" type="text/template">
	<?php ob_start(); ?>
	<div class="wp-full-overlay-sidebar">
		<div class="wp-full-overlay-header">
			<button class="close-full-overlay"><span class="screen-reader-text">
				<?php
				/* translators: Hidden accessibility text. */
				_e( 'Close', 'jetpack-mu-wpcom' );
				?>
			</span></button>
			<button class="previous-theme"><span class="screen-reader-text">
				<?php
				/* translators: Hidden accessibility text. */
				_e( 'Previous theme', 'jetpack-mu-wpcom' );
				?>
			</span></button>
			<button class="next-theme"><span class="screen-reader-text">
				<?php
				/* translators: Hidden accessibility text. */
				_e( 'Next theme', 'jetpack-mu-wpcom' );
				?>
			</span></button>
			<# if ( data.installed ) { #>
				<# if ( data.compatible_wp && data.compatible_php ) { #>
					<?php
					/* translators: %s: Theme name. */
					$aria_label = sprintf( _x( 'Activate %s', 'theme', 'jetpack-mu-wpcom' ), '{{ data.name }}' );
					?>
					<# if ( ! data.active ) { #>
						<a class="button button-primary activate" href="{{ data.activate_url }}" aria-label="<?php echo esc_attr( $aria_label ); ?>"><?php _e( 'Activate', 'jetpack-mu-wpcom' ); ?></a>
					<# } else { #>
						<button class="button button-primary disabled"><?php _ex( 'Activated', 'theme', 'jetpack-mu-wpcom' ); ?></button>
					<# } #>
				<# } else { #>
					<a class="button button-primary disabled" ><?php _ex( 'Cannot Activate', 'theme', 'jetpack-mu-wpcom' ); ?></a>
				<# } #>
			<# } else { #>
				<# if ( data.compatible_wp && data.compatible_php ) { #>
					<a href="{{ data.install_url }}" class="button button-primary theme-install" data-name="{{ data.name }}" data-slug="{{ data.id }}"><?php _e( 'Install', 'jetpack-mu-wpcom' ); ?></a>
				<# } else { #>
					<a class="button button-primary disabled" ><?php _ex( 'Cannot Install', 'theme', 'jetpack-mu-wpcom' ); ?></a>
				<# } #>
			<# } #>
		</div>
		<div class="wp-full-overlay-sidebar-content">
			<div class="install-theme-info">
				<h3 class="theme-name">{{ data.name }}</h3>
					<span class="theme-by">
						<?php
						/* translators: %s: Theme author name. */
						printf( __( 'By %s', 'jetpack-mu-wpcom' ), '{{ data.author }}' );
						?>
					</span>

					<div class="theme-screenshot">
						<img class="theme-screenshot" src="{{ data.screenshot_url }}?ver={{ data.version }}" alt="" />
					</div>

					<div class="theme-details">
						<# if ( data.rating ) { #>
							<div class="theme-rating">
								{{{ data.stars }}}
								<a class="num-ratings" href="{{ data.reviews_url }}">
									<?php
									/* translators: %s: Number of ratings. */
									printf( __( '(%s ratings)', 'jetpack-mu-wpcom' ), '{{ data.num_ratings }}' );
									?>
								</a>
							</div>
						<# } else { #>
							<span class="no-rating"><?php _e( 'This theme has not been rated yet.', 'jetpack-mu-wpcom' ); ?></span>
						<# } #>

						<div class="theme-version">
							<?php
							/* translators: %s: Theme version. */
							printf( __( 'Version: %s', 'jetpack-mu-wpcom' ), '{{ data.version }}' );
							?>
						</div>

						<# if ( ! data.compatible_wp || ! data.compatible_php ) { #>
							<div class="notice notice-error notice-alt notice-large"><p>
								<# if ( ! data.compatible_wp && ! data.compatible_php ) { #>
									<?php
									_e( 'This theme does not work with your versions of WordPress and PHP.', 'jetpack-mu-wpcom' );
									if ( current_user_can( 'update_core' ) && current_user_can( 'update_php' ) ) {
										printf(
											/* translators: 1: URL to WordPress Updates screen, 2: URL to Update PHP page. */
											' ' . __( '<a href="%1$s">Please update WordPress</a>, and then <a href="%2$s">learn more about updating PHP</a>.', 'jetpack-mu-wpcom' ),
											self_admin_url( 'update-core.php' ),
											esc_url( wp_get_update_php_url() )
										);
										wp_update_php_annotation( '</p><p><em>', '</em>' );
									} elseif ( current_user_can( 'update_core' ) ) {
										printf(
											/* translators: %s: URL to WordPress Updates screen. */
											' ' . __( '<a href="%s">Please update WordPress</a>.', 'jetpack-mu-wpcom' ),
											self_admin_url( 'update-core.php' )
										);
									} elseif ( current_user_can( 'update_php' ) ) {
										printf(
											/* translators: %s: URL to Update PHP page. */
											' ' . __( '<a href="%s">Learn more about updating PHP</a>.', 'jetpack-mu-wpcom' ),
											esc_url( wp_get_update_php_url() )
										);
										wp_update_php_annotation( '</p><p><em>', '</em>' );
									}
									?>
								<# } else if ( ! data.compatible_wp ) { #>
									<?php
									_e( 'This theme does not work with your version of WordPress.', 'jetpack-mu-wpcom' );
									if ( current_user_can( 'update_core' ) ) {
										printf(
											/* translators: %s: URL to WordPress Updates screen. */
											' ' . __( '<a href="%s">Please update WordPress</a>.', 'jetpack-mu-wpcom' ),
											self_admin_url( 'update-core.php' )
										);
									}
									?>
								<# } else if ( ! data.compatible_php ) { #>
									<?php
									_e( 'This theme does not work with your version of PHP.', 'jetpack-mu-wpcom' );
									if ( current_user_can( 'update_php' ) ) {
										printf(
											/* translators: %s: URL to Update PHP page. */
											' ' . __( '<a href="%s">Learn more about updating PHP</a>.', 'jetpack-mu-wpcom' ),
											esc_url( wp_get_update_php_url() )
										);
										wp_update_php_annotation( '</p><p><em>', '</em>' );
									}
									?>
								<# } #>
							</p></div>
						<# } #>

						<div class="theme-description">{{{ data.description }}}</div>
					</div>
				</div>
			</div>
			<div class="wp-full-overlay-footer">
				<button type="button" class="collapse-sidebar button" aria-expanded="true" aria-label="<?php esc_attr_e( 'Collapse Sidebar', 'jetpack-mu-wpcom' ); ?>">
					<span class="collapse-sidebar-arrow"></span>
					<span class="collapse-sidebar-label"><?php _e( 'Collapse', 'jetpack-mu-wpcom' ); ?></span>
				</button>
			</div>
		</div>
		<div class="wp-full-overlay-main">
		<iframe src="{{ data.preview_url }}" title="<?php esc_attr_e( 'Preview', 'jetpack-mu-wpcom' ); ?>"></iframe>
	</div>
	<?php
		// @patched Add filter for single theme view template.
		$content = ob_get_clean();
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo apply_filters( 'wpcom_themes_tmpl_theme_preview', $content );
	?>
</script>

<?php
wp_print_request_filesystem_credentials_modal();
wp_print_admin_notice_templates();

require_once ABSPATH . 'wp-admin/admin-footer.php';
