<?php
/**
 * CCPA Do Not Sell Widget
 *
 * @package Jetpack.
 */

/**
 * Class WordAds_Ccpa_Do_Not_Sell_Link_Widget
 */
class WordAds_Ccpa_Do_Not_Sell_Link_Widget extends WP_Widget {
function __construct() {
parent::__construct(
'wordads_ccpa_do_not_sell_link_widget',
/** This filter is documented in modules/widgets/facebook-likebox.php */
apply_filters( 'jetpack_widget_name', __( 'Do Not Sell Link (CCPA)', 'jetpack' ) ),
array(
'description'                 => __( 'Inserts "Do Not Sell My Personal Information" link required by the California Consumer Privacy Act (CCPA)', 'jetpack' ),
'customize_selective_refresh' => true,
)
);
}

public function widget( $args, $instance ) {
echo $args['before_widget'];
echo do_shortcode( '[ccpa-do-not-sell-link]' );
echo $args['after_widget'];
}
}
