<?php
/**
 * Knowledge public API.
 *
 * @package automattic/jetpack-knowledge
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( 'wp_knowledge_types' ) ) {
	/**
	 * Returns the registered knowledge types keyed by slug.
	 *
	 * Plugins can register their own types via the `wp_knowledge_types` filter.
	 *
	 * @return array {
	 *     Slug-keyed map of knowledge types.
	 *
	 *     @type array ...$0 {
	 *         Data for a single knowledge type.
	 *
	 *         @type string $title The human-readable label for the type.
	 *     }
	 * }
	 * @phpstan-return array<string, array{title: string}>
	 */
	function wp_knowledge_types(): array {
		/**
		 * Filters the knowledge types available on this site.
		 *
		 * @param array $types {
		 *     Slug-keyed map of knowledge types.
		 *
		 *     @type array ...$0 {
		 *         Data for a single knowledge type.
		 *
		 *         @type string $title The human-readable label for the type.
		 *     }
		 * }
		 * @phpstan-param array<string, array{title: string}> $types
		 */
		return apply_filters(
			'wp_knowledge_types',
			array(
				'guideline' => array(
					'title' => _x( 'Guideline', 'knowledge type', 'jetpack-knowledge' ),
				),
				'memory'    => array(
					'title' => _x( 'Memory', 'knowledge type', 'jetpack-knowledge' ),
				),
				'note'      => array(
					'title' => _x( 'Note', 'knowledge type', 'jetpack-knowledge' ),
				),
			)
		);
	}
}

if ( ! function_exists( 'wp_guideline_scopes' ) ) {
	/**
	 * Returns the registered guideline scopes keyed by slug.
	 *
	 * @return array {
	 *     Slug-keyed map of guideline scopes.
	 *
	 *     @type array ...$0 {
	 *         Data for a single scope.
	 *
	 *         @type string $title       Human-readable section title.
	 *         @type string $description Human-readable section description.
	 *         @type int    $order       Sort order on the Settings page.
	 *     }
	 * }
	 * @phpstan-return array<string, array{title: string, description: string, order: int}>
	 */
	function wp_guideline_scopes(): array {
		/**
		 * Filters the guideline scopes available on this site.
		 *
		 * @param array $scopes Slug-keyed map of guideline scopes.
		 */
		return apply_filters(
			'wp_guideline_scopes',
			array(
				'site'       => array(
					'title'       => __( 'Site', 'jetpack-knowledge' ),
					'description' => __( "Describe your site's purpose, goals, and primary audience.", 'jetpack-knowledge' ),
					'order'       => 10,
				),
				'copy'       => array(
					'title'       => __( 'Copy', 'jetpack-knowledge' ),
					'description' => __( 'Set your writing standards for tone, voice, style, and formatting.', 'jetpack-knowledge' ),
					'order'       => 20,
				),
				'images'     => array(
					'title'       => __( 'Images', 'jetpack-knowledge' ),
					'description' => __( 'Outline your style, dimensions, formats, mood and aesthetic preferences.', 'jetpack-knowledge' ),
					'order'       => 30,
				),
				'blocks'     => array(
					'title'       => __( 'Blocks', 'jetpack-knowledge' ),
					'description' => __( 'Create tailored guidelines for specific block types.', 'jetpack-knowledge' ),
					'order'       => 40,
				),
				'additional' => array(
					'title'       => __( 'Additional', 'jetpack-knowledge' ),
					'description' => __( 'Add additional guidelines.', 'jetpack-knowledge' ),
					'order'       => 50,
				),
			)
		);
	}
}

if ( ! function_exists( 'wp_guideline_max_length' ) ) {
	/**
	 * Returns the maximum length, in characters, of a guideline row's content.
	 *
	 * @return int Maximum number of characters allowed in guideline content.
	 */
	function wp_guideline_max_length(): int {
		/**
		 * Filters the maximum length, in characters, of a guideline row's content.
		 *
		 * @param int $max_length Maximum number of characters. Default 5000.
		 */
		return (int) apply_filters( 'wp_guideline_max_length', 5000 );
	}
}

