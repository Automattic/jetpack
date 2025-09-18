<?php
/**
 * Podcast Player Block.
 *
 * @since 8.4.0
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Podcast_Player;

use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Status\Request;
use Jetpack_Gutenberg;
use Jetpack_Podcast_Helper;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

if ( ! class_exists( 'Jetpack_Podcast_Helper' ) ) {
	require_once JETPACK__PLUGIN_DIR . '/_inc/lib/class-jetpack-podcast-helper.php';
}

/**
 * Registers the block for use in Gutenberg. This is done via an action so that
 * we can disable registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		__DIR__,
		array(
			'render_callback'       => __NAMESPACE__ . '\render_block',
			// Since Gutenberg #31873.
			'style'                 => 'wp-mediaelement',
			'render_email_callback' => __NAMESPACE__ . '\render_email',
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Returns the error message wrapped in HTML if current user
 * has the capability to edit the post. Public visitors will
 * never see errors.
 *
 * @param string $message The error message to display.
 * @return string
 */
function render_error( $message ) {
	// Suppress errors for users unable to address them.
	if ( ! current_user_can( 'edit_posts' ) ) {
		return '';
	}
	return '<p>' . esc_html( $message ) . '</p>';
}

/**
 * Podcast Player block registration/dependency declaration.
 *
 * @param array  $attributes Array containing the Podcast Player block attributes.
 * @param string $content    Fallback content - a direct link to RSS, as rendered by save.js.
 * @return string
 */
function render_block( $attributes, $content ) {
	// Don't render an interactive version of the block outside the frontend context.
	if ( ! Request::is_frontend() ) {
		return $content;
	}

	// Test for empty URLS.
	if ( empty( $attributes['url'] ) ) {
		return render_error( __( 'No Podcast URL provided. Please enter a valid Podcast RSS feed URL.', 'jetpack' ) );
	}

	// Test for invalid URLs.
	if ( ! wp_http_validate_url( $attributes['url'] ) ) {
		return render_error( __( 'Your podcast URL is invalid and couldn\'t be embedded. Please double check your URL.', 'jetpack' ) );
	}

	if ( ! empty( $attributes['selectedEpisodes'] ) ) {
		$guids       = array_map(
			function ( $episode ) {
				return $episode['guid'];
			},
			$attributes['selectedEpisodes']
		);
		$player_args = array( 'guids' => $guids );
	} else {
		$player_args = array();
	}

	// Sanitize the URL.
	$attributes['url'] = esc_url_raw( $attributes['url'] );
	$player_data       = ( new Jetpack_Podcast_Helper( $attributes['url'] ) )->get_player_data( $player_args );

	if ( is_wp_error( $player_data ) ) {
		return render_error( $player_data->get_error_message() );
	}

	return render_player( $player_data, $attributes );
}

/**
 * Renders the HTML for the Podcast player and tracklist.
 *
 * @param array $player_data The player data details.
 * @param array $attributes Array containing the Podcast Player block attributes.
 * @return string The HTML for the podcast player.
 */
