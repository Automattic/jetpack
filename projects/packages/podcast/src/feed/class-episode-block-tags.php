<?php
/**
 * Emits iTunes + Podcasting 2.0 item-level tags sourced from the
 * `jetpack/podcast-episode` block's attrs.
 *
 * @package automattic/jetpack-podcast
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Podcast\Feed;

use WP_Post;

/**
 * Block-attr → XML translation for a single episode. Kept separate from
 * `Customize_Feed` (which only wires rss2_* hooks) so the mapping logic stays
 * focused and independently testable.
 */
class Episode_Block_Tags {

	/**
	 * Emit item-level tags for a post if it contains a podcast-episode block.
	 * Posts without the block contribute nothing — legacy audio items keep
	 * their pre-block behavior intact.
	 *
	 * @param WP_Post $post Episode post.
	 */
	public static function render( WP_Post $post ): void {
		$attrs = self::get_block_attrs( $post );
		if ( empty( $attrs ) ) {
			return;
		}
		self::render_from_attrs( $attrs );
	}

	/**
	 * Testable seam — emit tags for a literal attrs array, skipping the block
	 * parse. Each emit is independent and no-ops on missing/blank values.
	 *
	 * @param array<string, mixed> $attrs Block attrs.
	 */
	public static function render_from_attrs( array $attrs ): void {
		self::emit_episode_number( $attrs );
		self::emit_season_number( $attrs );
		self::emit_episode_type( $attrs );
		self::emit_explicit_override( $attrs );
		self::emit_transcript( $attrs );
		self::emit_chapters( $attrs );
		self::emit_location( $attrs );
		self::emit_license( $attrs );
		self::emit_people( $attrs );
		self::emit_soundbites( $attrs );
		self::emit_alternate_enclosures( $attrs );
	}

	/**
	 * `<podcast:chapters url="…" type="…" />` from the block's `chaptersUrl`
	 * / `chaptersType` attrs. Skip if no URL is set.
	 *
	 * @param array $attrs Block attrs.
	 */
	private static function emit_chapters( array $attrs ): void {
		$url = isset( $attrs['chaptersUrl'] ) ? trim( (string) $attrs['chaptersUrl'] ) : '';
		if ( '' === $url ) {
			return;
		}
		$type = isset( $attrs['chaptersType'] ) ? (string) $attrs['chaptersType'] : 'application/json+chapters';
		echo '<podcast:chapters url="' . esc_url( $url ) . '" type="' . esc_attr( $type ) . '" />' . "\n";
	}

	/**
	 * Extract attrs from the first `jetpack/podcast-episode` block in the
	 * post's content. Returns an empty array if no such block exists.
	 *
	 * First-wins: a post containing multiple `jetpack/podcast-episode` blocks
	 * is semantically odd (one item = one episode) so we don't try to merge.
	 *
	 * @param WP_Post $post Episode post.
	 * @return array<string, mixed>
	 */
	public static function get_block_attrs( WP_Post $post ): array {
		// Skip the parse_blocks() regex pass entirely if our specific block
		// marker isn't even in the content — tighter than has_blocks(), which
		// only checks for `<!-- wp:`.
		if ( false === strpos( $post->post_content, '<!-- wp:jetpack/podcast-episode' ) ) {
			return array();
		}
		foreach ( parse_blocks( $post->post_content ) as $block ) {
			if ( isset( $block['blockName'] ) && 'jetpack/podcast-episode' === $block['blockName'] ) {
				return isset( $block['attrs'] ) && is_array( $block['attrs'] ) ? $block['attrs'] : array();
			}
		}
		return array();
	}

	/**
	 * `<itunes:episode>` + `<podcast:episode>` for positive integer values.
	 *
	 * @param array $attrs Block attrs.
	 */
	private static function emit_episode_number( array $attrs ): void {
		$value = $attrs['episodeNumber'] ?? 0;
		if ( (int) $value <= 0 ) {
			return;
		}
		echo '<itunes:episode>' . (int) $value . "</itunes:episode>\n";
		echo '<podcast:episode>' . (int) $value . "</podcast:episode>\n";
	}

	/**
	 * `<itunes:season>` + `<podcast:season>` for positive integer values.
	 *
	 * @param array $attrs Block attrs.
	 */
	private static function emit_season_number( array $attrs ): void {
		$value = $attrs['seasonNumber'] ?? 0;
		if ( (int) $value <= 0 ) {
			return;
		}
		echo '<itunes:season>' . (int) $value . "</itunes:season>\n";
		echo '<podcast:season>' . (int) $value . "</podcast:season>\n";
	}

