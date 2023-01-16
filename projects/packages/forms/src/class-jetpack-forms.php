<?php
/**
 * Package description here
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms;


use Automattic\Jetpack\Forms\ContactForm\Util;
use Automattic\Jetpack\Forms\ContactForm\Editor_View;

/**
 * Understands the Jetpack Forms package.
 */
class Jetpack_Forms {

	const VERSION = '0.1.0';

    public static function plugin_url() {
        return plugin_dir_url( __FILE__ );
    }

    public static function load_contact_form() {
        Util::init();

        if ( is_admin() && apply_filters( 'tmp_grunion_allow_editor_view', true ) ) {
            add_action( 'current_screen', '\Automattic\Jetpack\Forms\ContactForm\Editor_View::add_hooks' );
        }

        add_action( 'init', '\Automattic\Jetpack\Forms\Jetpack_Forms::register_pattern' );
    }

    public static function register_pattern() {
        $category_slug = 'forms';
        register_block_pattern_category( $category_slug, array( 'label' => __( 'Forms', 'jetpack' ) ) );

        $patterns = array(
            'contact-form'      => array(
                'title'      => 'Contact Form',
                'blockTypes' => array( 'jetpack/contact-form' ),
                'categories' => array( $category_slug ),
                'content'    => '<!-- wp:jetpack/contact-form {"style":{"spacing":{"padding":{"top":"16px","right":"16px","bottom":"16px","left":"16px"}}}} -->
                    <div class="wp-block-jetpack-contact-form" style="padding-top:16px;padding-right:16px;padding-bottom:16px;padding-left:16px">
                        <!-- wp:jetpack/field-name {"required":true} /-->
                        <!-- wp:jetpack/field-email {"required":true} /-->
                        <!-- wp:jetpack/field-textarea /-->
                        <!-- wp:jetpack/button {"element":"button","text":"Contact Us","lock":{"remove":true}} /-->
                    </div>
                    <!-- /wp:jetpack/contact-form -->',
            ),
            'newsletter-form'   => array(
                'title'      => 'Newsletter Subscription Form',
                'blockTypes' => array( 'jetpack/contact-form' ),
                'categories' => array( $category_slug ),
                'content'    => '<!-- wp:jetpack/contact-form {"style":{"spacing":{"padding":{"top":"16px","right":"16px","bottom":"16px","left":"16px"}}}} -->
                    <div class="wp-block-jetpack-contact-form" style="padding-top:16px;padding-right:16px;padding-bottom:16px;padding-left:16px">
                        <!-- wp:jetpack/field-name {"required":true} /-->
                        <!-- wp:jetpack/field-email {"required":true} /-->
                        <!-- wp:jetpack/field-consent /-->
                        <!-- wp:jetpack/button {"element":"button","text":"Subscribe","lock":{"remove":true}} /-->
                    </div>
                    <!-- /wp:jetpack/contact-form -->',
            ),
            'rsvp-form'         => array(
                'title'      => 'RSVP Form',
                'blockTypes' => array( 'jetpack/contact-form' ),
                'categories' => array( $category_slug ),
                'content'    => '<!-- wp:jetpack/contact-form {"subject":"A new RSVP from your website","style":{"spacing":{"padding":{"top":"16px","right":"16px","bottom":"16px","left":"16px"}}}} -->
                    <div class="wp-block-jetpack-contact-form" style="padding-top:16px;padding-right:16px;padding-bottom:16px;padding-left:16px">
                        <!-- wp:jetpack/field-name {"required":true} /-->
                        <!-- wp:jetpack/field-email {"required":true} /-->
                        <!-- wp:jetpack/field-radio {"label":"Attending?","required":true,"options":["Yes","No"]} /-->
                        <!-- wp:jetpack/field-textarea {"label":"Other Details"} /-->
                        <!-- wp:jetpack/button {"element":"button","text":"Send RSVP","lock":{"remove":true}} /-->
                    </div>
                    <!-- /wp:jetpack/contact-form -->',
            ),
            'registration-form' => array(
                'title'      => 'Registration Form',
                'blockTypes' => array( 'jetpack/contact-form' ),
                'categories' => array( $category_slug ),
                'content'    => '<!-- wp:jetpack/contact-form {"subject":"A new registration from your website","style":{"spacing":{"padding":{"top":"16px","right":"16px","bottom":"16px","left":"16px"}}}} -->
                    <div class="wp-block-jetpack-contact-form" style="padding-top:16px;padding-right:16px;padding-bottom:16px;padding-left:16px">
                        <!-- wp:jetpack/field-name {"required":true} /-->
                        <!-- wp:jetpack/field-email {"required":true} /-->
                        <!-- wp:jetpack/field-telephone {"label":"Phone Number"} /-->
                        <!-- wp:jetpack/field-select {"label":"How did you hear about us?","options":["Search Engine","Social Media","TV","Radio","Friend or Family"]} /-->
                        <!-- wp:jetpack/field-textarea {"label":"Other Details"} /-->
                        <!-- wp:jetpack/button {"element":"button","text":"Send","lock":{"remove":true}} /-->
                    </div>
                    <!-- /wp:jetpack/contact-form -->',
            ),
            'appointment-form'  => array(
                'title'      => 'Appointment Form',
                'blockTypes' => array( 'jetpack/contact-form' ),
                'categories' => array( $category_slug ),
                'content'    => '<!-- wp:jetpack/contact-form {"subject":"A new appointment booked from your website","style":{"spacing":{"padding":{"top":"16px","right":"16px","bottom":"16px","left":"16px"}}}} -->
                    <div class="wp-block-jetpack-contact-form" style="padding-top:16px;padding-right:16px;padding-bottom:16px;padding-left:16px">
                        <!-- wp:jetpack/field-name {"required":true} /-->
                        <!-- wp:jetpack/field-email {"required":true} /-->
                        <!-- wp:jetpack/field-telephone {"required":true} /-->
                        <!-- wp:jetpack/field-date {"label":"Date","required":true} /-->
                        <!-- wp:jetpack/field-radio {"label":"Time","required":true,"options":["Morning","Afternoon"]} /-->
                        <!-- wp:jetpack/field-textarea {"label":"Notes"} /-->
                        <!-- wp:jetpack/button {"element":"button","text":"Book Appointment","lock":{"remove":true}} /-->
                    </div>
                    <!-- /wp:jetpack/contact-form -->',
            ),
            'feedback-form'     => array(
                'title'      => 'Feedback Form',
                'blockTypes' => array( 'jetpack/contact-form' ),
                'categories' => array( $category_slug ),
                'content'    => '<!-- wp:jetpack/contact-form {"subject":"New feedback received from your website","style":{"spacing":{"padding":{"top":"16px","right":"16px","bottom":"16px","left":"16px"}}}} -->
                    <div class="wp-block-jetpack-contact-form" style="padding-top:16px;padding-right:16px;padding-bottom:16px;padding-left:16px">
                        <!-- wp:jetpack/field-name {"required":true} /-->
                        <!-- wp:jetpack/field-email {"required":true} /-->
                        <!-- wp:jetpack/field-radio {"label":"Please rate our website","required":true,"options":["1 - Very Bad","2 - Poor","3 - Average","4 - Good","5 - Excellent"]} /-->
                        <!-- wp:jetpack/field-textarea {"label":"How could we improve?"} /-->
                        <!-- wp:jetpack/button {"element":"button","text":"Send Feedback","lock":{"remove":true}} /-->
                    </div>
                    <!-- /wp:jetpack/contact-form -->',
            ),
        );

        foreach ( $patterns as $name => $pattern ) {
            register_block_pattern( $name, $pattern );
        }
    }
}