if ( ! function_exists( 'wp_knowledge_get_or_create_type_term' ) ) {
	/**
	 * Resolve a `wp_knowledge_type` term by slug, creating it lazily.
	 *
	 * @access private
	 *
	 * @param string $slug Term slug.
	 * @return int|null Term ID, or null on failure.
	 */
	function wp_knowledge_get_or_create_type_term( string $slug ): ?int {
		$term = term_exists( $slug, 'wp_knowledge_type' );
		if ( $term ) {
			return (int) $term['term_id'];
		}

		$switched = switch_to_locale( get_locale() );
		$term     = wp_insert_term( $slug, 'wp_knowledge_type' );
		if ( $switched ) {
			restore_previous_locale();
		}

		if ( is_wp_error( $term ) ) {
			// Another request may have created the term after our existence check.
			$term_id = (int) $term->get_error_data( 'term_exists' );
			return 'term_exists' === $term->get_error_code() && $term_id > 0 ? $term_id : null;
		}

		return (int) $term['term_id'];
	}
}

if ( ! function_exists( 'wp_knowledge_ensure_default_type_term' ) ) {
	/**
	 * Hook callback for the `save_post_wp_knowledge` action that assigns the knowledge type term.
	 *
	 * @access private
	 *
	 * @param int $post_id Saved post ID.
	 */
	function wp_knowledge_ensure_default_type_term( int $post_id ): void {
		if ( wp_is_post_revision( $post_id ) ) {
			return;
		}

		$post = get_post( $post_id );
		if ( ! $post instanceof WP_Post ) {
			return;
		}

		if ( str_starts_with( $post->post_name, 'guideline-' ) ) {
			$term_id = wp_knowledge_get_or_create_type_term( 'guideline' );
			if ( null !== $term_id ) {
				wp_set_object_terms( $post_id, $term_id, 'wp_knowledge_type' );
			}
			return;
		}

		$terms = get_the_terms( $post_id, 'wp_knowledge_type' );
		if ( is_wp_error( $terms ) || ! empty( $terms ) ) {
			return;
		}

		$term_id = wp_knowledge_get_or_create_type_term( 'note' );
		if ( null !== $term_id ) {
			wp_set_object_terms( $post_id, $term_id, 'wp_knowledge_type' );
		}
	}
}

if ( ! function_exists( 'wp_maybe_grant_knowledge_caps' ) ) {
	/**
	 * Filters the user capabilities to grant the `wp_knowledge` post type capabilities as necessary.
	 *
	 * @param bool[]   $allcaps An array of all the user's capabilities.
	 * @param string[] $caps    Required primitive capabilities for the requested capability.
	 * @param array    $args    Arguments that accompany the requested capability check.
	 * @param WP_User  $user    The user object.
	 * @return bool[] Filtered array of the user's capabilities.
	 */
	function wp_maybe_grant_knowledge_caps( $allcaps, $caps, $args, $user ) {
		if ( ! empty( $allcaps['manage_options'] ) ) {
			$allcaps['read_knowledge_items']             = true;
			$allcaps['edit_knowledge_items']             = true;
			$allcaps['edit_others_knowledge_items']      = true;
			$allcaps['edit_published_knowledge_items']   = true;
			$allcaps['edit_private_knowledge_items']     = true;
			$allcaps['publish_knowledge_items']          = true;
			$allcaps['delete_knowledge_items']           = true;
			$allcaps['delete_others_knowledge_items']    = true;
			$allcaps['delete_published_knowledge_items'] = true;
			$allcaps['delete_private_knowledge_items']   = true;
			$allcaps['read_private_knowledge_items']     = true;
			return $allcaps;
		}

		if ( empty( $allcaps['edit_posts'] ) ) {
			return $allcaps;
		}

		// Ambient floor for Contributor+: `read_knowledge_items` clears the
		// post-type read check; `edit_knowledge_items` clears the create and
		// ownership checks that don't pass a post ID. Per-post primitives
		// are granted only in the per-post branch below.
		$allcaps['read_knowledge_items'] = true;
		$allcaps['edit_knowledge_items'] = true;

		if ( ( ! isset( $args[0] ) || ! isset( $args[2] ) ) ) {
			return $allcaps;
		}

		if ( ! in_array( $args[0], array( 'edit_post', 'delete_post', 'read_post' ), true ) ) {
			return $allcaps;
		}

		$post = get_post( $args[2] );
		if (
			! $post instanceof WP_Post ||
			'wp_knowledge' !== $post->post_type ||
			(int) $post->post_author !== (int) $user->ID
		) {
			return $allcaps;
		}

		/*
		 * A trashed row keeps its pre-trash status in `_wp_trash_meta_status`.
		 */
		$status = $post->post_status;
		if ( 'trash' === $status ) {
			$status = get_post_meta( $post->ID, '_wp_trash_meta_status', true );
		}

		if ( 'private' !== $status ) {
			return $allcaps;
		}

		$allcaps['edit_private_knowledge_items']   = true;
		$allcaps['delete_knowledge_items']         = true;
		$allcaps['delete_private_knowledge_items'] = true;
		$allcaps['read_private_knowledge_items']   = true;

		return $allcaps;
	}
}

