<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Jetpack modules list table.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Assets;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

if ( ! class_exists( 'WP_List_Table' ) ) {
	require_once ABSPATH . 'wp-admin/includes/class-wp-list-table.php';
}

/**
 * Jetpack modules list table.
 */
class Jetpack_Modules_List_Table extends WP_List_Table {

	/**
	 * Order in which product groups are displayed on the page.
	 *
	 * @var string[]
	 */
	const PRODUCT_GROUP_ORDER = array( 'growth', 'performance', 'security', 'other' );

	/**
	 * Map of module slug to product group.
	 *
	 * Modeled on the Offline Mode dashboard grouping so the modules page reads
	 * as a set of focused product areas. Any module not listed falls back to
	 * the "other" group.
	 *
	 * @return array<string, string> Module slug => product group slug.
	 */
	public static function get_module_product_groups_map() {
		return array(
			// Grow your audience.
			'blaze'                 => 'growth',
			'comment-likes'         => 'growth',
			'comments'              => 'growth',
			'contact-form'          => 'growth',
			'gravatar-hovercards'   => 'growth',
			'likes'                 => 'growth',
			'publicize'             => 'growth',
			'related-posts'         => 'growth',
			'sharedaddy'            => 'growth',
			'simple-payments'       => 'growth',
			'stats'                 => 'growth',
			'subscriptions'         => 'growth',
			'woocommerce-analytics' => 'growth',
			'wordads'               => 'growth',
			'wpcom-reader'          => 'growth',

			// Speed up your site.
			'carousel'              => 'performance',
			'google-fonts'          => 'performance',
			'infinite-scroll'       => 'performance',
			'photon'                => 'performance',
			'photon-cdn'            => 'performance',
			'search'                => 'performance',
			'tiled-gallery'         => 'performance',
			'videopress'            => 'performance',

			// Protect your site.
			'account-protection'    => 'security',
			'monitor'               => 'security',
			'notes'                 => 'security',
			'protect'               => 'security',
			'sso'                   => 'security',
			'vaultpress'            => 'security',
			'waf'                   => 'security',
		);
	}

	/**
	 * Get the product group slug for a given module.
	 *
	 * @param string $slug Module slug.
	 * @return string Product group slug.
	 */
	public static function get_module_product_group( $slug ) {
		$map = self::get_module_product_groups_map();

		return $map[ $slug ] ?? 'other';
	}

	/**
	 * Get the translated display name for a product group.
	 *
	 * @param string $group Product group slug.
	 * @return string Translated group name.
	 */
	public static function get_product_group_name( $group ) {
		switch ( $group ) {
			case 'growth':
				return __( 'Grow your audience', 'jetpack' );
			case 'performance':
				return __( 'Speed up your site', 'jetpack' );
			case 'security':
				return __( 'Protect your site', 'jetpack' );
			default:
				return __( 'Other features', 'jetpack' );
		}
	}

	/**
	 * Whether a module is flagged as recommended.
	 *
	 * @param array $module Module data (with raw, untranslated module tags).
	 * @return bool
	 */
	public static function is_module_recommended( $module ) {
		return ! empty( $module['module_tags'] ) && in_array( 'Recommended', (array) $module['module_tags'], true );
	}

	/**
	 * Remove the legacy `vaultpress` module from the modules screen.
	 *
	 * The `vaultpress` module is a leftover stub for the original standalone
	 * VaultPress plugin. It is hard-coded as never activatable (see
	 * Jetpack_Admin::is_module_available()) and is unrelated to the modern
	 * VaultPress Backup product, which is delivered through My Jetpack and the
	 * standalone Jetpack VaultPress Backup plugin rather than a Jetpack module.
	 * Showing a permanently-unavailable row that merely reuses the modern
	 * product's name is misleading, so we drop it from this screen only. Other
	 * surfaces (REST, the React dashboard, standalone plugins) are unaffected.
	 *
	 * @param array $modules Array of Jetpack modules keyed by slug.
	 * @return array Modules without the legacy `vaultpress` entry.
	 */
	public static function hide_legacy_vaultpress_module( $modules ) {
		unset( $modules['vaultpress'] );
		return $modules;
	}

