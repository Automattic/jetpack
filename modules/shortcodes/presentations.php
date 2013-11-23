<?php
/*
Plugin Name: Presentations
Plugin URI: http://automattic.com/wordpress-plugins/
Description: Presentations plugin based on the work done by <a href="http://darylkoop.com/">Daryl Koopersmith</a>. Powered by jmpress.js
Version: 0.2
Author: Automattic
Author URI: http://automattic.com/wordpress-plugins/

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/


/**
 * Known issues:
 *
 * - IE 7/8 are not supported by jmpress and presentations will not work
 * - IE 9 will not animate transitions at all, though it's possible to at least
 *   switch between slides.
 * - Infinite Scroll themes will not load presentations properly unless the post
 *   happens to be on the first loaded page. The permalink page will function
 *   properly, however.
 * - Exiting fullscreen mode will not properly reset the scroll locations in Safari
 */


/*
HOW TO: How the plugin settings are organized and which features are supported.

The entire presentation should be wrapped with a [presentation] shortcode, and every
individual slide should be wrapped with a [slide] shortcode. Any settings supported
by [slide] can be set into [presentation], which will apply that setting for the entire
presentation unless overridden by individual slides.

- [presentation] only settings:
   - duration: transition durations, default is one second.
   - height:   content height, default is 400px
   - width:    content width, default is 550px
   - autoplay: delay between transitions in seconds, default 3s
               when set the presentation will automatically transition between slides
               as long as the presentation remains in focus

- [slide] settings:
	- transition: specifies where the next slide will be placed relative
				  to the last one before it. Supported values are "up", "down"
				  "left", "right", or "none". Default value is "down".

	- scale:      scales the content relative to other slides, default value is one

	- rotate:     rotates the content by the specified degrees, default is zero

	- fade:       slides will fade in and out during transition. Values of "on" or
                  "true" will enable fading, while values of "no" or "false" will
                  disable it. Default value is "on"

    - bgcolor:    specifies a background color for the slides. Any CSS valid value
                  is permitted. Default color is transparent.

    - bgimg:	  specifies an image url which will fill the background. Image is
                  set to fill the background 100% width and height

    - fadebullets: any html <li> tags will start out with an opacity of 0 and any
                   subsequent slide transitions will show the bullets one by one
*/

if ( ! class_exists( 'Presentations' ) ) :

class Presentations {

	private $presentation_settings;
	private $presentation_initialized;
	private $scripts_and_style_included;

	/**
	 * Constructor
	 */
	function __construct() {
		// Bail without 3.0.
		if ( ! function_exists( '__return_false' ) )
			return;

		$this->presentation_initialized = false;
		$this->scripts_and_style_included = false;

		// Registers shortcodes
		add_action( 'wp_head', array( &$this, 'add_scripts' ), 1 );

		add_shortcode( 'presentation', array( &$this, 'presentation_shortcode' ) );
		add_shortcode( 'slide',        array( &$this, 'slide_shortcode'        ) );
	}

	function add_scripts() {
		$this->scripts_and_style_included = false;

		if ( empty( $GLOBALS['posts'] ) || !is_array( $GLOBALS['posts'] ) ) {
			return;
		}

		foreach ( $GLOBALS['posts'] as $p ) {
			if ( false !== strpos( $p->post_content, '[presentation' ) ) {
				$this->scripts_and_style_included = true;
				break;
			}
		}

		if ( ! $this->scripts_and_style_included )
			return;

		$plugin = plugin_dir_url( __FILE__ );
		// Add CSS
		wp_enqueue_style('presentations', $plugin . 'css/style.css');
		// Add JavaScript
		wp_enqueue_script('jquery');
		wp_enqueue_script('jmpress',
			$plugin . 'js/jmpress.min.js',
			array('jquery'),
			'0.4.5',
			true);
		wp_enqueue_script('presentations',
			$plugin . 'js/main.js',
			array('jquery', 'jmpress'),
			false,
			true);
	}