	/**
	 * `<itunes:episodeType>` for `trailer` / `bonus`. `full` is Apple's
	 * default and emitting it for every item would be noise.
	 *
	 * @param array $attrs Block attrs.
	 */
	private static function emit_episode_type( array $attrs ): void {
		$value = isset( $attrs['episodeType'] ) ? (string) $attrs['episodeType'] : '';
		if ( ! in_array( $value, array( 'trailer', 'bonus' ), true ) ) {
			return;
		}
		echo '<itunes:episodeType>' . esc_xml( $value ) . "</itunes:episodeType>\n";
	}

	/**
	 * `<itunes:explicit>` only when the per-episode value differs from the
	 * channel default — emitting a matching value on every item is noisy
	 * and redundant per Apple's spec.
	 *
	 * @param array $attrs Block attrs.
	 */
	private static function emit_explicit_override( array $attrs ): void {
		if ( ! array_key_exists( 'explicit', $attrs ) ) {
			return;
		}
		$item_value    = (bool) $attrs['explicit'] ? 'true' : 'false';
		$channel_value = Customize_Feed::explicit_string();
		if ( $item_value === $channel_value ) {
			return;
		}
		echo '<itunes:explicit>' . esc_html( $item_value ) . "</itunes:explicit>\n";
	}

	/**
	 * `<podcast:transcript url="…" type="…" />`. Type is validated against
	 * the enum from `block.json` so a hand-edited attr can't smuggle in an
	 * arbitrary MIME type.
	 *
	 * @param array $attrs Block attrs.
	 */
	private static function emit_transcript( array $attrs ): void {
		$url = isset( $attrs['transcriptUrl'] ) ? (string) $attrs['transcriptUrl'] : '';
		if ( '' === trim( $url ) ) {
			return;
		}
		$type          = isset( $attrs['transcriptType'] ) ? (string) $attrs['transcriptType'] : 'text/vtt';
		$allowed_types = array( 'text/vtt', 'text/html', 'application/srt', 'application/json' );
		if ( ! in_array( $type, $allowed_types, true ) ) {
			$type = 'text/vtt';
		}
		echo '<podcast:transcript url="' . esc_url( $url ) . '" type="' . esc_attr( $type ) . "\" />\n";
	}

	/**
	 * `<podcast:location name="…" />`. Geo coordinates aren't captured by
	 * the block yet, so we emit name-only for v1.
	 *
	 * @param array $attrs Block attrs.
	 */
	private static function emit_location( array $attrs ): void {
		$name = isset( $attrs['locationName'] ) ? trim( (string) $attrs['locationName'] ) : '';
		if ( '' === $name ) {
			return;
		}
		echo '<podcast:location>' . esc_xml( $name ) . "</podcast:location>\n";
	}

	/**
	 * `<podcast:license>` — name as text content, optional `url` attribute.
	 * If only the URL is set we still need a name for valid markup, so skip.
	 *
	 * @param array $attrs Block attrs.
	 */
	private static function emit_license( array $attrs ): void {
		$name = isset( $attrs['license'] ) ? trim( (string) $attrs['license'] ) : '';
		$url  = isset( $attrs['licenseUrl'] ) ? trim( (string) $attrs['licenseUrl'] ) : '';
		if ( '' === $name ) {
			return;
		}
		if ( '' === $url ) {
			echo '<podcast:license>' . esc_xml( $name ) . "</podcast:license>\n";
			return;
		}
		echo '<podcast:license url="' . esc_url( $url ) . '">' . esc_xml( $name ) . "</podcast:license>\n";
	}

