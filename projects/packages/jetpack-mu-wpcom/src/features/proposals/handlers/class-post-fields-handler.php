<?php
/**
 * Proposed changes to fields of existing published posts and pages.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Proposals;

use WP_Error;
use WP_Post;

/**
 * Title, content, excerpt, slug, featured image, categories, tags and allowlisted meta.
 *
 * The preview overlays proposed values while the page renders. No copy of the post is made.
 */
class Post_Fields_Handler implements Proposal_Handler {

	const TYPE = 'post_fields';

	const POST_TYPES = array( 'post', 'page' );

	/** Post fields a proposal can change. */
	const FIELDS = array( 'post_title', 'post_content', 'post_excerpt', 'post_name' );

	/** Request key => taxonomy. */
	const TAXONOMIES = array(
		'categories' => 'category',
		'tags'       => 'post_tag',
	);

	/** Meta key => value kind. */
	const META_ALLOWLIST = array(
		'advanced_seo_description' => 'text',
		'jetpack_seo_html_title'   => 'text',
		'jetpack_seo_noindex'      => 'bool',
		'_wp_page_template'        => 'template',
	);

	/** Most of a content diff an agent is sent. */
	const MAX_DIFF_BYTES = 4096;

	/**
	 * Previewed items keyed by post ID, sanitized again for rendering.
	 *
	 * @var array<int, array>
	 */
	private $previewed = array();