	function presentation_shortcode( $atts, $content='' ) {
		// Mark that we've found a valid [presentation] shortcode
		$this->presentation_initialized = true;

		$atts = shortcode_atts( array(
			'duration'    => '',
			'height'      => '',
			'width'       => '',
			'bgcolor'     => '',
			'bgimg'       => '',
			'autoplay'    => '',

			// Settings
			'transition'  => '',
			'scale'       => '',
			'rotate'      => '',
			'fade'        => '',
			'fadebullets' => '',
		), $atts );

		$this->presentation_settings = array(
			'transition'  => 'down',
			'scale'       => 1,
			'rotate'      => 0,
			'fade'        => 'on',
			'fadebullets' => 0,
			'last'        => array(
				'x'       => 0,
				'y'       => 0,
				'scale'   => 1,
				'rotate'  => 0,
			),
		);

		// Set the presentation-wide settings
		if ( '' != trim( $atts['transition'] ) )
			$this->presentation_settings['transition'] = $atts['transition'];

		if ( '' != trim( $atts['scale'] ) )
			$this->presentation_settings['scale'] = floatval( $atts['scale'] );

		if ( '' != trim( $atts['rotate'] ) )
			$this->presentation_settings['rotate'] = floatval( $atts['rotate'] );

		if ( '' != trim( $atts['fade'] ) )
			$this->presentation_settings['fade'] = $atts['fade'];

		if ( '' != trim( $atts['fadebullets'] ) )
			$this->presentation_settings['fadebullets'] = $atts['fadebullets'];

		// Set any settings the slides don't care about
		if ( '' != trim( $atts['duration'] ) )
			$duration = floatval( $atts['duration'] ) . 's';
		else
			$duration = '1s';

		// Autoplay durations are set in milliseconds
		if ( '' != trim( $atts['autoplay'] ) )
			$autoplay = floatval( $atts['autoplay'] ) * 1000;
		else
			$autoplay = 0; // No autoplay

		// Set the presentation size as specified or with some nicely sized dimensions
		if ( '' != trim( $atts['width'] ) )
			$this->presentation_settings['width'] = intval( $atts['width'] );
		else
			$this->presentation_settings['width'] = 480;

		if ( '' != trim( $atts['height'] ) )
			$this->presentation_settings['height'] = intval( $atts['height'] );
		else
			$this->presentation_settings['height'] = 370;

		// Hide the content by default in case the scripts fail
		$style = 'display: none; width: ' . $this->presentation_settings['width'] . 'px; height: ' . $this->presentation_settings['height'] . 'px;';

		// Check for background color XOR background image
		// Use a white background if nothing specified
		if ( preg_match( '/https?\:\/\/[^\'"\s]*/', $atts['bgimg'], $matches ) ) {
			$style .= ' background-image: url("' . esc_url( $matches[0] ) . '");';
		} else if ( '' != trim( $atts['bgcolor'] ) ) {
			$style .= ' background-color: ' . esc_attr( $atts['bgcolor'] ) . ';';
		} else {
			$style .= ' background-color: #fff;';
		}

		// Not supported message style is inlined incase the style sheet doesn't get included
		$out = "<section class='presentation-wrapper'>";
		$out.= "<p class='not-supported-msg' style='display: inherit; padding: 25%; text-align: center;'>";
		$out.= __( 'This slideshow could not be started. Try refreshing the page or viewing it in another browser.' , 'jetpack' ) . '</p>';

		// Bail out unless the scripts were added
		if ( $this->scripts_and_style_included ) {
			$out.= sprintf(
				'<div class="presentation" duration="%s" data-autoplay="%s" style="%s">',
				esc_attr( $duration ),
				esc_attr( $autoplay ),
				esc_attr( $style )
			);
			$out.= "<div class='nav-arrow-left'></div>";
			$out.= "<div class='nav-arrow-right'></div>";
			$out.= "<div class='nav-fullscreen-button'></div>";

			if ( $autoplay ) {
				$out.= "<div class='autoplay-overlay' style='display: none'><p class='overlay-msg'>";
				$out.= __( 'Click to autoplay the presentation!' , 'jetpack' );
				$out.= "</p></div>";
			}

			$out.= do_shortcode( $content );
		}

		$out.= "</section>";

		$this->presentation_initialized = false;
		return $out;
	}

