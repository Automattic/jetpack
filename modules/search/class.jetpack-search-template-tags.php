<?php

class Jetpack_Search_Template_Tags {
	public static function is_not_post_type_filter( $filter ) {
		return 'post_type' !== $filter['type'];
	}

	/**
	 * Renders all available filters that can be used to filter down search results on the frontend.
	 *
	 * @param array $filters  The available filters for the current query.
	 * @param array $post_types An array of post types to make filterable
	 *
	 * @return void
	 */
	public static function render_available_filters( $filters, $post_types = null ) {
		if ( is_null( $post_types ) ) {
			$post_types = get_post_types( array( 'exclude_from_search' => false ) );
		}

		/**
		 * If the post types specified by the widget differ from the default set of searchable post types,
		 * then we need to track their state.
		 */
		$active_post_types = array();
		if ( Jetpack_Search_Helpers::post_types_differ_searchable( $post_types ) ) {
			// get the active filter buckets from the query
			$active_buckets = Jetpack_Search::instance()->get_active_filter_buckets();
			$post_types_differ_query = Jetpack_Search_Helpers::post_types_differ_query( $post_types );

			// remove any post_type filters from display if the current query
			// already specifies to match all post types
			if ( ! $post_types_differ_query ) {
				$active_buckets = array_filter( $active_buckets, array( 'Jetpack_Search_Helpers', 'is_not_post_type_filter' ) );
			}

			$active_post_types = Jetpack_Search_Helpers::get_active_post_types( $active_buckets, $post_types );
			if ( empty( $active_post_types ) ) {
				$active_post_types = $post_types;
			}

			if ( $post_types_differ_query ) {
				$filters = Jetpack_Search_Helpers::ensure_post_types_on_remove_url( $filters, $post_types );
			} else {
				$filters = Jetpack_Search_Helpers::remove_active_from_post_type_buckets( $filters );
			}
		} else {
			$post_types = array();
		}

		foreach ( (array) $filters as $filter ) {
			if ( 'post_type' == $filter['type'] ) {
				self::render_filter( $filter, $post_types );
			} else {
				self::render_filter( $filter, $active_post_types );
			}
		}
	}

	public static function render_widget_title( $title, $before_title, $after_title ) {
		echo $before_title . esc_html( $title ) . $after_title;
	}

	/**
	 * Responsible for rendering the search box within our widget on the frontend.
	 *
	 * @param array $instance
	 */
	public static function render_widget_search_form( $instance, $orderby, $order ) {
		$form = get_search_form( false );

		$fields_to_inject = array(
			'orderby' => $orderby,
			'order' => $order
		);

		// If the widget has specified post types to search within and IF the post types differ
		// from the default post types that would have been searched, set the selected post
		// types via hidden inputs.
		if ( Jetpack_Search_Helpers::post_types_differ_searchable( $instance['post_types'] ) ) {
			$fields_to_inject['post_type'] = implode( ',', $instance['post_types'] );
		}

		$form = self::inject_hidden_form_fields( $form, $fields_to_inject );

		// This shouldn't need to be escaped since we escaped above when we imploded the selected post types
		echo '<div class="jetpack-search-form">';
		echo $form;
		echo '</div>';
	}

	private static function inject_hidden_form_fields( $form, $fields ) {
		$form_injection = '';

		foreach( $fields as $field_name => $field_value ) {
			$form_injection .= sprintf(
				'<input type="hidden" name="%s" value="%s" />',
				$field_name,
				esc_attr( $field_value )
			);
		}

		// This shouldn't need to be escaped since we've escaped above as we built $form_injection
		$form = str_replace(
			'</form>',
			sprintf(
				'%s</form>',
				$form_injection
			),
			$form
		);

		return $form;
	}

	/**
	 * Renders a single filter that can be applied to the current search.
	 *
	 * @param array $filter The filter to render.
	 * @param array $default_post_types The default post types for this filter.
	 */
	public static function render_filter( $filter, $default_post_types ) {
		if ( empty( $filter ) || empty( $filter['buckets'] ) ) {
			return;
		}

		$query_vars = null;
		foreach( $filter['buckets'] as $item ) {
			if ( $item['active'] ) {
				$query_vars = array_keys( $item['query_vars'] );
				break;
			}
		}
		$clear_url = null;
		if ( ! empty( $query_vars ) ) {
			$clear_url = Jetpack_Search_Helpers::remove_query_arg( $query_vars );
			if ( ! empty( $default_post_types ) ) {
				$clear_url = Jetpack_Search_Helpers::add_post_types_to_url( $clear_url, $default_post_types );
			}
		}

		?>
		<h4 class="jetpack-search-filters-widget__sub-heading">
			<?php echo esc_html( $filter['name'] ); ?>
		</h4>
		<?php if ( $clear_url ) : ?>
			<div class="jetpack-search-filters-widget__clear">
				<a href="<?php echo esc_url( $clear_url ); ?>">
					<?php esc_html_e( '< Clear Filters', 'jetpack' ); ?>
				</a>
			</div>
		<?php endif; ?>
		<ul class="jetpack-search-filters-widget__filter-list">
			<?php foreach ( $filter['buckets'] as $item ) : ?>
				<li>
					<label>
					<?php if ( empty( $item['active'] ) ) : ?>
						<a href="<?php echo esc_url( $item['url'] ); ?>">
					<?php else : ?>
						<a href="<?php echo esc_url( $item['remove_url'] ); ?>">
					<?php endif; ?>
							<input
								type="checkbox"
								<?php checked( ! empty( $item['active'] ) ); ?>
								disabled
							/>&nbsp;
							<?php echo esc_html( $item['name'] ); ?>&nbsp;
							<?php
								echo esc_html( sprintf(
									'(%s)',
									number_format_i18n( absint( $item['count'] ) )
								) );
							?>
						</a>
					</label>
				</li>
			<?php endforeach; ?>
		</ul>
	<?php
	}
}