	/**
	 * One `<podcast:person>` per entry. Lenient on role/group — the spec
	 * defines a taxonomy but most validators only warn on unknown values;
	 * passing them through keeps editor freedom and matches the v1 plan.
	 *
	 * @param array $attrs Block attrs.
	 */
	private static function emit_people( array $attrs ): void {
		if ( empty( $attrs['people'] ) || ! is_array( $attrs['people'] ) ) {
			return;
		}
		foreach ( $attrs['people'] as $person ) {
			if ( ! is_array( $person ) ) {
				continue;
			}
			$name = isset( $person['name'] ) ? trim( (string) $person['name'] ) : '';
			if ( '' === $name ) {
				continue;
			}
			$tag = '<podcast:person';
			if ( ! empty( $person['role'] ) ) {
				$tag .= ' role="' . esc_attr( (string) $person['role'] ) . '"';
			}
			if ( ! empty( $person['group'] ) ) {
				$tag .= ' group="' . esc_attr( (string) $person['group'] ) . '"';
			}
			if ( ! empty( $person['href'] ) ) {
				$tag .= ' href="' . esc_url( (string) $person['href'] ) . '"';
			}
			if ( ! empty( $person['img'] ) ) {
				$tag .= ' img="' . esc_url( (string) $person['img'] ) . '"';
			}
			$tag .= '>' . esc_xml( $name ) . "</podcast:person>\n";
			echo $tag; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Pre-escaped XML fragment.
		}
	}

	/**
	 * One `<podcast:soundbite>` per entry. Order is preserved — the P2.0
	 * spec doesn't mandate sorting and editors might intend a specific
	 * sequence.
	 *
	 * @param array $attrs Block attrs.
	 */
	private static function emit_soundbites( array $attrs ): void {
		if ( empty( $attrs['soundbites'] ) || ! is_array( $attrs['soundbites'] ) ) {
			return;
		}
		foreach ( $attrs['soundbites'] as $soundbite ) {
			if ( ! is_array( $soundbite )
				|| ! isset( $soundbite['startTime'] )
				|| ! isset( $soundbite['duration'] )
			) {
				continue;
			}
			$start    = (float) $soundbite['startTime'];
			$duration = (float) $soundbite['duration'];
			if ( $duration <= 0 ) {
				continue;
			}
			$title = isset( $soundbite['title'] ) ? trim( (string) $soundbite['title'] ) : '';
			$tag   = '<podcast:soundbite startTime="' . esc_attr( (string) $start )
				. '" duration="' . esc_attr( (string) $duration ) . '"';
			if ( '' === $title ) {
				$tag .= " />\n";
			} else {
				$tag .= '>' . esc_xml( $title ) . "</podcast:soundbite>\n";
			}
			echo $tag; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Pre-escaped XML fragment.
		}
	}

	/**
	 * One `<podcast:alternateEnclosure>` per entry, wrapping nested
	 * `<podcast:source>` children. The block currently stores each entry as a
	 * single URL with type/bitrate metadata, but the spec models a list of
	 * sources — accept both shapes so a future block change doesn't need a
	 * second pass here.
	 *
	 * @param array $attrs Block attrs.
	 */
	private static function emit_alternate_enclosures( array $attrs ): void {
		if ( empty( $attrs['alternateEnclosures'] ) || ! is_array( $attrs['alternateEnclosures'] ) ) {
			return;
		}
		foreach ( $attrs['alternateEnclosures'] as $alt ) {
			if ( ! is_array( $alt ) ) {
				continue;
			}

			// `type` is required per spec; skip the entry rather than emit invalid markup.
			$type = isset( $alt['type'] ) ? trim( (string) $alt['type'] ) : '';
			if ( '' === $type ) {
				continue;
			}

			$sources = array();
			if ( ! empty( $alt['sources'] ) && is_array( $alt['sources'] ) ) {
				foreach ( $alt['sources'] as $src ) {
					if ( is_array( $src ) && ! empty( $src['uri'] ) ) {
						$sources[] = (string) $src['uri'];
					} elseif ( is_string( $src ) && '' !== $src ) {
						$sources[] = $src;
					}
				}
			} elseif ( ! empty( $alt['url'] ) ) {
				$sources[] = (string) $alt['url'];
			}
			if ( empty( $sources ) ) {
				continue;
			}

			$opener = '<podcast:alternateEnclosure type="' . esc_attr( $type ) . '"';
			if ( ! empty( $alt['length'] ) ) {
				$opener .= ' length="' . (int) $alt['length'] . '"';
			}
			if ( ! empty( $alt['bitrate'] ) ) {
				$opener .= ' bitrate="' . (int) $alt['bitrate'] . '"';
			}
			$opener .= ">\n";
			echo $opener; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Pre-escaped XML fragment.

			foreach ( $sources as $uri ) {
				echo "\t<podcast:source uri=\"" . esc_url( $uri ) . "\" />\n";
			}

			echo "</podcast:alternateEnclosure>\n";
		}
	}
}