	/** Constructor. */
	public function __construct() {
		parent::__construct();

		Jetpack::init();

		// Scope this to the modules screen so REST/React/standalone surfaces keep the legacy slug.
		add_filter( 'jetpack_modules_list_table_items', array( __CLASS__, 'hide_legacy_vaultpress_module' ) );

		if ( $this->compat_fields && is_array( $this->compat_fields ) ) {
			array_push( $this->compat_fields, 'all_items' );
		}

		/**
		 * Filters the list of modules available to be displayed in the Jetpack Settings screen.
		 *
		 * @since 3.0.0
		 *
		 * @param array $modules Array of Jetpack modules.
		 */
		$this->all_items       = apply_filters( 'jetpack_modules_list_table_items', Jetpack_Admin::init()->get_modules() );
		$this->items           = $this->all_items;
		$this->items           = $this->filter_displayed_table_items( $this->items );
		$this->_column_headers = array( $this->get_columns(), array(), array(), 'name' );
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Nonce: This is a view, not a model or controller. InputNotSanitized: Sanitized below via `$this->module_info_check()`.
		$modal_info = isset( $_GET['info'] ) ? wp_unslash( $_GET['info'] ) : false;

		// Adding in a hidden h1 heading for screen-readers.
		?>
		<h1 class="screen-reader-text"><?php esc_html_e( 'Jetpack Modules List', 'jetpack' ); ?></h1>
		<?php

		wp_register_script(
			'models.jetpack-modules',
			Assets::get_file_url_for_environment(
				'_inc/build/jetpack-modules.models.min.js',
				'_inc/jetpack-modules.models.js'
			),
			array( 'jquery', 'backbone' ),
			JETPACK__VERSION,
			false // @todo Can this be put in the footer?
		);
		wp_register_script(
			'views.jetpack-modules',
			Assets::get_file_url_for_environment(
				'_inc/build/jetpack-modules.views.min.js',
				'_inc/jetpack-modules.views.js'
			),
			array( 'jquery', 'backbone', 'wp-util' ),
			JETPACK__VERSION,
			false // @todo Can this be put in the footer?
		);
		wp_register_script(
			'jetpack-modules-list-table',
			Assets::get_file_url_for_environment(
				'_inc/build/jetpack-modules.min.js',
				'_inc/jetpack-modules.js'
			),
			array(
				'views.jetpack-modules',
				'models.jetpack-modules',
				'jquery',
			),
			JETPACK__VERSION,
			true
		);

		$modules_for_js = (array) Jetpack::get_translated_modules( $this->all_items );
		foreach ( array_keys( $modules_for_js ) as $slug ) {
			$group = self::get_module_product_group( $slug );

			$modules_for_js[ $slug ]['product_group']      = $group;
			$modules_for_js[ $slug ]['product_group_name'] = self::get_product_group_name( $group );
			// Detect recommendation from the raw (untranslated) module tags.
			$modules_for_js[ $slug ]['recommended'] = isset( $this->all_items[ $slug ] ) && self::is_module_recommended( $this->all_items[ $slug ] );
		}

		wp_localize_script(
			'jetpack-modules-list-table',
			'jetpackModulesData',
			array(
				'modules'   => $modules_for_js,
				'i18n'      => array(
					'search_placeholder' => __( 'Search modules…', 'jetpack' ),
				),
				'modalinfo' => $this->module_info_check( $modal_info, $this->all_items ),
				'nonces'    => array(
					'bulk' => wp_create_nonce( 'bulk-jetpack_page_jetpack_modules' ),
				),
			)
		);

		wp_enqueue_script( 'jetpack-modules-list-table' );

		/**
		 * Filters the js_templates callback value.
		 *
		 * @since 3.6.0
		 *
		 * @param array array( $this, 'js_templates' ) js_templates callback.
		 */
		add_action( 'admin_footer', apply_filters( 'jetpack_modules_list_table_js_template_callback', array( $this, 'js_templates' ) ), 9 );
	}

