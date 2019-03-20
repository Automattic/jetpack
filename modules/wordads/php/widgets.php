<?php

/**
 * Widget for inserting an ad into your sidebar
 *
 * @since 4.5.0
 */
class WordAds_Sidebar_Widget extends WP_Widget {

	private static $allowed_tags = array( 'mrec', 'wideskyscraper' );
	private static $num_widgets  = 0;

	function __construct() {
		parent::__construct(
			'wordads_sidebar_widget',
			/** This filter is documented in modules/widgets/facebook-likebox.php */
			apply_filters( 'jetpack_widget_name', 'Ads' ),
			array(
				'description'                 => __( 'Insert an ad unit wherever you can place a widget.', 'jetpack' ),
				'customize_selective_refresh' => true,
			)
		);
	}

	public function widget( $args, $instance ) {
		global $wordads;
		if ( $wordads->should_bail() ) {
			return false;
		}

		if ( ! isset( $instance['unit'] ) ) {
			$instance['unit'] = 'mrec';
		}

		self::$num_widgets++;
		$about      = __( 'Advertisements', 'jetpack' );
		$width      = WordAds::$ad_tag_ids[ $instance['unit'] ]['width'];
		$height     = WordAds::$ad_tag_ids[ $instance['unit'] ]['height'];
		$unit_id    = 1 == self::$num_widgets ? 3 : self::$num_widgets + 3; // 2nd belowpost is '4'
		$section_id = 0 === $wordads->params->blog_id ?
			WORDADS_API_TEST_ID :
			$wordads->params->blog_id . $unit_id;

		$snippet = '';
		if ( $wordads->option( 'wordads_house', true ) ) {
			$unit = 'mrec';
			if ( 'leaderboard' == $instance['unit'] && ! $this->params->mobile_device ) {
				$unit = 'leaderboard';
			} elseif ( 'wideskyscraper' == $instance['unit'] ) {
				$unit = 'widesky';
			}

			$snippet = $wordads->get_house_ad( $unit );
		} else {
			$snippet = $wordads->get_ad_snippet( $section_id, $height, $width, 'widget' );
		}

		echo <<< HTML
		<div class="wpcnt">
			<div class="wpa">
				<span class="wpa-about">$about</span>
				<div class="u {$instance['unit']}">
					$snippet
				</div>
			</div>
		</div>
HTML;
	}

	public function form( $instance ) {
		// ad unit type
		if ( isset( $instance['unit'] ) ) {
			$unit = $instance['unit'];
		} else {
			$unit = 'mrec';
		}
		?>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'unit' ) ); ?>"><?php _e( 'Tag Dimensions:', 'jetpack' ); ?></label>
			<select class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'unit' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'unit' ) ); ?>">
		<?php
		foreach ( WordAds::$ad_tag_ids as $ad_unit => $properties ) {
			if ( ! in_array( $ad_unit, self::$allowed_tags ) ) {
				continue;
			}

				$splits      = explode( '_', $properties['tag'] );
				$unit_pretty = "{$splits[0]} {$splits[1]}";
				$selected    = selected( $ad_unit, $unit, false );
				echo "<option value='", esc_attr( $ad_unit ) ,"' ", $selected, '>', esc_html( $unit_pretty ) , '</option>';
		}
		?>
			</select>
		</p>
		<?php
	}

	public function update( $new_instance, $old_instance ) {
		$instance = $old_instance;

		if ( in_array( $new_instance['unit'], self::$allowed_tags ) ) {
			$instance['unit'] = $new_instance['unit'];
		} else {
			$instance['unit'] = 'mrec';
		}

		return $instance;
	}
}

function jetpack_wordads_widgets_init_callback() {
	return register_widget( 'WordAds_Sidebar_Widget' );
}

add_action( 'widgets_init', 'jetpack_wordads_widgets_init_callback' );
