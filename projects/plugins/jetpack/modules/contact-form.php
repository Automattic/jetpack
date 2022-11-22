<?php
/**
 * Contact form module.
 *
 * @package automattic/jetpack
 */

/**
 * Module Name: Contact Form
 * Module Description: Add a customizable contact form to any post or page using the Jetpack Form Block.
 * Sort Order: 15
 * Recommendation Order: 14
 * First Introduced: 1.3
 * Requires Connection: No
 * Auto Activate: Yes
 * Module Tags: Other
 * Feature: Writing
 * Additional Search Queries: contact, form, grunion, feedback, submission, contact form, email, feedback, contact form plugin, custom form, custom form plugin, form builder, forms, form maker, survey, contact by jetpack, contact us, forms free
 */

require_once __DIR__ . '/contact-form/grunion-contact-form.php';

/*
 * Filters if the new Contact Form Editor View should be used.
 *
 * A temporary filter to disable the new Editor View for the older UI.
 * Please note this filter and the old UI will be removed in the future.
 * Expected to be removed in Jetpack 5.8 or if a security issue merits removing the old code sooner.
 *
 * @since 5.2.0
 *
 * @param boolean $view Use new Editor View. Default true.
 */
if ( is_admin() && apply_filters( 'tmp_grunion_allow_editor_view', true ) ) {
	require_once __DIR__ . '/contact-form/grunion-editor-view.php';
}

/**
 * Register Jetpack Form patterns
 */