	/**
	 * Output row template.
	 */
	public function js_templates() {
		?>
		<script type="text/html" id="tmpl-Jetpack_Modules_List_Table_Template">
			<# var i = 0; var currentGroup = null;
			if ( data.items.length ) {
			_.each( data.items, function( item, key, list ) {
				if ( item === undefined ) return;
				if ( item.product_group !== currentGroup ) {
					currentGroup = item.product_group; #>
					<tr class="jetpack-module-group-header" data-group="{{ item.product_group }}">
						<td colspan="2"><h2 class="jetpack-module-group-header__title">{{ item.product_group_name }}</h2></td>
					</tr>
				<# } #>
				<tr class="jetpack-module<# if ( ++i % 2 ) { #> alternate<# } #><# if ( item.activated ) { #> active<# } #><# if ( ! item.available ) { #> unavailable<# } #>" id="{{{ item.module }}}">
					<th scope="row" class="check-column">
						<# if ( item.available ) { #><input type="checkbox" name="modules[]" value="{{{ item.module }}}" {{{ item.disabled }}} /><# } #>
					</th>
					<td class="name column-name">
						<div class="jetpack-module__body">
							<div class="jetpack-module__info">
								<# if ( item.learn_more_button ) { #><a class="jetpack-module__name" href="{{{ item.learn_more_button }}}" target="_blank" rel="noopener noreferrer">{{ item.name }}</a><# } else { #><span class="jetpack-module__name">{{ item.name }}</span><# } #>
								<# if ( item.description ) { #><span class="jetpack-module__description">{{ item.description }}</span><# } #>
							</div>
							<div class="jetpack-module__meta">
								<span class="jetpack-module__badges">
									<# if ( item.recommended && item.available ) { #><span class="jetpack-module__badge is-recommended"><?php esc_html_e( 'Recommended', 'jetpack' ); ?></span><# } #>
									<# if ( item.available ) { #>
										<# if ( item.activated ) { #><span class="jetpack-module__badge is-active"><?php esc_html_e( 'Active', 'jetpack' ); ?></span><# } else { #><span class="jetpack-module__badge is-inactive"><?php esc_html_e( 'Inactive', 'jetpack' ); ?></span><# } #>
									<# } #>
								</span>
								<div class="row-actions">
									<# if ( item.configurable ) { #>
										<span class="configure">{{{ item.configurable }}}</span>
									<# } #>
									<# if ( item.available ) { #>
										<# if ( item.activated ) { #>
											<a class="jetpack-module__toggle is-active" role="switch" aria-checked="true" href="<?php echo esc_url( admin_url( 'admin.php' ) ); ?>?page=jetpack&#038;action=deactivate&#038;module={{{ item.module }}}&#038;_wpnonce={{{ item.deactivate_nonce }}}"><span class="jetpack-module__toggle-track"><span class="jetpack-module__toggle-thumb"></span></span><span class="screen-reader-text"><?php esc_html_e( 'Deactivate', 'jetpack' ); ?></span></a>
										<# } else { #>
											<a class="jetpack-module__toggle" role="switch" aria-checked="false" href="<?php echo esc_url( admin_url( 'admin.php' ) ); ?>?page=jetpack&#038;action=activate&#038;module={{{ item.module }}}&#038;_wpnonce={{{ item.activate_nonce }}}"><span class="jetpack-module__toggle-track"><span class="jetpack-module__toggle-thumb"></span></span><span class="screen-reader-text"><?php esc_html_e( 'Activate', 'jetpack' ); ?></span></a>
										<# } #>
									<# } else { #>
										<span class="jetpack-module__unavailable">{{ item.unavailable_reason }}</span>
									<# } #>
								</div>
							</div>
						</div>
					</td>
				</tr>
				<#
			});
			} else {
				#>
				<tr class="no-modules-found">
					<td colspan="2"><?php esc_html_e( 'No Modules Found', 'jetpack' ); ?></td>
				</tr>
				<#
			}
			#>
		</script>
		<?php
	}

	/**
	 * Get views data.
	 *
	 * @return array Maps identifier to display HTML.
	 */
	public function get_views() {
		/** This filter is already documented in class.jetpack-modules-list-table.php */
		$modules              = apply_filters( 'jetpack_modules_list_table_items', Jetpack_Admin::init()->get_modules() );
		$array_of_module_tags = wp_list_pluck( $modules, 'module_tags' );
		$module_tags          = array_merge( ...array_values( $array_of_module_tags ) );
		$module_tags          = array_map( 'jetpack_get_module_i18n_tag', $module_tags );
		$module_tags_unique   = array_count_values( $module_tags );
		ksort( $module_tags_unique );

		$format = '<a href="%3$s" %4$s data-title="%1$s">%1$s</a> <span class="count">(%2$s)</span>';
		$title  = __( 'All', 'jetpack' );
		$count  = is_countable( $modules ) ? count( $modules ) : 0;
		$url    = esc_url( remove_query_arg( 'module_tag' ) );
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This is a view, not a model or controller.
		$views = array(
			'all' => sprintf( $format, $title, $count, $url, 'class="all"' ),
		);
		foreach ( $module_tags_unique as $title => $count ) {
			$key           = sanitize_title( $title );
			$display_title = esc_html( wptexturize( $title ) );
			$url           = esc_url( add_query_arg( 'module_tag', rawurlencode( $title ) ) );
			$views[ $key ] = sprintf( $format, $display_title, $count, $url, '' );
		}
		return $views;
	}

	/**
	 * Output views HTML.
	 */
	public function views() {
		$views = $this->get_views();

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This is a view, not a model or controller.
		$module_tag = empty( $_GET['module_tag'] ) ? 'all' : sanitize_title( wp_unslash( $_GET['module_tag'] ) );

		echo "<ul class='subsubsub'>\n";
		foreach ( $views as $class => $view ) {
			$class_name = $class;
			if ( $class === $module_tag ) {
				$class_name .= ' current';
			}

			$views[ $class ] = "\t<li class='$class_name'>$view</li>";
		}
		echo implode( "\n", $views ) . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Is HTML. Escaping happens in get_views().
		echo '</ul>';
	}

	/**
	 * Filter a modules array for displayed items.
	 *
	 * @param array $modules Modules.
	 * @return array Displayed modules.
	 */
	public function filter_displayed_table_items( $modules ) {
		return array_filter( $modules, array( $this, 'is_module_displayed' ) );
	}

	/**
	 * Determine if a module is displayed.
	 *
	 * @param array $module Module data.
	 * @return bool
	 */
	public static function is_module_displayed( $module ) {
		// Handle module tag based filtering.
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This is a view, not a model or controller.
		if ( ! empty( $_REQUEST['module_tag'] ) ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This is a view, not a model or controller.
			$module_tag = sanitize_text_field( wp_unslash( $_REQUEST['module_tag'] ) );
			if ( ! in_array( $module_tag, array_map( 'jetpack_get_module_i18n_tag', $module['module_tags'] ), true ) ) {
				return false;
			}
		}

		// If nothing rejected it, include it!
		return true;
	}

	/**
	 * Sort callback to put modules with `requires_connection` last.
	 *
	 * @param array $module1 Module data.
	 * @param array $module2 Module data.
	 * @return int Indicating the relative ordering of module1 and module2.
	 */
	public static function sort_requires_connection_last( $module1, $module2 ) {
		if ( (bool) $module1['requires_connection'] === (bool) $module2['requires_connection'] ) {
			return 0;
		}
		if ( $module1['requires_connection'] ) {
			return 1;
		}
		if ( $module2['requires_connection'] ) {
			return -1;
		}

		return 0;
	}

	/**
	 * Get table columns.
	 *
	 * @return string[] Column name to header HTML.
	 */
	public function get_columns() {
		$columns = array(
			'cb'   => '<input type="checkbox" />',
			'name' => __( 'Name', 'jetpack' ),
		);
		return $columns;
	}

	/**
	 * Get bulk actions for the table.
	 *
	 * @return string[] Actions, code => text.
	 */
	public function get_bulk_actions() {
		$actions = array(
			'bulk-activate'   => __( 'Activate', 'jetpack' ),
			'bulk-deactivate' => __( 'Deactivate', 'jetpack' ),
		);
		return $actions;
	}

	/**
	 * Print the module rows grouped by product group.
	 *
	 * Overrides WP_List_Table::display_rows() so the server-rendered (no-JS)
	 * output matches the grouped, card-style layout produced by the Backbone
	 * template.
	 */
	public function display_rows() {
		$buckets = array();
		foreach ( self::PRODUCT_GROUP_ORDER as $group ) {
			$buckets[ $group ] = array();
		}

		foreach ( $this->items as $item ) {
			$group               = self::get_module_product_group( $item['module'] );
			$buckets[ $group ][] = $item;
		}

		foreach ( $buckets as $group => $items ) {
			if ( empty( $items ) ) {
				continue;
			}
			$this->group_header_row( $group );
			foreach ( $items as $item ) {
				$this->single_row( $item );
			}
		}
	}

	/**
	 * Print a product group header row.
	 *
	 * @param string $group Product group slug.
	 */
	protected function group_header_row( $group ) {
		printf(
			'<tr class="jetpack-module-group-header" data-group="%1$s"><td colspan="2"><h2 class="jetpack-module-group-header__title">%2$s</h2></td></tr>',
			esc_attr( $group ),
			esc_html( self::get_product_group_name( $group ) )
		);
	}

	/**
	 * Print a single row of the table.
	 *
	 * @param object|array $item Item.
	 */
	public function single_row( $item ) {
		static $i  = 0;
		$row_class = ( ( ++$i ) % 2 ) ? ' alternate' : '';

		$available = Jetpack_Admin::is_module_available( $item );

		if ( ! empty( $item['activated'] ) ) {
			$row_class .= ' active';
		}
		if ( ! $available ) {
			$row_class .= ' unavailable';
		}

		echo '<tr class="jetpack-module' . esc_attr( $row_class ) . '" id="' . esc_attr( $item['module'] ) . '">';

		echo '<th scope="row" class="check-column">';
		if ( $available ) {
			printf( '<input type="checkbox" name="modules[]" value="%s" />', esc_attr( $item['module'] ) );
		}
		echo '</th>';

		echo '<td class="name column-name">';
		echo '<div class="jetpack-module__body">';

		echo '<div class="jetpack-module__info">';
		if ( ! empty( $item['learn_more_button'] ) ) {
			printf(
				'<a class="jetpack-module__name" href="%1$s" target="_blank" rel="noopener noreferrer">%2$s</a>',
				esc_url( $item['learn_more_button'] ),
				wp_kses_post( wptexturize( $item['name'] ) )
			);
		} else {
			echo '<span class="jetpack-module__name">' . wp_kses_post( wptexturize( $item['name'] ) ) . '</span>';
		}
		if ( ! empty( $item['description'] ) ) {
			echo '<span class="jetpack-module__description">' . esc_html( wp_strip_all_tags( $item['description'] ) ) . '</span>';
		}
		echo '</div>';

		echo '<div class="jetpack-module__meta">';
		echo '<span class="jetpack-module__badges">';
		if ( $available && self::is_module_recommended( $item ) ) {
			echo '<span class="jetpack-module__badge is-recommended">' . esc_html__( 'Recommended', 'jetpack' ) . '</span>';
		}
		if ( $available ) {
			if ( ! empty( $item['activated'] ) ) {
				echo '<span class="jetpack-module__badge is-active">' . esc_html__( 'Active', 'jetpack' ) . '</span>';
			} else {
				echo '<span class="jetpack-module__badge is-inactive">' . esc_html__( 'Inactive', 'jetpack' ) . '</span>';
			}
		}
		echo '</span>';

		echo '<div class="row-actions">';
		if ( ! empty( $item['configurable'] ) ) {
			echo '<span class="configure">' . wp_kses_post( $item['configurable'] ) . '</span>';
		}
		if ( $available ) {
			echo $this->get_module_toggle_html( $item ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped in helper.
		} elseif ( ! empty( $item['unavailable_reason'] ) ) {
			echo '<span class="jetpack-module__unavailable">' . wp_kses_post( $item['unavailable_reason'] ) . '</span>';
		}
		// Close .row-actions, .jetpack-module__meta, and .jetpack-module__body.
		echo '</div></div></div>';
		echo '</td>';
		echo '</tr>';
	}

	/**
	 * Build the activate/deactivate toggle control markup for a module row.
	 *
	 * @param object|array $item Module data.
	 * @return string HTML.
	 */
	protected function get_module_toggle_html( $item ) {
		$is_active = ! empty( $item['activated'] );

		if ( $is_active ) {
			$url   = wp_nonce_url(
				Jetpack::admin_url(
					array(
						'page'   => 'jetpack',
						'action' => 'deactivate',
						'module' => $item['module'],
					)
				),
				'jetpack_deactivate-' . $item['module']
			);
			$label = sprintf(
				/* translators: %s: Jetpack module name. */
				__( 'Deactivate %s', 'jetpack' ),
				$item['name']
			);
			$class = 'jetpack-module__toggle is-active';
			$aria  = 'true';
		} else {
			$url   = wp_nonce_url(
				Jetpack::admin_url(
					array(
						'page'   => 'jetpack',
						'action' => 'activate',
						'module' => $item['module'],
					)
				),
				'jetpack_activate-' . $item['module']
			);
			$label = sprintf(
				/* translators: %s: Jetpack module name. */
				__( 'Activate %s', 'jetpack' ),
				$item['name']
			);
			$class = 'jetpack-module__toggle';
			$aria  = 'false';
		}

		return sprintf(
			'<a class="%1$s" role="switch" aria-checked="%2$s" href="%3$s"><span class="jetpack-module__toggle-track"><span class="jetpack-module__toggle-thumb"></span></span><span class="screen-reader-text">%4$s</span></a>',
			esc_attr( $class ),
			esc_attr( $aria ),
			esc_url( $url ),
			esc_html( $label )
		);
	}

	/**
	 * Table classes.
	 *
	 * @return string[] HTML.
	 */
	public function get_table_classes() {
		return array( 'table', 'table-bordered', 'wp-list-table', 'widefat', 'fixed' );
	}

	/**
	 * Check if the info parameter provided in the URL corresponds to an actual module.
	 *
	 * @param string|false $info Info parameter.
	 * @param array        $modules Modules array.
	 * @return string|false
	 */
	public function module_info_check( $info, $modules ) {
		if ( ! $info ) {
			return false;
		} elseif ( array_key_exists( $info, $modules ) ) {
			return $info;
		}
	}

	/**
	 * Core switched their `display_tablenav()` method to protected, so we can't access it directly.
	 * Instead, let's include an access function to make it doable without errors!
	 *
	 * @see https://github.com/WordPress/WordPress/commit/d28f6344de97616de8ece543ed290c4ba2383622
	 *
	 * @param string $which Which nav table to display.
	 * @return mixed
	 */
	public function unprotected_display_tablenav( $which = 'top' ) {
		return $this->display_tablenav( $which );
	}
}