	/**
	 * {@inheritDoc}
	 *
	 * The request takes post_id plus any of: title, content, excerpt, slug, featured_media,
	 * categories, tags, meta.
	 *
	 * @param array $request The agent's request for this item.
	 */
	public function build( array $request ) {
		$post_id = isset( $request['post_id'] ) && is_numeric( $request['post_id'] ) ? (int) $request['post_id'] : 0;
		$post    = $post_id ? get_post( $post_id ) : null;

		if ( ! $post || ! in_array( $post->post_type, self::POST_TYPES, true ) ) {
			return new WP_Error( 'proposal_invalid_post', sprintf( 'Post %d is not a post or page on this site.', $post_id ) );
		}
		if ( 'publish' !== $post->post_status ) {
			return new WP_Error( 'proposal_invalid_post', sprintf( 'Post %d is not published. Edit drafts directly instead.', $post_id ) );
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return new WP_Error( 'proposal_forbidden', sprintf( 'You cannot edit post %d.', $post_id ) );
		}
		$unknown = array_diff( array_keys( $request ), array( 'post_id', 'title', 'content', 'excerpt', 'slug', 'featured_media', 'categories', 'tags', 'meta' ) );
		if ( $unknown ) {
			return new WP_Error( 'proposal_invalid_item', sprintf( 'Post changes cannot include %s.', implode( ', ', $unknown ) ) );
		}

		foreach ( array( 'title', 'content', 'excerpt', 'slug' ) as $key ) {
			if ( isset( $request[ $key ] ) && ! is_string( $request[ $key ] ) ) {
				return new WP_Error( 'proposal_invalid_item', sprintf( 'The %s for post %d must be a string.', $key, $post_id ) );
			}
		}
		if ( isset( $request['featured_media'] ) && ! self::is_id( $request['featured_media'] ) ) {
			return new WP_Error( 'proposal_invalid_media', sprintf( 'The featured_media for post %d must be an attachment ID, or 0 to remove the image.', $post_id ) );
		}
		foreach ( array_keys( self::TAXONOMIES ) as $input_key ) {
			if ( isset( $request[ $input_key ] ) && ( ! is_array( $request[ $input_key ] ) || array_filter( $request[ $input_key ], static fn( $id ) => ! self::is_id( $id ) ) ) ) {
				return new WP_Error( 'proposal_invalid_terms', sprintf( 'The %s for post %d must be a list of term IDs.', $input_key, $post_id ) );
			}
		}

		$change = array( 'fields' => array() );
		$item   = array(
			'target' => array(
				'post_id'   => (int) $post->ID,
				'post_type' => $post->post_type,
			),
			'base'   => array(
				'modified_gmt' => $post->post_modified_gmt,
				'content_hash' => md5( $post->post_content ),
			),
		);

		// Filtered even for users with unfiltered_html, so the preview, which filters too, shows everything apply writes.
		if ( isset( $request['title'] ) ) {
			$title = wp_kses( $request['title'], 'title_save_pre' );
			if ( $title !== $post->post_title ) {
				$change['fields']['post_title'] = array(
					'from' => $post->post_title,
					'to'   => $title,
				);
			}
		}

		if ( isset( $request['content'] ) ) {
			$submitted = $request['content'];
			$content   = wp_kses_post( $submitted );
			if ( $content !== $post->post_content ) {
				// Live content is in the post's own revisions, so only the new value is stored.
				$change['fields']['post_content'] = array( 'to' => $content );
			}
			if ( $submitted !== $content ) {
				/**
				 * Filters the warning returned to the agent when sanitizing changed its proposed content.
				 *
				 * @since $$next-version$$
				 *
				 * @param array|null $warning   Warning to return, or null for none.
				 * @param string     $submitted Content as the agent sent it.
				 * @param string     $sanitized Content as it will be stored.
				 */
				$item['warning'] = apply_filters( 'jetpack_proposals_content_warnings', null, $submitted, $content );
			}
		}

		if ( isset( $request['excerpt'] ) ) {
			$excerpt = wp_kses_post( $request['excerpt'] );
			if ( $excerpt !== $post->post_excerpt ) {
				$change['fields']['post_excerpt'] = array(
					'from' => $post->post_excerpt,
					'to'   => $excerpt,
				);
			}
		}

		if ( isset( $request['slug'] ) ) {
			$slug = sanitize_title( $request['slug'] );
			if ( '' === $slug ) {
				return new WP_Error( 'proposal_invalid_slug', sprintf( 'The slug for post %d is empty after sanitizing.', $post->ID ) );
			}
			if ( $slug !== $post->post_name ) {
				$change['fields']['post_name'] = array(
					'from' => $post->post_name,
					'to'   => $slug,
				);
			}
		}

		if ( isset( $request['featured_media'] ) ) {
			$media_id = (int) $request['featured_media'];
			if ( $media_id > 0 && ! wp_attachment_is_image( $media_id ) ) {
				return new WP_Error( 'proposal_invalid_media', sprintf( 'Attachment %d is not an image on this site.', $media_id ) );
			}
			$current = (int) get_post_thumbnail_id( $post );
			if ( $media_id !== $current ) {
				$change['featured_media'] = array(
					'from' => $current,
					'to'   => $media_id,
				);
			}
		}

		foreach ( self::TAXONOMIES as $input_key => $taxonomy ) {
			if ( ! isset( $request[ $input_key ] ) ) {
				continue;
			}
			if ( ! is_object_in_taxonomy( $post->post_type, $taxonomy ) ) {
				return new WP_Error( 'proposal_invalid_terms', sprintf( 'Post %d does not support %s.', $post->ID, $input_key ) );
			}
			$term_ids = self::normalize_ids( $request[ $input_key ] );
			foreach ( $term_ids as $term_id ) {
				if ( ! term_exists( $term_id, $taxonomy ) ) {
					return new WP_Error( 'proposal_invalid_terms', sprintf( 'Term %d is not in %s.', $term_id, $input_key ) );
				}
			}
			$current = self::get_term_ids( (int) $post->ID, $taxonomy );
			if ( $term_ids !== $current ) {
				$change['terms'][ $taxonomy ] = array(
					'from' => $current,
					'to'   => $term_ids,
				);
			}
		}

		foreach ( (array) ( $request['meta'] ?? array() ) as $key => $value ) {
			$key = (string) $key;
			if ( ! isset( self::META_ALLOWLIST[ $key ] ) ) {
				return new WP_Error( 'proposal_invalid_meta', sprintf( 'The %s field cannot be proposed. Allowed: %s.', $key, implode( ', ', array_keys( self::META_ALLOWLIST ) ) ) );
			}
			$sanitized = self::sanitize_meta_value( $key, $value, $post );
			if ( is_wp_error( $sanitized ) ) {
				return $sanitized;
			}
			$current = self::get_meta_value( (int) $post->ID, $key );
			if ( $sanitized !== $current ) {
				$change['meta'][ $key ] = array(
					'from' => $current,
					'to'   => $sanitized,
				);
			}
		}

		if ( ! $change['fields'] && ! isset( $change['featured_media'] ) && empty( $change['terms'] ) && empty( $change['meta'] ) ) {
			return new WP_Error( 'proposal_no_changes', sprintf( 'The requested values for post %d match the live post. Nothing to propose.', $post_id ) );
		}

		$item['change'] = $change;
		return $item;
	}