function jetpack_form_register_pattern() {
	$category_slug = 'forms';
	register_block_pattern_category( $category_slug, array( 'label' => __( 'Forms', 'jetpack' ) ) );

	$patterns = array(

		'address-form'                       => array(
			'title'      => 'Address Form',
			'blockTypes' => array( 'jetpack/contact-form' ),
			'categories' => array( $category_slug ),
			'content'    => '
				<!-- wp:jetpack/contact-form {"style":{"spacing":{"padding":{"top":"16px","right":"16px","bottom":"16px","left":"16px"}}}} -->
				<div class="wp-block-jetpack-contact-form" style="padding-top:16px;padding-right:16px;padding-bottom:16px;padding-left:16px">
					<!-- wp:jetpack/field-name {"label":"First Name","required":true,"width":50} /-->
					<!-- wp:jetpack/field-name {"label":"Last Name","required":true,"width":50} /-->
					<!-- wp:jetpack/field-text {"label":"Street Address"} /-->
					<!-- wp:jetpack/field-text {"label":"City","width":50} /-->
					<!-- wp:jetpack/field-text {"label":"Postal / Zip Code","width":50} /-->
					<!-- wp:jetpack/field-text {"label":"State / Province","width":50} /-->
					<!-- wp:jetpack/field-text {"label":"Country","width":50} /-->
					<!-- wp:jetpack/field-email {"required":true} /-->
					<!-- wp:jetpack/field-telephone /-->
					<!-- wp:jetpack/button {"element":"button","text":"Submit","lock":{"remove":true}} /-->
				</div>
				<!-- /wp:jetpack/contact-form -->
			',
		),

		'user-registration-form'             => array(
			'title'      => 'User Registration Form',
			'blockTypes' => array( 'jetpack/contact-form' ),
			'categories' => array( $category_slug ),
			'content'    => '
				<!-- wp:jetpack/contact-form {"style":{"spacing":{"padding":{"top":"16px","right":"16px","bottom":"16px","left":"16px"}}}} -->
				<div class="wp-block-jetpack-contact-form" style="padding-top:16px;padding-right:16px;padding-bottom:16px;padding-left:16px">
					<!-- wp:jetpack/field-text {"label":"First Name","required":true,"width":50} /-->
					<!-- wp:jetpack/field-name {"label":"Last Name","required":true,"width":50} /-->
					<!-- wp:jetpack/field-email {"required":true} /-->
					<!-- wp:jetpack/field-telephone {"label":"Mobile Phone"} /-->
					<!-- wp:spacer {"height":"24px"} -->
					<div style="height:24px" aria-hidden="true" class="wp-block-spacer"></div>
					<!-- /wp:spacer -->
					<!-- wp:jetpack/field-text {"label":"Street Address"} /-->
					<!-- wp:jetpack/field-text {"label":"City","width":50} /-->
					<!-- wp:jetpack/field-text {"label":"Postal / Zip Code","width":50} /-->
					<!-- wp:jetpack/field-text {"label":"State / Province","width":50} /-->
					<!-- wp:jetpack/field-text {"label":"Country","width":50} /-->
					<!-- wp:spacer {"height":"24px"} -->
					<div style="height:24px" aria-hidden="true" class="wp-block-spacer"></div>
					<!-- /wp:spacer -->
					<!-- wp:jetpack/field-select {"label":"Gender","options":["Female","Male","Other","Prefer not to say"],"width":50} /-->
					<!-- wp:jetpack/field-date {"label":"Birth Date","width":50} /-->
					<!-- wp:jetpack/field-textarea {"label":"Additional Comment"} /-->
					<!-- wp:jetpack/button {"element":"button","text":"Submit","lock":{"remove":true}} /-->
				</div>
				<!-- /wp:jetpack/contact-form -->
			',
		),

		'sign-up-for-beta-with-image'        => array(
			'title'      => 'Sign Up for Beta with Image',
			'blockTypes' => array( 'jetpack/contact-form' ),
			'categories' => array( $category_slug ),
			'content'    => '
				<!-- wp:columns {"align":"wide"} -->
				<div class="wp-block-columns alignwide">
					<!-- wp:column -->
					<div class="wp-block-column">
						<!-- wp:image {"id":596,"width":434,"height":650,"sizeSlug":"full","linkDestination":"none","filter":"grayscale"} -->
						<figure class="wp-block-image size-full is-resized has-filter-grayscale"><img src="https://atomicsitecrowdsignal.wpcomstaging.com/wp-content/uploads/2022/11/pexels-photo-9017748.jpeg" alt="hand gesturing ok" class="wp-image-596" width="434" height="650"/><figcaption class="wp-element-caption">Replace Image (Photo by Kevin Malik on <a rel="nofollow" href="https://www.pexels.com/photo/hand-gesturing-ok-9017748/">Pexels.com</a>)</figcaption></figure>
						<!-- /wp:image --></div>
					<!-- /wp:column -->
					<!-- wp:column -->
					<div class="wp-block-column">
						<!-- wp:jetpack/contact-form {"style":{"spacing":{"padding":{"top":"16px","right":"16px","bottom":"16px","left":"16px"}}}} -->
						<div class="wp-block-jetpack-contact-form" style="padding-top:16px;padding-right:16px;padding-bottom:16px;padding-left:16px">
							<!-- wp:spacer {"height":"40px"} -->
							<div style="height:40px" aria-hidden="true" class="wp-block-spacer"></div>
							<!-- /wp:spacer -->
							<!-- wp:heading {"level":3} -->
							<h3>Sign up for Beta</h3>
							<!-- /wp:heading -->
							<!-- wp:spacer {"height":"56px"} -->
							<div style="height:56px" aria-hidden="true" class="wp-block-spacer"></div>
							<!-- /wp:spacer -->
							<!-- wp:jetpack/field-name {"label":"Username","required":true} /-->
							<!-- wp:jetpack/field-email {"required":true} /-->
							<!-- wp:jetpack/button {"element":"button","text":"Submit","lock":{"remove":true}} /-->
						</div>
						<!-- /wp:jetpack/contact-form -->
					</div>
					<!-- /wp:column -->
				</div>
				<!-- /wp:columns -->
			',
		),

		'newsletter-sign-up-with-background' => array(
			'title'      => 'Newsletter Sign Up with Background',
			'blockTypes' => array( 'jetpack/contact-form' ),
			'categories' => array( $category_slug ),
			'content'    => '
				<!-- wp:cover {"url":"https://atomicsitecrowdsignal.wpcomstaging.com/wp-content/uploads/2022/11/pexels-photo-2838545.jpeg","id":616,"dimRatio":0,"overlayColor":"secondary","isDark":false,"align":"full"} -->
				<div class="wp-block-cover alignfull is-light">
					<span aria-hidden="true" class="wp-block-cover__background has-secondary-background-color has-background-dim-0 has-background-dim"></span>
					<img class="wp-block-cover__image-background wp-image-616" alt="contemporary art" src="https://atomicsitecrowdsignal.wpcomstaging.com/wp-content/uploads/2022/11/pexels-photo-2838545.jpeg" data-object-fit="cover"/>
					<div class="wp-block-cover__inner-container">
						<!-- wp:cover {"overlayColor":"background","minHeight":318,"minHeightUnit":"px","isDark":false,"align":"center","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","right":"var:preset|spacing|50","bottom":"var:preset|spacing|50","left":"var:preset|spacing|50"}}}} -->
						<div class="wp-block-cover aligncenter is-light" style="padding-top:var(--wp--preset--spacing--50);padding-right:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--50);padding-left:var(--wp--preset--spacing--50);min-height:318px">
							<span aria-hidden="true" class="wp-block-cover__background has-background-background-color has-background-dim-100 has-background-dim"></span>
							<div class="wp-block-cover__inner-container">
								<!-- wp:columns {"style":{"spacing":{"padding":{"top":"0","right":"0","bottom":"0","left":"0"}}}} -->
								<div class="wp-block-columns" style="padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
									<!-- wp:column {"verticalAlignment":"top","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40"}}}} -->
									<div class="wp-block-column is-vertically-aligned-top" style="padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)">
										<!-- wp:heading {"level":3} -->
										<h3><strong>Sign up for the Daily Newsletter</strong></h3>
										<!-- /wp:heading -->
										<!-- wp:paragraph -->
										<p>Our biggest stories, delivered to your inbox every day.</p>
										<!-- /wp:paragraph --></div>
									<!-- /wp:column -->
									<!-- wp:column {"verticalAlignment":"top"} -->
									<div class="wp-block-column is-vertically-aligned-top">
										<!-- wp:jetpack/contact-form {"style":{"spacing":{"padding":{"top":"16px","right":"16px","bottom":"16px","left":"16px"}}}} -->
										<div class="wp-block-jetpack-contact-form" style="padding-top:16px;padding-right:16px;padding-bottom:16px;padding-left:16px">
											<!-- wp:jetpack/field-email {"required":true} /-->
											<!-- wp:jetpack/field-consent {"width":75} /-->
											<!-- wp:jetpack/button {"element":"button","text":"Subscribe","lock":{"remove":true}} /-->
										</div>
										<!-- /wp:jetpack/contact-form -->
									</div>
									<!-- /wp:column -->
								</div>
								<!-- /wp:columns -->
							</div>
						</div>
						<!-- /wp:cover -->
					</div>
				</div>
				<!-- /wp:cover -->
			',
		),

		'demo-request'                       => array(
			'title'      => 'Demo Request',
			'blockTypes' => array( 'jetpack/contact-form' ),
			'categories' => array( $category_slug ),
			'content'    => '
				<!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"top":"0","right":"0","bottom":"0","left":"0"}}},"backgroundColor":"tertiary","layout":{"type":"constrained"}} -->
				<div class="wp-block-group alignwide has-tertiary-background-color has-background" style="padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
					<!-- wp:image {"align":"wide","id":620,"sizeSlug":"full","linkDestination":"none"} -->
					<figure class="wp-block-image alignwide size-full"><img src="https://atomicsitecrowdsignal.wpcomstaging.com/wp-content/uploads/2022/11/pexels-photo-1242348.jpeg" alt="blurry image of a brownish background" class="wp-image-620"/></figure>
					<!-- /wp:image -->
					<!-- wp:heading -->
					<h2>Demo Request</h2>
					<!-- /wp:heading -->
					<!-- wp:jetpack/contact-form {"style":{"spacing":{"padding":{"top":"16px","right":"16px","bottom":"16px","left":"16px"}}}} -->
					<div class="wp-block-jetpack-contact-form" style="padding-top:16px;padding-right:16px;padding-bottom:16px;padding-left:16px">
						<!-- wp:jetpack/field-name {"required":true} /-->
						<!-- wp:jetpack/field-email {"required":true} /-->
						<!-- wp:jetpack/field-text {"label":"Company"} /-->
						<!-- wp:jetpack/field-text {"label":"Your Role"} /-->
						<!-- wp:jetpack/field-textarea {"label":"Anything specifically you are interested in?"} /-->
						<!-- wp:jetpack/button {"element":"button","text":"Contact Us","lock":{"remove":true}} /-->
						<!-- wp:spacer {"height":"16px"} -->
						<div style="height:16px" aria-hidden="true" class="wp-block-spacer"></div>
						<!-- /wp:spacer -->
					</div>
					<!-- /wp:jetpack/contact-form -->
				</div>
				<!-- /wp:group -->
			',
		),

		'call-back-form'                     => array(
			'title'      => 'Call Back Form',
			'blockTypes' => array( 'jetpack/contact-form' ),
			'categories' => array( $category_slug ),
			'content'    => '
				<!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"top":"var:preset|spacing|70","right":"var:preset|spacing|70","bottom":"var:preset|spacing|70","left":"var:preset|spacing|70"}},"border":{"radius":"15px","width":"1px"}},"layout":{"type":"constrained"}} -->
				<div class="wp-block-group alignwide" style="border-width:1px;border-radius:15px;padding-top:var(--wp--preset--spacing--70);padding-right:var(--wp--preset--spacing--70);padding-bottom:var(--wp--preset--spacing--70);padding-left:var(--wp--preset--spacing--70)">
					<!-- wp:columns {"align":"wide"} -->
					<div class="wp-block-columns alignwide"><!-- wp:column -->
						<div class="wp-block-column"><!-- wp:spacer {"height":"4px"} -->
							<div style="height:4px" aria-hidden="true" class="wp-block-spacer"></div>
							<!-- /wp:spacer -->
							<!-- wp:heading {"level":4} -->
							<h4><strong>May we call you back?</strong></h4>
							<!-- /wp:heading -->
							<!-- wp:spacer {"height":"4px"} -->
							<div style="height:4px" aria-hidden="true" class="wp-block-spacer"></div>
							<!-- /wp:spacer -->
							<!-- wp:jetpack/contact-form {"style":{"spacing":{"padding":{"top":"0px","right":"0px","bottom":"0px","left":"0px"}}}} -->
							<div class="wp-block-jetpack-contact-form" style="padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px">
								<!-- wp:jetpack/field-name {"required":true} /-->
								<!-- wp:jetpack/field-telephone {"required":true} /-->
								<!-- wp:jetpack/field-email {"required":true} /-->
								<!-- wp:jetpack/field-textarea {"label":"Message"} /-->
								<!-- wp:jetpack/button {"element":"button","text":"Contact Us","lock":{"remove":true}} /--></div>
							<!-- /wp:jetpack/contact-form --></div>
						<!-- /wp:column -->
						<!-- wp:column -->
						<div class="wp-block-column">
							<!-- wp:image {"align":"right","id":636,"width":379,"height":674,"sizeSlug":"full","linkDestination":"none"} -->
							<figure class="wp-block-image alignright size-full is-resized">
								<img src="https://atomicsitecrowdsignal.wpcomstaging.com/wp-content/uploads/2022/11/pexels-photo-edited.jpg" alt="marketing office working business" class="wp-image-636" width="379" height="674"/>
								<figcaption class="wp-element-caption">Replace Image (Photo by Negative Space on <a rel="nofollow" href="https://www.pexels.com/photo/marketing-office-working-business-33999/">Pexels.com</a>)
								</figcaption>
							</figure>
							<!-- /wp:image -->
						</div>
						<!-- /wp:column -->
					</div>
					<!-- /wp:columns -->
				</div>
				<!-- /wp:group -->
			',
		),

		'contact-form'                       => array(
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
		'newsletter-form'                    => array(
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
		'rsvp-form'                          => array(
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
		'registration-form'                  => array(
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
		'appointment-form'                   => array(
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
		'feedback-form'                      => array(
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

add_action( 'init', 'jetpack_form_register_pattern' );