if ( ! function_exists( 'wp_knowledge_maybe_map_term_label' ) ) {
	/**
	 * Hook callback for the `wp_insert_term_data` filter that swaps a raw knowledge-type slug for its
	 * human-readable label when WordPress is about to lazily create the term.
	 *
	 * @access private
	 *
	 * @param array  $data     Term data to be inserted (keyed by column name).
	 * @param string $taxonomy Taxonomy slug.
	 * @return array Possibly modified term data.
	 */
	function wp_knowledge_maybe_map_term_label( array $data, string $taxonomy ): array {
		if ( 'wp_knowledge_type' !== $taxonomy ) {
			return $data;
		}

		if ( $data['name'] !== $data['slug'] ) {
			return $data;
		}

		$types = wp_knowledge_types();
		if ( isset( $types[ $data['slug'] ] ) ) {
			$data['name'] = $types[ $data['slug'] ]['title'];
		}

		return $data;
	}
}

if ( ! function_exists( 'wp_guideline_scope_from_slug' ) ) {
	/**
	 * Resolve the scope that owns a guideline row slug.
	 *
	 * @access private
	 *
	 * @param string $slug Post slug.
	 * @return string|null Scope key, or null if the slug is not a registered scope.
	 */
	function wp_guideline_scope_from_slug( string $slug ): ?string {
		if ( ! str_starts_with( $slug, 'guideline-' ) ) {
			return null;
		}

		$scopes = wp_guideline_scopes();
		$scope  = substr( $slug, strlen( 'guideline-' ) );

		// A slug that matches a registered scope key is that scope. Checking this
		// first lets a scope keyed like `block-foo` win over the per-block
		// namespace below, instead of being swallowed by the blocks scope.
		if ( isset( $scopes[ $scope ] ) ) {
			return $scope;
		}

		// Otherwise a `guideline-block-<name>` row is a per-block row that belongs
		// to the blocks scope while it is registered. A real block name never
		// equals a registered scope key, so the check above stays safe.
		if ( str_starts_with( $slug, 'guideline-block-' ) && strlen( $slug ) > strlen( 'guideline-block-' ) ) {
			return isset( $scopes['blocks'] ) ? 'blocks' : null;
		}

		return null;
	}
}

if ( ! function_exists( 'wp_knowledge_guard_guideline_row' ) ) {
	/**
	 * Hook callback for `rest_pre_insert_wp_knowledge` that sanitizes and normalizes guideline rows on the
	 * REST insert path.
	 *
	 * @access private
	 *
	 * @param stdClass        $prepared_post Prepared post object.
	 * @param WP_REST_Request $request       Request object.
	 * @return stdClass Prepared post.
	 */
	function wp_knowledge_guard_guideline_row( $prepared_post, $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$slug = '';
		if ( ! empty( $prepared_post->post_name ) ) {
			$slug = $prepared_post->post_name;
		} elseif ( ! empty( $prepared_post->ID ) ) {
			$existing = get_post( $prepared_post->ID );
			if ( $existing instanceof WP_Post ) {
				$slug = $existing->post_name;
			}
		}

		// Only shape rows whose slug maps to a registered guideline scope.
		$scope = wp_guideline_scope_from_slug( (string) $slug );
		if ( null === $scope ) {
			return $prepared_post;
		}

		// Sanitize content: plain text, capped at the guideline length.
		if ( isset( $prepared_post->post_content ) ) {
			$content = sanitize_textarea_field( $prepared_post->post_content );
			$max     = wp_guideline_max_length();
			if ( mb_strlen( $content, 'UTF-8' ) > $max ) {
				$content = mb_substr( $content, 0, $max, 'UTF-8' );
			}
			$prepared_post->post_content = $content;
		}

		// Re-stamp single-row registry scope titles in the site locale. The
		// blocks scope is multi-row, so its per-block rows keep the
		// client-provided canonical block name.
		if ( 'blocks' !== $scope ) {
			$switched = switch_to_locale( get_locale() );
			$scopes   = wp_guideline_scopes();
			if ( $switched ) {
				restore_previous_locale();
			}
			if ( isset( $scopes[ $scope ]['title'] ) ) {
				$prepared_post->post_title = $scopes[ $scope ]['title'];
			}
		}

		return $prepared_post;
	}
}