function render_player( $player_data, $attributes ) {
	// If there are no tracks (it is possible) then display appropriate user facing error message.
	if ( empty( $player_data['tracks'] ) ) {
		return render_error( __( 'No tracks available to play.', 'jetpack' ) );
	}

	if ( is_wp_error( $player_data['tracks'] ) ) {
		return render_error( $player_data['tracks']->get_error_message() );
	}

	// Only use the amount of tracks requested.
	$player_data['tracks'] = array_slice(
		$player_data['tracks'],
		0,
		absint( $attributes['itemsToShow'] )
	);

	// Generate a unique id for the block instance.
	$instance_id             = wp_unique_id( 'jetpack-podcast-player-block-' . get_the_ID() . '-' );
	$player_data['playerId'] = $instance_id;

	// Generate object to be used as props for PodcastPlayer.
	$player_props = array_merge(
		// Add all attributes.
		array( 'attributes' => $attributes ),
		// Add all player data.
		$player_data
	);

	$primary_colors    = get_colors( 'primary', $attributes, 'color' );
	$secondary_colors  = get_colors( 'secondary', $attributes, 'color' );
	$background_colors = get_colors( 'background', $attributes, 'background-color' );

	$player_classes_name  = trim( "{$secondary_colors['class']} {$background_colors['class']}" );
	$player_inline_style  = trim( "{$secondary_colors['style']} {$background_colors['style']}" );
	$player_inline_style .= get_css_vars( $attributes );
	$wrapper_attributes   = \WP_Block_Supports::get_instance()->apply_block_supports();
	$block_classname      = Blocks::classes( Blocks::get_block_feature( __DIR__ ), $attributes, array( 'is-default' ) );
	$is_amp               = Blocks::is_amp_request();

	ob_start();
	?>
	<div class="<?php echo esc_attr( $block_classname ); ?>"<?php echo ! empty( $wrapper_attributes['style'] ) ? ' style="' . esc_attr( $wrapper_attributes['style'] ) . '"' : ''; ?> id="<?php echo esc_attr( $instance_id ); ?>">
		<section
			class="jetpack-podcast-player <?php echo esc_attr( $player_classes_name ); ?>"
			style="<?php echo esc_attr( $player_inline_style ); ?>"
		>
			<?php
			render(
				'podcast-header',
				array_merge(
					$player_props,
					array(
						'primary_colors' => $primary_colors,
						'player_id'      => $player_data['playerId'],
					)
				)
			);
			?>
			<?php if ( count( $player_data['tracks'] ) > 1 ) : ?>
			<ol class="jetpack-podcast-player__tracks">
				<?php foreach ( $player_data['tracks'] as $track_index => $attachment ) : ?>
					<?php
					render(
						'playlist-track',
						array(
							'is_active'        => 0 === $track_index,
							'attachment'       => $attachment,
							'primary_colors'   => $primary_colors,
							'secondary_colors' => $secondary_colors,
						)
					);
					?>
				<?php endforeach; ?>
			</ol>
			<?php endif; ?>
		</section>
		<?php if ( ! $is_amp ) : ?>
		<script type="application/json"><?php echo wp_json_encode( $player_props ); ?></script>
		<?php endif; ?>
	</div>
	<?php
	/**
	 * Enqueue necessary scripts and styles.
	 */
	if ( ! $is_amp ) {
		wp_enqueue_style( 'wp-mediaelement' );
	}
	Jetpack_Gutenberg::load_assets_as_required( __DIR__, array( 'mediaelement' ) );

	return ob_get_clean();
}

/**
 * Given the color name, block attributes and the CSS property,
 * the function will return an array with the `class` and `style`
 * HTML attributes to be used straight in the markup.
 *
 * @example
 * $color = get_colors( 'secondary', $attributes, 'border-color'
 *  => array( 'class' => 'has-secondary', 'style' => 'border-color: #333' )
 *
 * @param string $name     Color attribute name, for instance `primary`, `secondary`, ...
 * @param array  $attrs    Block attributes.
 * @param string $property Color CSS property, fo instance `color`, `background-color`, ...
 * @return array           Colors array.
 */
function get_colors( $name, $attrs, $property ) {
	$attr_color  = "{$name}Color";
	$attr_custom = 'custom' . ucfirst( $attr_color );

	$color        = isset( $attrs[ $attr_color ] ) ? $attrs[ $attr_color ] : null;
	$custom_color = isset( $attrs[ $attr_custom ] ) ? $attrs[ $attr_custom ] : null;

	$colors = array(
		'class' => '',
		'style' => '',
	);

	if ( $color || $custom_color ) {
		$colors['class'] .= "has-{$name}";

		if ( $color ) {
			$colors['class'] .= " has-{$color}-{$property}";
		} elseif ( $custom_color ) {
			$colors['style'] .= "{$property}: {$custom_color};";
		}
	}

	return $colors;
}

/**
 * It generates a string with CSS variables according to the
 * block colors, prefixing each one with `--jetpack-podcast-player'.
 *
 * @param array $attrs Podcast Block attributes object.
 * @return string      CSS variables depending on block colors.
 */
function get_css_vars( $attrs ) {
	$colors_name = array( 'primary', 'secondary', 'background' );

	$inline_style = '';
	foreach ( $colors_name as $color ) {
		$hex_color = 'hex' . ucfirst( $color ) . 'Color';
		if ( ! empty( $attrs[ $hex_color ] ) ) {
			$inline_style .= " --jetpack-podcast-player-{$color}: {$attrs[ $hex_color ]};";
		}
	}
	return $inline_style;
}

/**
 * Render the given template in server-side.
 * Important note:
 *    The $template_props array will be extracted.
 *    This means it will create a var for each array item.
 *    Keep it mind when using this param to pass
 *    properties to the template.
 *
 * @html-template-var array $template_props
 *
 * @param string $name           Template name, available in `./templates` folder.
 * @param array  $template_props Template properties. Optional.
 * @param bool   $print          Render template. True as default.
 * @return string|null           HTML markup or null.
 */
function render( $name, $template_props = array(), $print = true ) {
	if ( ! strpos( $name, '.php' ) ) {
		$name = $name . '.php';
	}

	$template_path = __DIR__ . '/templates/' . $name;

	if ( ! file_exists( $template_path ) ) {
		return '';
	}

	if ( $print ) {
		include $template_path;
	} else {
		ob_start();
		include $template_path;
		$markup = ob_get_contents();
		ob_end_clean();

		return $markup;
	}
}

