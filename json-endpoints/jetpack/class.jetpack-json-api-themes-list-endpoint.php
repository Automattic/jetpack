<?php

class Jetpack_JSON_API_Themes_List_Endpoint extends Jetpack_JSON_API_Themes_Endpoint {
	// GET /sites/%s/themes

	protected $needed_capabilities = 'switch_themes';

	public function validate_input( $theme ) {
		$this->themes = wp_get_themes( array( 'allowed' => true ) );

		// Shamelessly lifted from WP_Themes_List_Table::prepare_items()
		// in wp-admin/includes/class-wp-themes-list-table.php
		$args = $this->query_args();

		if ( ! empty( $args['search'] ) )
			$this->search_terms = array_unique( array_filter( array_map( 'trim', explode( ',', strtolower( wp_unslash( $args['search'] ) ) ) ) ) );
		if ( ! empty( $args['features'] ) )
			$this->features = $args['features'];
		if ( $this->search_terms || $this->features ) {
			foreach ( $this->themes as $key => $theme ) {
				if ( ! $this->search_theme( $theme ) )
					unset( $this->themes[ $key ] );
			}
		}

		return true;
	}

	// Shamelessly lifted from WP_Themes_List_Table::search_theme()
	// in wp-admin/includes/class-wp-themes-list-table.php
	/**
	 * @param WP_Theme $theme
	 * @return bool
	 */
	public function search_theme( $theme ) {
		// Search the features
		foreach ( $this->features as $word ) {
			if ( ! in_array( $word, $theme->get('Tags') ) )
				return false;
		}
		// Match all phrases
		foreach ( $this->search_terms as $word ) {
			if ( in_array( $word, $theme->get('Tags') ) )
				continue;
			foreach ( array( 'Name', 'Description', 'Author', 'AuthorURI' ) as $header ) {
				// Don't mark up; Do translate.
				if ( false !== stripos( strip_tags( $theme->display( $header, false, true ) ), $word ) ) {
					continue 2;
				}
			}
			if ( false !== stripos( $theme->get_stylesheet(), $word ) )
				continue;
			if ( false !== stripos( $theme->get_template(), $word ) )
				continue;
			return false;
		}
		return true;
	}

}
