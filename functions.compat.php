<?php

/**
* Required for class.media-extractor.php to match expected function naming convention.
*
* @param $url Can be just the $url or the whole $atts array
* @return bool|mixed The Youtube video ID via jetpack_get_youtube_id
*/

function jetpack_shortcode_get_youtube_id( $url ) {
    return jetpack_get_youtube_id( $url );
}

/**
* @param $url Can be just the $url or the whole $atts array
* @return bool|mixed The Youtube video ID
*/
function jetpack_get_youtube_id( $url ) {
	// Do we have an $atts array?  Get first att
	if ( is_array( $url ) )
		$url = $url[0];

	$url = youtube_sanitize_url( $url );
	$url = parse_url( $url );
	$id  = false;

	if ( ! isset( $url['query'] ) )
		return false;

	parse_str( $url['query'], $qargs );

	if ( ! isset( $qargs['v'] ) && ! isset( $qargs['list'] ) )
		return false;

	if ( isset( $qargs['list'] ) )
		$id = preg_replace( '|[^_a-z0-9-]|i', '', $qargs['list'] );

	if ( empty( $id ) )
		$id = preg_replace( '|[^_a-z0-9-]|i', '', $qargs['v'] );

	return $id;
}

if ( !function_exists( 'youtube_sanitize_url' ) ) :
/**
* Normalizes a YouTube URL to include a v= parameter and a query string free of encoded ampersands.
*
* @param string $url
* @return string The normalized URL
*/
function youtube_sanitize_url( $url ) {
	$url = trim( $url, ' "' );
	$url = trim( $url );
	$url = str_replace( array( 'youtu.be/', '/v/', '#!v=', '&amp;', '&#038;', 'playlist' ), array( 'youtu.be/?v=', '/?v=', '?v=', '&', '&', 'videoseries' ), $url );

	// Replace any extra question marks with ampersands - the result of a URL like "http://www.youtube.com/v/9FhMMmqzbD8?fs=1&hl=en_US" being passed in.
	$query_string_start = strpos( $url, "?" );

	if ( false !== $query_string_start ) {
		$url = substr( $url, 0, $query_string_start + 1 ) . str_replace( "?", "&", substr( $url, $query_string_start + 1 ) );
	}

	return $url;
}
endif;

/**
 * Back-compat [audio] shortcode.
 *
 * Will convert old styles like this:
 * [audio http://wpcom.files.wordpress.com/2007/01/mattmullenweg-interview.mp3|width=180|titles=1|artists=2]
 *
 * Will also convert multiple [audio] files separated by commas into a playlist.
 *
 * @since 3.4
 *
 */

function jetpack_compat_audio_shortcode( $attr, $content = '' ) {
	if ( ! function_exists( 'wp_audio_shortcode' ) ) {
		return;
	}

	if ( ! isset( $attr[0] ) ) {
		return wp_audio_shortcode( $attr, $content );
	}

	$attr = implode( ' ', $attr );
	$attr = ltrim( $attr, '=' );
	$attr = trim( $attr, ' "' );

	$data = explode( '|', $attr );
	$src = explode( ',', $data[0] );

	// Single audio file.
	if ( count( $src ) === 1 ) {
		$src = reset( $src );
		$src = strip_tags( $src ); // Previously users were able to use [audio <a href="URL">URL</a>] and other nonsense tags
		$src = esc_url_raw( $src );

		if ( is_ssl() ) {
			$src = preg_replace( '#^http://([^.]+).files.wordpress.com/#', 'https://$1.files.wordpress.com/', $src );
		}

		$loop = '';
		$autoplay = '';

		// Support some legacy options.
		foreach ( $data as $pair ) {
			$pair = explode( '=', $pair );
			$key = strtolower( $pair[0] );
			$value = ! empty( $pair[1] ) ? $pair[1] : '';

			if ( $key == 'autostart' && $value == 'yes' ) {
				$autoplay = 'on';
			} elseif ( $key == 'loop' && $value == 'yes' ) {
				$loop = 'on';
			}
		}

		return wp_audio_shortcode( array(
			'src' => $src,
			'loop' => $loop,
			'autoplay' => $autoplay,
		), $content );


		// Multiple audio files; let's build a playlist.
	} else {
		$artists  = array();
		$playlist = array();
		$songs    = array_filter( array_map( 'esc_url_raw', $src ) );

		foreach ( $data as $shortcode_part ) {
			if ( 0 === strpos( $shortcode_part, 'artists=' ) ) {
				$artists = explode( ',', substr( $shortcode_part, 8 ) );
				break;
			}
		}

		// Song URL/artist pairs.
		for ( $i = 0, $i_count = count( $songs ); $i < $i_count; $i++ ) {
			$filename = explode( '/', untrailingslashit( $songs[ $i ] ) );
			$filename = array_pop( $filename );

			$artist_name = '';
			if ( ! empty( $artists[ $i ] ) ) {
				$artist_name = $artists[ $i ];
			}

			$playlist[ $songs[ $i ] ] = array( $filename, $artist_name );
		}

		if ( is_feed() ) {
			$output = "\n";
			foreach ( $playlist as $song_url => $artist ) {
				$output .= sprintf( '<a href="%s">%s</a> ' . "\n", esc_url( $song_url ), esc_html( $artist[0] ) );
			}

			return $output;
		}

		// Data for playlist JS.
		$playlist_data = array(
			'artists'      => true,
			'images'       => false,
			'tracklist'    => true,
			'tracknumbers' => true,
			'tracks'       => array(),
			'type'         => 'audio',
		);

		$tracks = array();
		foreach ( $playlist as $song_url => $artist ) {
			$tracks[] = array(
				'caption'     => '',
				'description' => '',
				'meta'        => array( 'artist' => $artist[1] ),
				'src'         => esc_url_raw( $song_url ),
				'title'       => $artist[0],
			);
		}
		$playlist_data['tracks'] = $tracks;


		ob_start();

		?>

		<div class="wp-playlist wp-audio-playlist wp-playlist-light">
			<div class="wp-playlist-current-item"></div>
			<audio controls="controls" preload="metadata"></audio>
			<div class="wp-playlist-next"></div>
			<div class="wp-playlist-prev"></div>
			<noscript>
				<ol><?php
					foreach ( $playlist as $song_url => $artist ) {
						printf( '<li><a href="%s">%s</a></li>', esc_url( $song_url ), esc_html( $artist[0] ) );
					}
					?></ol>
			</noscript>
			<script type="application/json" class="wp-playlist-script"><?php echo json_encode( $playlist_data ); ?></script>
		</div>

<!--		override the light colors of the playlist items-->
		<style>
			.wp-playlist-item a {
				color: #333 !important;
			}
		</style>

		<?php
		return ob_get_clean();
	}
}

add_shortcode( 'audio', 'jetpack_compat_audio_shortcode' );