/**
 * Render podcast player block for email.
 *
 * @since 15.0
 *
 * @param string $block_content     The original block HTML content.
 * @param array  $parsed_block      The parsed block data including attributes.
 * @param object $rendering_context Email rendering context.
 *
 * @return string
 */
function render_email( $block_content, array $parsed_block, $rendering_context ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	// Validate input parameters and required dependencies
	if ( ! isset( $parsed_block['attrs'] ) || ! is_array( $parsed_block['attrs'] ) ||
		! class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper' ) ) {
		return '';
	}

	$attr = $parsed_block['attrs'];

	// Check if we have a valid podcast URL
	if ( empty( $attr['url'] ) || ! wp_http_validate_url( $attr['url'] ) ) {
		return '';
	}

	// Get spacing from email_attrs for better consistency with core blocks
	$email_attrs        = $parsed_block['email_attrs'] ?? array();
	$table_margin_style = '';

	if ( ! empty( $email_attrs ) && class_exists( '\WP_Style_Engine' ) ) {
		// Get margin for table styling
		$table_margin_style = \WP_Style_Engine::compile_css( array_intersect_key( $email_attrs, array_flip( array( 'margin' ) ) ), '' ) ?? '';

		// Validate CSS output to prevent injection
		if ( ! empty( $table_margin_style ) && ! preg_match( '/^[a-zA-Z0-9\s:;()-]+$/', $table_margin_style ) ) {
			$table_margin_style = '';
		}
	}

	$icon_image = 'https://s0.wp.com/i/emails/wpcom-notifications/audio-play.png';
	$label      = __( 'Listen to the podcast', 'jetpack' );
	$audio_url  = esc_url( $attr['url'] );

	// Define pill-style colors and styling
	$background_color = '#f6f7f7';
	$border_color     = '#AAA';
	$icon_size        = '18px';
	$font_size        = '14px';

	// Generate the icon content
	$icon_content = sprintf(
		'<a href="%1$s" rel="noopener nofollow" target="_blank" style="padding: 0.25em; padding-left: 17px; display: inline-block; vertical-align: middle;"><img height="%2$s" src="%3$s" style="display:block;margin-right:0;vertical-align:middle;" width="%2$s" alt="%4$s"></a>',
		esc_url( $audio_url ),
		esc_attr( $icon_size ),
		esc_url( $icon_image ),
		// translators: %s is the podcast player icon.
		sprintf( __( '%s icon', 'jetpack' ), __( 'Podcast', 'jetpack' ) )
	);
	$icon_content = \Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper::render_table_cell( $icon_content, array( 'style' => sprintf( 'vertical-align:middle;font-size:%s;', $font_size ) ) );

	// Generate the label content
	$label_content    = sprintf(
		'<a href="%1$s" rel="noopener nofollow" target="_blank" style="text-decoration:none; padding: 0.25em; padding-right: 17px; display: inline-block;"><span style="margin-left:.5em;margin-right:.5em;font-weight:bold"> %2$s </span></a>',
		esc_url( $audio_url ),
		esc_html( $label )
	);
	$label_cell_style = sprintf(
		'vertical-align:middle;font-size:%s;',
		$font_size
	);
	$label_content    = \Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper::render_table_cell( $label_content, array( 'style' => $label_cell_style ) );

	// Combine icon and label tables
	$podcast_content = $icon_content . $label_content;

	// Create the main pill-style table
	$main_table_styles = sprintf(
		'background-color: %s; border-radius: 9999px; display: inline-table; float: none; border: 1px solid %s; border-collapse: separate;',
		$background_color,
		$border_color
	);

	$main_table_attrs = array(
		'align' => 'left',
		'style' => $main_table_styles,
	);

	$main_table = \Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper::render_table_wrapper( $podcast_content, $main_table_attrs, array(), array(), false );

	// Create the main wrapper table
	$table_style = 'width: 100%;';
	if ( ! empty( $table_margin_style ) ) {
		$table_style = $table_margin_style . '; ' . $table_style;
	} else {
		$table_style = 'margin: 16px 0; ' . $table_style;
	}

	$table_attrs = array(
		'style' => $table_style,
	);

	$cell_attrs = array(
		'style' => 'min-width: 100%; vertical-align: middle; word-break: break-word; text-align: left;',
	);

	$main_wrapper = \Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper::render_table_wrapper( $main_table, $table_attrs, $cell_attrs );

	return \Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper::render_outlook_table_wrapper( $main_wrapper, array( 'align' => 'left' ) );
}