	/**
	 * Whether a request value is a non-negative integer ID, as an int or a string of digits.
	 *
	 * @param mixed $value Request value.
	 */
	private static function is_id( $value ): bool {
		return ( is_int( $value ) && $value >= 0 ) || ( is_string( $value ) && ctype_digit( $value ) );
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param array $item Stored item.
	 */
	public function is_valid( array $item ): bool {
		$target = $item['target'];
		$base   = $item['base'];
		$change = $item['change'];
		if (
			array( 'post_id', 'post_type' ) !== array_keys( $target ) || ! is_int( $target['post_id'] ) || $target['post_id'] < 1 || ! in_array( $target['post_type'], self::POST_TYPES, true )
			|| array( 'modified_gmt', 'content_hash' ) !== array_keys( $base ) || ! is_string( $base['modified_gmt'] ) || ! is_string( $base['content_hash'] )
			|| array_diff( array_keys( $change ), array( 'fields', 'featured_media', 'terms', 'meta' ) ) || ! is_array( $change['fields'] ?? null )
		) {
			return false;
		}

		foreach ( $change['fields'] as $field => $field_change ) {
			if ( ! in_array( $field, self::FIELDS, true ) || ! is_array( $field_change ) || array_diff( array_keys( $field_change ), array( 'from', 'to' ) ) || ! is_string( $field_change['to'] ?? null ) || ( isset( $field_change['from'] ) && ! is_string( $field_change['from'] ) ) ) {
				return false;
			}
		}
		if ( isset( $change['featured_media'] ) && ( ! is_int( $change['featured_media']['from'] ?? null ) || ! is_int( $change['featured_media']['to'] ?? null ) || $change['featured_media']['to'] < 0 ) ) {
			return false;
		}
		foreach ( (array) ( $change['terms'] ?? array() ) as $taxonomy => $term_change ) {
			if ( ! in_array( $taxonomy, self::TAXONOMIES, true ) || ! is_array( $term_change['from'] ?? null ) || ! is_array( $term_change['to'] ?? null ) || array_filter( $term_change['to'], static fn( $id ) => ! is_int( $id ) ) ) {
				return false;
			}
		}
		foreach ( (array) ( $change['meta'] ?? array() ) as $key => $meta_change ) {
			$kind = self::META_ALLOWLIST[ $key ] ?? null;
			if ( ! $kind || ! is_array( $meta_change ) || ! array_key_exists( 'from', $meta_change ) || ! array_key_exists( 'to', $meta_change ) || ( 'bool' === $kind ? ! is_bool( $meta_change['to'] ) : ! is_string( $meta_change['to'] ) ) ) {
				return false;
			}
			if ( 'bool' !== $kind && sanitize_text_field( $meta_change['to'] ) !== $meta_change['to'] ) {
				return false;
			}
		}
		return true;
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param array $item Stored item.
	 */
	public function targets( array $item ): array {
		return array( 'post:' . $item['target']['post_id'] );
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param array $item Stored item.
	 */
	public function can_review( array $item ): bool {
		return current_user_can( 'edit_post', (int) $item['target']['post_id'] );
	}

	/**
	 * {@inheritDoc}
	 *
	 * The modified date only has one-second resolution, so content is also compared by hash
	 * and every other field by its recorded "from" value.
	 *
	 * @param array $item Stored item.
	 */
	public function conflicts( array $item ): array {
		$post_id = (int) $item['target']['post_id'];
		// This request may have cached the post before another apply wrote it.
		clean_post_cache( $post_id );
		$post   = get_post( $post_id );
		$change = $item['change'];

		if ( ! $post || 'publish' !== $post->post_status || $item['target']['post_type'] !== $post->post_type ) {
			return array( self::conflict( $post_id, 'The post is no longer published.' ) );
		}
		$edited = $post->post_modified_gmt !== $item['base']['modified_gmt'] || md5( $post->post_content ) !== $item['base']['content_hash'];
		foreach ( $change['fields'] as $field => $field_change ) {
			$edited = $edited || ( array_key_exists( 'from', $field_change ) && $post->$field !== $field_change['from'] );
		}
		if ( $edited ) {
			return array( self::conflict( $post_id, 'The post was edited.' ) );
		}

		$conflicts = array();
		if ( isset( $change['featured_media'] ) && (int) get_post_thumbnail_id( $post ) !== (int) $change['featured_media']['from'] ) {
			$conflicts[] = self::conflict( $post_id, 'The featured image changed.' );
		}
		foreach ( $change['terms'] ?? array() as $taxonomy => $term_change ) {
			if ( self::get_term_ids( $post_id, $taxonomy ) !== $term_change['from'] ) {
				$conflicts[] = self::conflict( $post_id, sprintf( 'The %s changed.', $taxonomy ) );
			}
		}
		foreach ( $change['meta'] ?? array() as $key => $meta_change ) {
			if ( self::get_meta_value( $post_id, $key ) !== $meta_change['from'] ) {
				$conflicts[] = self::conflict( $post_id, sprintf( 'The %s setting changed.', $key ) );
			}
		}
		return $conflicts;
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param array $items Stored items of this type.
	 */
	public function start_preview( array $items ): void {
		foreach ( $items as $item ) {
			$this->previewed[ (int) $item['target']['post_id'] ] = self::sanitize_overlay( $item );
		}

		add_filter( 'posts_results', array( $this, 'filter_posts_results' ), 10, 1 );
		// Priority 1 replaces the raw value before core's formatting filters run.
		add_filter( 'the_title', array( $this, 'filter_the_title' ), 1, 2 );
		add_filter( 'single_post_title', array( $this, 'filter_single_post_title' ), 1, 2 );
		add_filter( 'get_the_excerpt', array( $this, 'filter_get_the_excerpt' ), 1, 2 );
		add_filter( 'get_post_metadata', array( $this, 'filter_post_metadata' ), 10, 4 );
		add_filter( 'get_the_terms', array( $this, 'filter_the_terms' ), 10, 3 );

		// Overlaid posts carry their live IDs, so anything that saves them would publish the proposal.
		add_filter( 'wp_insert_post_empty_content', array( $this, 'block_post_write' ), PHP_INT_MAX, 2 );
		foreach ( array( 'add', 'update', 'delete' ) as $operation ) {
			add_filter( "{$operation}_post_metadata", array( $this, 'block_meta_write' ), PHP_INT_MAX, 2 );
		}
	}

	/**
	 * Items this request is previewing, keyed by post ID.
	 *
	 * @return array<int, array>
	 */
	public function previewed_items(): array {
		return $this->previewed;
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param array $item Stored item.
	 */
	public function preview_target( array $item ): ?string {
		$url = get_permalink( (int) $item['target']['post_id'] );
		return $url ? $url : null;
	}

	/**
	 * {@inheritDoc}
	 *
	 * Featured image, term and meta writes are read back, since those functions report failure badly.
	 *
	 * @return array{post_id: int, changed: string[], slug?: string, error?: string}
	 *
	 * @param array $item Stored item.
	 */
	public function apply( array $item ): array {
		$post_id = (int) $item['target']['post_id'];
		$change  = $item['change'];
		$result  = array(
			'post_id' => $post_id,
			'changed' => array(),
		);

		$postarr = array( 'ID' => $post_id );
		foreach ( $change['fields'] as $field => $field_change ) {
			$postarr[ $field ] = $field_change['to'];
		}
		if ( count( $postarr ) > 1 ) {
			// wp_update_post() sanitizes again, as the person applying, and saves a revision.
			$updated = wp_update_post( wp_slash( $postarr ), true );
			if ( is_wp_error( $updated ) ) {
				$result['error'] = $updated->get_error_message();
				return $result;
			}
			$result['changed'] = array_keys( $change['fields'] );
			if ( isset( $change['fields']['post_name'] ) ) {
				$result['slug'] = get_post_field( 'post_name', $post_id );
			}
		}

		$failed = array();

		if ( isset( $change['featured_media'] ) ) {
			$to = (int) $change['featured_media']['to'];
			if ( $to > 0 ) {
				set_post_thumbnail( $post_id, $to );
			} else {
				delete_post_thumbnail( $post_id );
			}
			if ( (int) get_post_thumbnail_id( $post_id ) === $to ) {
				$result['changed'][] = 'featured_media';
			} else {
				$failed[] = 'featured_media';
			}
		}

		foreach ( $change['terms'] ?? array() as $taxonomy => $term_change ) {
			wp_set_post_terms( $post_id, $term_change['to'], $taxonomy );
			if ( self::get_term_ids( $post_id, $taxonomy ) === $term_change['to'] ) {
				$result['changed'][] = $taxonomy;
			} else {
				$failed[] = $taxonomy;
			}
		}

		foreach ( $change['meta'] ?? array() as $key => $meta_change ) {
			// The theme's templates may have changed since the proposal was made.
			if ( 'template' === self::META_ALLOWLIST[ $key ] && '' !== $meta_change['to'] && ! isset( wp_get_theme()->get_page_templates( get_post( $post_id ) )[ $meta_change['to'] ] ) ) {
				$failed[] = $key;
				continue;
			}
			if ( '' === $meta_change['to'] || false === $meta_change['to'] ) {
				delete_post_meta( $post_id, $key );
			} else {
				update_post_meta( $post_id, $key, wp_slash( $meta_change['to'] ) );
			}
			if ( self::get_meta_value( $post_id, $key ) === $meta_change['to'] ) {
				$result['changed'][] = $key;
			} else {
				$failed[] = $key;
			}
		}

		if ( $failed ) {
			$result['error'] = sprintf( 'Could not save %s.', implode( ', ', $failed ) );
		}
		return $result;
	}

	/**
	 * {@inheritDoc}
	 *
	 * Kinds: text and flag have from and to, list has names, image has attachments, diff has a unified diff.
	 *
	 * @param array  $item Stored item.
	 * @param string $status Proposal status.
	 */
	public function describe( array $item, string $status ): array {
		$post_id = (int) $item['target']['post_id'];
		$change  = $item['change'];
		$entries = array();

		$labels = array(
			'post_title'   => 'Title',
			'post_name'    => 'Slug',
			'post_excerpt' => 'Excerpt',
		);
		foreach ( $labels as $field => $label ) {
			if ( isset( $change['fields'][ $field ] ) ) {
				$entries[] = self::text_entry( $label, (string) $change['fields'][ $field ]['from'], (string) $change['fields'][ $field ]['to'] );
			}
		}

		if ( isset( $change['fields']['post_content'] ) ) {
			$live      = get_post( $post_id );
			$entries[] = 'pending' === $status && $live
				? array(
					'label' => 'Content',
					'kind'  => 'diff',
					'diff'  => self::content_diff( $live->post_content, (string) $change['fields']['post_content']['to'] ),
				)
				: array(
					'label' => 'Content',
					'kind'  => 'text',
					'to'    => 'The content was changed.',
				);
		}

		if ( isset( $change['featured_media'] ) ) {
			$entries[] = array(
				'label' => 'Featured image',
				'kind'  => 'image',
				'from'  => self::image( (int) $change['featured_media']['from'] ),
				'to'    => self::image( (int) $change['featured_media']['to'] ),
			);
		}

		foreach ( $change['terms'] ?? array() as $taxonomy => $term_change ) {
			$taxonomy_object = get_taxonomy( $taxonomy );
			$entries[]       = array(
				'label' => $taxonomy_object ? $taxonomy_object->labels->name : $taxonomy,
				'kind'  => 'list',
				'from'  => self::term_names( $term_change['from'], $taxonomy ),
				'to'    => self::term_names( $term_change['to'], $taxonomy ),
			);
		}

		$meta_labels = array(
			'advanced_seo_description' => 'SEO description',
			'jetpack_seo_html_title'   => 'SEO title',
			'jetpack_seo_noindex'      => 'Hide from search engines',
			'_wp_page_template'        => 'Template',
		);
		foreach ( $change['meta'] ?? array() as $key => $meta_change ) {
			if ( 'bool' === self::META_ALLOWLIST[ $key ] ) {
				$entries[] = array(
					'label' => $meta_labels[ $key ],
					'kind'  => 'flag',
					'from'  => (bool) $meta_change['from'],
					'to'    => (bool) $meta_change['to'],
				);
				continue;
			}
			$entries[] = self::text_entry( $meta_labels[ $key ], self::meta_text( $key, $meta_change['from'] ), self::meta_text( $key, $meta_change['to'] ) );
		}

		return $entries;
	}

	/**
	 * Swap in proposed values on query results. The object cache is shared across requests,
	 * so overlays must never be written to it.
	 *
	 * @param WP_Post[] $posts Query results.
	 * @return WP_Post[]
	 */
	public function filter_posts_results( array $posts ): array {
		foreach ( $posts as $index => $post ) {
			$item = $this->previewed[ (int) $post->ID ] ?? null;
			if ( ! $item || empty( $item['change']['fields'] ) ) {
				continue;
			}
			$overlay = clone $post;
			foreach ( array( 'post_title', 'post_content', 'post_excerpt' ) as $field ) {
				if ( isset( $item['change']['fields'][ $field ] ) ) {
					$overlay->$field = $item['change']['fields'][ $field ]['to'];
				}
			}
			$posts[ $index ] = $overlay;
		}
		return $posts;
	}

	/**
	 * Blocks such as core/post-title look posts up by ID, bypassing query results.
	 *
	 * @param string $title   Title.
	 * @param int    $post_id Post ID.
	 * @return string
	 */
	public function filter_the_title( $title, $post_id = 0 ) {
		return $this->previewed[ (int) $post_id ]['change']['fields']['post_title']['to'] ?? $title;
	}

	/**
	 * Overlay the title in the document title.
	 *
	 * @param string       $title Title.
	 * @param WP_Post|null $post  Post.
	 * @return string
	 */
	public function filter_single_post_title( $title, $post = null ) {
		return $post instanceof WP_Post ? $this->filter_the_title( $title, $post->ID ) : $title;
	}

	/**
	 * Overlay the excerpt.
	 *
	 * @param string       $excerpt Excerpt.
	 * @param WP_Post|null $post    Post.
	 * @return string
	 */
	public function filter_get_the_excerpt( $excerpt, $post = null ) {
		$post_id = $post instanceof WP_Post ? $post->ID : 0;
		return $this->previewed[ $post_id ]['change']['fields']['post_excerpt']['to'] ?? $excerpt;
	}

	/**
	 * Overlay the featured image and allowlisted meta. Text meta is returned as strings, as
	 * Jetpack's SEO output expects.
	 *
	 * @param mixed  $value     Short-circuit value.
	 * @param int    $object_id Post ID.
	 * @param string $meta_key  Meta key.
	 * @param bool   $single    Whether one value is wanted.
	 * @return mixed
	 */
	public function filter_post_metadata( $value, $object_id, $meta_key, $single ) {
		$change = $this->previewed[ (int) $object_id ]['change'] ?? null;
		if ( ! $change || '' === $meta_key ) {
			return $value;
		}

		if ( '_thumbnail_id' === $meta_key && isset( $change['featured_media'] ) ) {
			$proposed = (int) $change['featured_media']['to'];
		} elseif ( isset( $change['meta'][ $meta_key ] ) ) {
			$proposed = $change['meta'][ $meta_key ]['to'];
		} else {
			return $value;
		}

		$proposed = is_bool( $proposed ) ? ( $proposed ? '1' : '' ) : $proposed;
		return $single ? array( $proposed ) : ( '' === $proposed || 0 === $proposed ? array() : array( $proposed ) );
	}

	/**
	 * Overlay categories and tags.
	 *
	 * @param mixed  $terms    Terms.
	 * @param int    $post_id  Post ID.
	 * @param string $taxonomy Taxonomy.
	 * @return mixed
	 */
	public function filter_the_terms( $terms, $post_id, $taxonomy ) {
		$term_change = $this->previewed[ (int) $post_id ]['change']['terms'][ $taxonomy ] ?? null;
		if ( ! $term_change ) {
			return $terms;
		}
		if ( ! $term_change['to'] ) {
			return false;
		}
		$proposed = get_terms(
			array(
				'taxonomy'   => $taxonomy,
				'include'    => $term_change['to'],
				'hide_empty' => false,
			)
		);
		return is_wp_error( $proposed ) ? $terms : $proposed;
	}

	/**
	 * Refuse saves to a previewed post.
	 *
	 * @param bool  $maybe_empty Whether the post counts as empty.
	 * @param array $postarr     Post data.
	 * @return bool
	 */
	public function block_post_write( $maybe_empty, $postarr ) {
		return isset( $this->previewed[ (int) ( $postarr['ID'] ?? 0 ) ] ) ? true : $maybe_empty;
	}

	/**
	 * Refuse meta writes to a previewed post.
	 *
	 * @param mixed $check     Short-circuit value.
	 * @param int   $object_id Post ID.
	 * @return mixed
	 */
	public function block_meta_write( $check, $object_id ) {
		return isset( $this->previewed[ (int) $object_id ] ) ? false : $check;
	}

	/**
	 * The current value of an allowlisted meta key, in its sanitized shape, so "unset" and "empty" match.
	 *
	 * @param int    $post_id Post ID.
	 * @param string $key     Meta key.
	 * @return string|bool
	 */
	public static function get_meta_value( int $post_id, string $key ) {
		$value = get_post_meta( $post_id, $key, true );
		if ( 'bool' === self::META_ALLOWLIST[ $key ] ) {
			return (bool) $value;
		}
		$value = (string) $value;
		return '_wp_page_template' === $key && 'default' === $value ? '' : $value;
	}

	/**
	 * A post's term IDs, sorted.
	 *
	 * @param int    $post_id  Post ID.
	 * @param string $taxonomy Taxonomy.
	 * @return int[]
	 */
	public static function get_term_ids( int $post_id, string $taxonomy ): array {
		$ids = wp_get_post_terms( $post_id, $taxonomy, array( 'fields' => 'ids' ) );
		return is_wp_error( $ids ) ? array() : self::normalize_ids( $ids );
	}

	/**
	 * Sanitize the overlay again as it is read. A payload written outside this feature passed
	 * kses only as JSON, where an escaped tag such as <script> is not yet markup.
	 *
	 * @param array $item Stored item.
	 * @return array
	 */
	private static function sanitize_overlay( array $item ): array {
		foreach ( array( 'post_title', 'post_content', 'post_excerpt' ) as $field ) {
			if ( isset( $item['change']['fields'][ $field ]['to'] ) ) {
				$to = $item['change']['fields'][ $field ]['to'];

				$item['change']['fields'][ $field ]['to'] = 'post_title' === $field ? wp_kses( $to, 'title_save_pre' ) : wp_kses_post( $to );
			}
		}
		return $item;
	}

	/**
	 * Sanitize a requested meta value.
	 *
	 * @param string  $key   Meta key.
	 * @param mixed   $value Requested value.
	 * @param WP_Post $post  Post.
	 * @return string|bool|WP_Error
	 */
	private static function sanitize_meta_value( string $key, $value, WP_Post $post ) {
		switch ( self::META_ALLOWLIST[ $key ] ) {
			case 'bool':
				return (bool) rest_sanitize_boolean( $value );

			case 'template':
				$template = sanitize_text_field( (string) $value );
				if ( '' === $template || 'default' === $template ) {
					return '';
				}
				$templates = wp_get_theme()->get_page_templates( $post, $post->post_type );
				if ( ! isset( $templates[ $template ] ) ) {
					return new WP_Error(
						'proposal_invalid_template',
						sprintf( 'Template %s is not available for post %d. Available: default, %s.', $template, $post->ID, implode( ', ', array_keys( $templates ) ) )
					);
				}
				return $template;

			default:
				return sanitize_text_field( (string) $value );
		}
	}

	/**
	 * Unique positive IDs, sorted.
	 *
	 * @param array $ids IDs.
	 * @return int[]
	 */
	private static function normalize_ids( array $ids ): array {
		$ids = array_values( array_unique( array_filter( array_map( 'intval', $ids ), static fn( $id ) => $id > 0 ) ) );
		sort( $ids, SORT_NUMERIC );
		return $ids;
	}

	/**
	 * A conflict entry.
	 *
	 * @param int    $post_id Post ID.
	 * @param string $reason  Why.
	 * @return array{post_id: int, reason: string}
	 */
	private static function conflict( int $post_id, string $reason ): array {
		return array(
			'post_id' => $post_id,
			'reason'  => $reason,
		);
	}

	/**
	 * A text description entry.
	 *
	 * @param string $label Label.
	 * @param string $from  Live value.
	 * @param string $to    Proposed value.
	 * @return array
	 */
	private static function text_entry( string $label, string $from, string $to ): array {
		return array(
			'label' => $label,
			'kind'  => 'text',
			'from'  => $from,
			'to'    => $to,
		);
	}

	/**
	 * A line diff of block markup, cut to MAX_DIFF_BYTES.
	 *
	 * @param string $from Live content.
	 * @param string $to   Proposed content.
	 */
	private static function content_diff( string $from, string $to ): string {
		if ( ! class_exists( 'Text_Diff', false ) ) {
			require_once ABSPATH . WPINC . '/wp-diff.php';
		}
		$split = static fn( string $text ) => explode( "\n", str_replace( array( "\r\n", "\r" ), "\n", $text ) );
		$diff  = new \Text_Diff( 'auto', array( $split( $from ), $split( $to ) ) );

		$lines = array();
		foreach ( $diff->getDiff() as $edit ) {
			if ( $edit instanceof \Text_Diff_Op_copy ) {
				$context = count( $edit->orig ) > 4 ? array_merge( array_slice( $edit->orig, 0, 2 ), array( '…' ), array_slice( $edit->orig, -2 ) ) : $edit->orig;
				foreach ( $context as $line ) {
					$lines[] = '  ' . $line;
				}
				continue;
			}
			foreach ( (array) $edit->orig as $line ) {
				$lines[] = '- ' . $line;
			}
			foreach ( (array) $edit->final as $line ) {
				$lines[] = '+ ' . $line;
			}
		}

		$output = '';
		foreach ( $lines as $index => $line ) {
			if ( strlen( $output ) + strlen( $line ) + 1 > self::MAX_DIFF_BYTES ) {
				return $output . sprintf( '… %d more lines', count( $lines ) - $index );
			}
			$output .= $line . "\n";
		}
		return rtrim( $output, "\n" );
	}

	/**
	 * An attachment for a description.
	 *
	 * @param int $attachment_id Attachment ID, or 0 for none.
	 * @return array{id: int, title?: string, url?: string}
	 */
	private static function image( int $attachment_id ): array {
		if ( ! $attachment_id ) {
			return array( 'id' => 0 );
		}
		return array(
			'id'    => $attachment_id,
			'title' => get_post_field( 'post_title', $attachment_id, 'raw' ),
			'url'   => (string) wp_get_attachment_url( $attachment_id ),
		);
	}

	/**
	 * Term names for a description.
	 *
	 * @param int[]  $term_ids Term IDs.
	 * @param string $taxonomy Taxonomy.
	 * @return string[]
	 */
	private static function term_names( array $term_ids, string $taxonomy ): array {
		$names = array();
		foreach ( $term_ids as $term_id ) {
			$term    = get_term( (int) $term_id, $taxonomy );
			$names[] = $term && ! is_wp_error( $term ) ? $term->name : '#' . $term_id;
		}
		return $names;
	}

	/**
	 * A meta value as text.
	 *
	 * @param string $key   Meta key.
	 * @param mixed  $value Value.
	 */
	private static function meta_text( string $key, $value ): string {
		if ( '_wp_page_template' === $key && '' === $value ) {
			return 'Default template';
		}
		return (string) $value;
	}
}