	function slide_shortcode( $atts, $content = '' ) {
		// Bail out unless wrapped by a [presentation] shortcode
		if ( ! $this->presentation_initialized )
			return $content;

		$atts = shortcode_atts( array(
			'transition' => '',
			'scale'      => '',
			'rotate'     => '',
			'fade'       => '',
			'fadebullets'=> '',
			'bgcolor'    => '',
			'bgimg'      => '',
		), $atts );

		// Determine positioning based on transition
		if ( '' == trim( $atts['transition'] ) )
			$atts['transition'] = $this->presentation_settings['transition'];

		// Setting the content scale
		if ( '' == trim( $atts['scale'] ) )
			$atts['scale'] = $this->presentation_settings['scale'];

		if( '' == trim( $atts['scale'] ) )
			$scale = 1;
		else
			$scale = floatval( $atts['scale'] );

		if ( $scale < 0 )
			$scale *= -1;

		// Setting the content rotation
		if ( '' == trim( $atts['rotate'] ) )
			$atts['rotate'] = $this->presentation_settings['rotate'];

		if( '' == trim( $atts['rotate'] ) )
			$rotate = 0;
		else
			$rotate = floatval( $atts['rotate'] );

		// Setting if the content should fade
		if ( '' == trim( $atts['fade'] ) )
			$atts['fade'] = $this->presentation_settings['fade'];

		if ( 'on' == $atts['fade'] || 'true' == $atts['fade'] )
			$fade = 'fade';
		else
			$fade = '';

		// Setting if bullets should fade on step changes
		if ( '' == trim( $atts['fadebullets'] ) )
			$atts['fadebullets'] = $this->presentation_settings['fadebullets'];

		if ( 'on' == $atts['fadebullets'] || 'true' == $atts['fadebullets'] )
			$fadebullets = 'fadebullets';
		else
			$fadebullets = '';

		$coords = $this->get_coords( array(
			'transition' => $atts['transition'],
			'scale'      => $scale,
			'rotate'     => $rotate,
		));

		$x = $coords['x'];
		$y = $coords['y'];

		// Check for background color XOR background image
		// Use a white background if nothing specified
		if ( preg_match( '/https?\:\/\/[^\'"\s]*/', $atts['bgimg'], $matches ) ) {
			$style = 'background-image: url("' . esc_url( $matches[0] ) . '");';
		} else if ( '' != trim( $atts['bgcolor'] ) ) {
			$style = 'background-color: ' . esc_attr( $atts['bgcolor'] ) . ';';
		} else {
			$style = '';
		}

		// Put everything together and let jmpress do the magic!
		$out = sprintf(
			'<div class="step %s %s" data-x="%s" data-y="%s" data-scale="%s" data-rotate="%s" style="%s">',
			esc_attr( $fade ),
			esc_attr( $fadebullets ),
			esc_attr( $x ),
			esc_attr( $y ),
			esc_attr( $scale ),
			esc_attr( $rotate ),
			esc_attr( $style )
		);

		$out.= "<div class='slide-content'>";
		$out.= do_shortcode( $content );
		$out.= "</div></div>";
		return $out;
	}

	/**
	 * Determines the position of the next slide based on the position and scaling of the previous slide.
	 *
	 * @param array $args: an array with the following key-value pairs
	 *           string $transition: the transition name, "up", "down", "left", or "right"
	 *           float $scale: the scale of the next slide (used to determine the position of the slide after that)
	 *
	 * @return array with the 'x' and 'y' coordinates of the slide
	 */
	function get_coords( $args ) {
		if ( 0 == $args['scale'] )
			$args['scale'] = 1;

		$width  = $this->presentation_settings['width'];
		$height = $this->presentation_settings['height'];
		$last   = $this->presentation_settings['last'];
		$scale  = $last['scale'];

		$next     = array(
			'x'      => $last['x'],
			'y'      => $last['y'],
			'scale'  => $args['scale'],
			'rotate' => $args['rotate'],
		);

		// All angles are measured from the vertical axis, so everything is backwards!
		$diagAngle = atan2( $width, $height );
		$diagonal = sqrt( pow( $width, 2 ) + pow( $height, 2 ) );

		// We offset the angles by the angle formed by the diagonal so that
		// we can multiply the sines directly against the diagonal length
		$theta = deg2rad( $last['rotate'] ) - $diagAngle;
		$phi   = deg2rad( $next['rotate'] ) - $diagAngle;

		// We start by displacing by the slide dimensions
		$totalHorizDisp = $width  * $scale;
		$totalVertDisp  = $height * $scale;

		// If the previous slide was rotated, we add the incremental offset from the rotation
		// Namely the difference between the regular dimension (no rotation) and the component
		// of the diagonal for that angle
		$totalHorizDisp += ( ( ( abs( sin( $theta ) ) * $diagonal) - $width ) / 2) * $scale;
		$totalVertDisp  += ( ( ( abs( cos( $theta ) ) * $diagonal) - $height) / 2) * $scale;

		// Similarly, we check if the current slide has been rotated and add whatever additional
		// offset has been added. This is so that two rotated corners don't clash with each other.
		// Note: we are checking the raw angle relative to the vertical axis, NOT the diagonal angle.
		if ( $next['rotate'] % 180 != 0 ){
			$totalHorizDisp += ( abs( ( sin( $phi ) * $diagonal ) - $width  ) / 2) * $next['scale'];
			$totalVertDisp  += ( abs( ( cos( $phi ) * $diagonal ) - $height ) / 2) * $next['scale'];
		}

		switch ( trim( $args['transition'] ) ) {
			case 'none':
				break;

			case 'left':
				$next['x'] -= $totalHorizDisp;
				break;

			case 'right':
				$next['x'] += $totalHorizDisp;
				break;

			case 'up':
				$next['y'] -= $totalVertDisp;
				break;

			case 'down':
			default:
				$next['y'] += $totalVertDisp;
				break;
		}

		$this->presentation_settings['last'] = $next;
		return $next;
	}
}

$GLOBALS['presentations'] = new Presentations();
endif;
