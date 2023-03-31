<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * Learn menus
 */
namespace Automattic\JetpackCRM;

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * Learn menu class
 */
class Learn_Menu {


	/**
	 * Current slug (which learn menu to render)
	 *
	 * @var string
	 */
	protected $slug;

	/**
	 * Current override slug (previously zbsSlug)
	 * This is used for override WP pages with JPCRM variants
	 *
	 * @var string
	 */
	protected $override_slug;


	/**
	 * Setup learn menu.     
	 */
	public function __construct( ) {

		// set slugs
		$this->set_slugs();

		// require legacy functions
		require_once ZEROBSCRM_INCLUDE_PATH  . 'jpcrm-learn-menu-legacy-functions.php';

	}

	/**
	 * Renders a learn menu
	 */
	public function render_learn_menu() {

		global $zbs;
		
		// retrieve
		$learn_menu_settings = $this->get_content( $this->slug );
		if ( is_array( $learn_menu_settings ) ){

			// render

				// adapted from `zeroBSCRM_admin_subtop_menu()`
				// ... so there are functions to call for some learn menus, (if specified in 'output_function' attr)
				// ... else the intention is to use `render_generic_learn_menu()` (previously `zeroBS_genericLearnMenu()`)

				// if we have an `output_function` use it, else render generically
				if ( isset( $learn_menu_settings['output_function'] ) && function_exists( $learn_menu_settings['output_function'] ) ){
					
					// call learn menu function
					call_user_func( $learn_menu_settings['output_function'] );

				} else {

					// render generic learn menu with content
					$this->render_generic_learn_menu(

						$learn_menu_settings['title'],
						$learn_menu_settings['add_new'],
						'',
						( !isset( $learn_menu_settings['hide'] ) ? true : false ),
						$learn_menu_settings['title'],
						$learn_menu_settings['content'],
						$learn_menu_settings['url'],
						$this->get_image_url( $learn_menu_settings['img'] ),
						$learn_menu_settings['video'],
						( !empty( $learn_menu_settings['extra_js'] ) ? $learn_menu_settings['extra_js'] : ''),
						'',
						( !empty( $learn_menu_settings['video_title'] ) ? $learn_menu_settings['video_title'] : '')

					);					

				}


		}


		// for any exts to hook into :)
		do_action('zerobscrm-subtop-menu');

	}

	/**
	 * Sets slug values
	 */
	private function set_slugs() {

		global $zbs;

		// retrieve slug
		$slug = $this->get_slug();

		// set if legitimate
		if ( $this->slug_has_learn_content( $slug ) ){

			// store the slug
			$this->slug = $slug;

		} else {

			// error here? :thinking-face:

		}

		// retrieve override slug
		$this->override_slug = $this->get_override_slug();

		// Catch override slug situations
		switch ( $this->override_slug ){

			case $zbs->slugs['zbs-new-user']:
				$this->slug = 'teamadd';
				break;

			case $zbs->slugs['zbs-edit-user']:
				$this->slug = 'teamedit';
				break;

		}
		
	}

	/**
	 * Retrieve slug
	 */
	private function get_slug() {
			
		global $zbs;

		#} GET the page slug..
		$slug = ''; if (isset($_GET['page'])) $slug = sanitize_text_field($_GET['page']);

		// HERE we set pageKey to be slug (lazy global)
		// this is used for screenoptions, so will require you to set it wherever you want to use them (see userScreenOptions in core.php)
		// must be exposed via zeroBS_outputScreenOptions :)
		// note: for some 'sub pages' e.g. add-edit TYPE - this'll be appended to by functions below/above this level.
		// ... so if this is just 'root' we can override it, otherwise, don't (default)
		if ($zbs->pageKey == 'root') {
			$zbs->pageKey = $slug;
		}

		// Specific page checks
		// There are instances where page checks override passed slug 
		// because they're a bit more complex logic than a slug-check
		// (as adapted from previous setup)

		// if slug is a $zbs->slug value, use the key
		// e.g. translates `zerobscrm-dash` into `dash`
		$core_slug_key = array_search( $slug, $zbs->slugs );
		if ( !empty( $core_slug_key ) ){
			$slug = $core_slug_key;
		}

		// Add edit generic
		if ( $slug == $zbs->slugs['addedit'] || $slug == 'addedit' ){

			// if we have action, switch :)
			if ( isset( $_GET['action'] ) ){

				if ( $_GET['action'] != 'edit' && $_GET['action'] != 'delete' ){

					if ( isset( $_GET['zbstype'] ) ){

						$action = sanitize_text_field( $_GET['zbstype'] );

						switch ($action){

							case 'contact':
								$slug = 'viewcontact';
								break;

							case 'company':
								$slug = 'viewcompany';
								break;

							case 'segment':
								$slug = 'viewsegment';
								break;


							default:
								// no type
								// can default to contact. if no 'type' it'll be contact :)
								$slug = 'viewcontact';
								break;
						}

					} else {
						
						// can default to contact. if no 'type' it'll be contact :)
						$slug = 'viewcontact';

					}

				}

			} else {

				$slug = 'viewcontact';

			} 

		}

		// Contacts
		if ( zeroBSCRM_is_customer_new_page() ){
			$slug = 'newedit';
		} elseif ( zeroBSCRM_is_customer_edit_page() ){
			$slug = 'contactedit';
		} 
		if ( zeroBSCRM_is_customertags_page() ){
			$slug = 'contacttags';
		}

		// Segments
		if ( zeroBSCRM_is_segment_new_page() || zeroBSCRM_is_segment_new_page() ){
			$slug = 'segmentedit';
		} 

		// Companies
		if ( zeroBSCRM_is_company_new_page() ){
			$slug = 'companynew';
		} elseif ( zeroBSCRM_is_company_edit_page() ){
			$slug = 'companyedit';
		}
		if ( zeroBSCRM_is_companytags_page() ){
			$slug = 'companytags';
		}

		// Quotes
		if ( zeroBSCRM_is_quo_new_page() ){
			$slug = 'quotenew';
		} elseif ( zeroBSCRM_is_quo_edit_page() ){
			$slug = 'quoteedit';
		}
		if ( zeroBSCRM_is_quotetags_page() ){
			$slug = 'quotetags';
		}

		// Quote Templates
		if ( zeroBSCRM_is_quotetemplate_new_page() ){
			$slug = 'quotetemplatenew';
		} elseif ( zeroBSCRM_is_quotetemplate_edit_page() ){
			$slug = 'quotetemplateedit';
		}

		// Invoices
		if ( zeroBSCRM_is_invoice_new_page() ){
			$slug = 'invoicenew';
		} elseif ( zeroBSCRM_is_invoice_edit_page() ){
			$slug = 'invoiceedit';
		}
		if ( zeroBSCRM_is_invoicetags_page() ){
			$slug = 'invoicetags';
		}

		// Transactions
		if ( zeroBSCRM_is_transaction_new_page() ){
			$slug = 'transnew';
		} elseif ( zeroBSCRM_is_transaction_edit_page() ){
			$slug = 'transedit';
		}
		if ( zeroBSCRM_is_transactiontags_page() ){
			$slug = 'transactiontags';
		}

		// Events
		if ( zeroBSCRM_is_task_new_page() ){
			$slug = 'tasknew';
		} elseif ( zeroBSCRM_is_task_edit_page() ){
			$slug = 'taskedit';
		}

		// Forms
		if ( zeroBSCRM_is_form_new_page() ) {
			$slug = 'formnew';
		} elseif ( zeroBSCRM_is_form_edit_page() ) {
			$slug = 'editform';
		}

		// profile page
		if (zeroBSCRM_is_profile_page()){
			$slug = 'profile';
		}

		// generic delete page
		if (zeroBSCRM_is_delete_page()){
			$slug = 'delete';
		}
			
		return $slug;

	}

	/**
	 * Retrieve override slug
	 */
	private function get_override_slug() {


		#} CUSTOM slugs to affect behavior of standard WP pages
		$override_slug = ''; 
		if (isset($_GET['zbsslug'])) {
			$override_slug = sanitize_text_field($_GET['zbsslug']);
		}

		return $override_slug;

	}

	/**
	 * Verification of a slug
	 *
	 * @param string $slug                     Learn menu slug
	 */
	public function slug_has_learn_content( $slug ) {
		
		if ( !empty( $slug ) && $this->get_content( $slug ) ){

			return true;

		}

		return false;

	}


	/**
	 * Render generic learn menu by parameters
	 * 	Noting here that this is a drop-in replacement for `zeroBS_genericLearnMenu()`, 
	 *	so some of the params are somewhat unnecessary, but have been kept in for parity
	 *
	 * @param string - $page_title: the current page title
	 * @param string - $add_new: a string to append in the 'add new x' area of learn menu (e.g. "Add new contact" button)
	 * @param string - $filter_str: a string to append in the 'filter' area of learn menu (e.g. "Filtered by tag x" on a list view)
	 * @param bool   - $show_learn: whether to show the learn button or not
	 * @param string - $learn_title: the learn box title
	 * @param string - $learn_content: the learn content html
	 * @param string - $learn_more_url: the learn more link url
	 * @param string - $learn_image_url: the learn image url
	 * @param string - $learn_video_url: the learn video url
	 * @param string - $extra_js: any extra JS to output
	 * @param string - $popup_extra_css: any extra css styles to add to the popup element
	 * @param string - $learn_video_title: if {$learn_video_url} specify a video title here [Newly added since original `zeroBS_genericLearnMenu()`]
	 */
	public function render_generic_learn_menu(

		$page_title = '',
		$add_new = '',
		$filter_str = '',
		$show_learn = true,
		$learn_title = '',
		$learn_content = '',
		$learn_more_url = '',
		$learn_image_url = '',
		$learn_video_url = '',
		$extra_js = '',
		$popup_extra_css = '',
		$learn_video_title = '',
		$icon_class = ''
	
	) {

		global $zbs;

		// WL users don't see learn:
		if ( zeroBSCRM_isWL() ) {
			$show_learn = false;
		}

		// js to enact learn / any custom js
		?><script type="text/javascript">
			jQuery(function($){
				<?php if ( $show_learn ) { ?>
					jQuery('.learn').popup({
						inline: false,
						on:'click',
						lastResort: 'bottom right',
					});
				<?php } ?>
				jQuery('.jpcrm-learn-popup-close').on('click',function(){
					jQuery('.learn').popup('hide');
				});
				<?php echo $extra_js . "\n"; ?>
			});
			</script>
			<style>
				.wp-heading-inline, .page-title-action, #screen-meta, #screen-options-link-wrap{
					display:none !important;
				}
				.wp-editor-wrap, .wp-switch-editor {
					position: relative;
					z-index: 1;
				}
			</style>
	    <div id="zbs-admin-top-bar" style="margin-bottom:-20px;">
	      <div id="zbs-list-top-bar">
	          <div class="zbs-white"><span class="jpcrm-learn-page-title"><?php
	          // output icon class if passed
	          if ( !empty( $icon_class ) ){
	          	echo '<i class="' . esc_attr( $icon_class ) . ' icon"></i>';
	          }

	          // output title
	          echo esc_html( $page_title ); 
	          ?></span><?php 
	          if ( !empty( $add_new ) ) {
	          	echo ' ' . $add_new;
	          } ?>
	          	<?php if ($show_learn){ 

	          		// show sidebar?
	          		$sidebar = false;
	          		if (
	          				// got learn video
	          				!empty( $learn_video_url )
	          				||
	          				( 
	          					// got learn image and link
	          					!empty( $learn_image_url ) 
	          					&& 
	          					!empty( $learn_more_url ) 
	          				) 
	          			){
	          				$sidebar = true;
	          			} ?>
					<div class="ui button brown tiny learn" id="learn"><i class="fa fa-graduation-cap" aria-hidden="true"></i> <?php esc_html_e( "Learn", 'zero-bs-crm' ); ?></div>
					<div class="ui special popup top left transition hidden" id="learn-pop" style="<?php echo esc_attr( $popup_extra_css ); ?>">
						<div class="jpcrm-learn-popup-close"></div>						
						<div class="jpcrm-learn-container ui grid">
							<div class="jpcrm-learn-content <?php

								// if sidebar, restrict width :)
								if ( $sidebar ){
									echo 'ten';
								} else {
									echo 'sixteen'; // basically 100%
								}

							?> wide column">
								<h3 class="learn-h3"><?php echo esc_html( $learn_title ); ?></h3>
								<div class="content">
									<?php 

									// content
									echo $learn_content; 

									// learn more link
									if ( !empty( $learn_more_url ) ){
										echo '<br/><a href="' . esc_url( $learn_more_url ) . '" target="_blank" class="learn-more-link">' . esc_html__( "Learn More", 'zero-bs-crm' ) . '</a>';
									} ?>
								</div>
							</div>
							<?php // sidebar if image/video
							if ( $sidebar ){ ?>
							<div class="jpcrm-learn-sidebar six wide column">
								<div class="sidebar-content">
								<?php

									if ( !empty( $learn_video_url ) ){

										$video_thumbnail_url = jpcrm_youtube_url_to_thumbnail_url( $learn_video_url );
									
										?>
										<div class="jpcrm-learn-popup-video">
											<?php if ( !empty( $video_thumbnail_url ) ){ ?>
											<a href="<?php echo esc_url( $learn_video_url ); ?>" target="_blank"><img src="<?php echo esc_url( $video_thumbnail_url ); ?>" alt="<?php echo esc_attr( $learn_video_title ); ?>" class="jpcrm-video-thumbnail" /></a>
											<?php } ?>
						                    <br>
						                    <?php 

						                    	// show title if present
						                    	if ( !empty( $learn_video_title ) ){ 
						                    		?><a href="<?php echo esc_url( $learn_video_url ); ?>" target="_blank"><?php echo esc_html( $learn_video_title ); ?></a><?php
						                		}

							                ?><div class="jpcrm-learn-popup-video-cta">
							                	<a href="<?php echo esc_url( $zbs->urls['youtube_intro_playlist'] ); ?>" target="_blank"><img src="<?php echo esc_url( ZEROBSCRM_URL ); ?>i/first-use-dash-learn-video-ico.png" alt="<?php esc_attr_e( "View More on YouTube", 'zero-bs-crm' ); ?>" /> <?php esc_html_e( "View More on YouTube", 'zero-bs-crm' ); ?></a>
							                </div>

						                </div><?php


									} elseif ( !empty( $learn_image_url ) && !empty( $learn_more_url ) ){

										?>
										<div class="jpcrm-learn-popup-image">
											<a href="<?php echo esc_url( $learn_more_url ); ?>" target="_blank"><img src="<?php echo esc_url( $learn_image_url ); ?>" alt="<?php echo esc_attr( $learn_title ); ?>" class="jpcrm-learn-image" /></a>
											<?php 

						                    	// show title if present
						                    	if ( !empty( $learn_title ) ){ 
						                    		?><br><a href="<?php echo esc_url( $learn_more_url ); ?>" target="_blank"><?php echo esc_html( $learn_title ); ?></a><?php
						                		}

							                ?>
						                    <div class="jpcrm-learn-popup-image-cta">
							                	<a href="<?php echo esc_url( $learn_more_url ); ?>" target="_blank"><div class="jpcrm-learn-popup-external-link"></div> <?php esc_html_e( "Read more", 'zero-bs-crm' ); ?></a>
							                </div>
						                </div><?php

									}

								?>
								</div>
							</div>
							<?php } ?>
	              		</div>
	            	</div>
	            <?php } ?>
	            <?php if ( !empty( $filter_str ) ) {
	            	echo $filter_str;
	            } ?>
	          </div>
	        </div>
	    </div><?php

	}
	/**
	 * Apply filters to a learn menus content
	 *
	 * @param array $learn_menu_array             A learn menu content array
	 */
	public function apply_filters_to_content( $slug, $learn_menu_array ) {

		if ( !empty( $slug ) && is_array( $learn_menu_array ) ){

			// legacy content filtering, not certain where this is used.
			if ( isset( $learn_menu_array['content'] ) ){

				// filter
				$learn_menu_array['content'] = apply_filters( 'zbs_learn_' . $slug . '_content', $learn_menu_array['content'] );

			}

		}

		return $learn_menu_array;

	}

	/**
	 * Retrieve learn menu content
	 *
	 * @param string $slug                     Learn menu slug
	 */
	private function get_content( $slug ) {

		global $zbs;

		// retrieve full list
		$learn_menu_content = $this->get_all_content();

		// check if available
		if ( isset ( $learn_menu_content[ $slug ] ) ){


			// defaults, previously declared in `zeroBS_generateLearnLinks()`
			if ( empty( $learn_menu_content[ $slug ]['url'] ) ){

				$learn_menu_content[ $slug ]['url'] = $zbs->urls['docs'];

			}
			if ( empty( $learn_menu_content[ $slug ]['img'] ) ){

				$learn_menu_content[ $slug ]['img'] = 'learn-extensions-list.png';

			}
			if ( empty( $learn_menu_content[ $slug ]['add_new'] ) ){

				$learn_menu_content[ $slug ]['add_new'] = '';

			}

			// return filtered content
			return $this->apply_filters_to_content( $slug, $learn_menu_content[ $slug ] );

		}
		
		return false;

	}

	/**
	 * Retrieve learn menu ['content']
	 * (Wrapper for assisting legacty function calls in `jpcrm-learn-menu-legacy-functions.php`)
	 * Replaces `zeroBS_generateLearnContent()`
	 *
	 * @param string $slug                     Learn menu slug
	 */
	public function get_content_body( $slug ) {

		$content = $this->get_content( $slug );

		if ( empty( $content ) ) {
			return false;
		}

		return $content['content'];

	}

	/**
	 * Retrieve learn menu urls
	 * (Wrapper for assisting legacty function calls in `jpcrm-learn-menu-legacy-functions.php`)
	 * Replaces `zeroBS_generateLearnLinks()`
	 *
	 * @param string $slug                     Learn menu slug
	 */
	public function get_content_urls( $slug ) {

		$content_urls = array(
			'learn' => '',
			'img'   => '',
			'vid'   => '',
		);

		$content = $this->get_content( $slug );

		if ( !empty( $content ) ) {
			$content_urls['learn'] = $content['url'];
			$content_urls['img']   = $this->get_image_url( $content['img'] );
			$content_urls['vid']   = $content['video'];
		}

		return $content_urls;

	}

	/**
	 * Retrieve learn menu image url
	 * (Seeks to return an absolute url from either a local image filename or a full url)
	 *
	 * @param string $img_url                  Image url
	 */
	public function get_image_url( $img_url ) {

		if ( !empty( $img_url ) ){

			// local image?
			if ( !strpos( $img_url , '/' ) ){

				// as at 4.10.0 these images need re-generating, so for now,
				// blocking the display of these here
				// to see examples download ~v4.0 and see i/learn/*
				//return ZEROBSCRM_URL . 'i/learn/' . $img_url;
				return '';

			} else {

				// is probably an absolute url
				return $img_url;

			}

		}

		return '';

	}

	/**
	 * Retrieve learn menu content (using $this->slug)
	 *  This replaces a previous collection of 4~ global arrays
	 *  The array key used should either match a $zbs->slugs[] key, or be otherwise caught
	 *  by the special conditions in `get_slugs()` and `set_slugs()`
	 *
	 *  The aim here is for this array to be the one source of truth for learn menus	
	 */
	private function get_all_content() {

		global $zbs;

		// learn content
		$learn_menu_array = array(

			'dash' => array(
				'title'           => __( "Dashboard", 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/dashboard/',
				'img'             => 'learn-dashboard.png',
				'video'           => false,
				'content'         => '<p>' . __( 'This your CRM dashboard. It shows you at a glance some key data from your CRM activity.', 'zero-bs-crm' ) . '</p><p>' . __( '<b>Sales Funnel</b> shows how effective you are at converting leads to customers.', 'zero-bs-crm' ) . '</p><p>' . __( '<b>Revenue Chart</b> shows you the overview of your transactions for the past few months.', 'zero-bs-crm' ) . '</p>',
				'output_function' => 'jpcrm_dashboard_learn_menu',
			),
			'managecontacts' => array(
				'title'           => __('Contacts','zero-bs-crm'),
				'url'             => 'https://jetpackcrm.com/feature/contacts/',
				'img'             => 'learn-contact-list.png',
				'video'           => false,
				'content'         => "<p>" . __( "Here is your contact list. It is central to your CRM. You can manage your contacts here and apply quick filters.", 'zero-bs-crm' ) . "</p><p>" . __( "Transactions Total is how much your contact has spent with you (for approved statuses). You can choose which transaction types should be included in your settings.", 'zero-bs-crm' ) . "</p><p>" . __( "Total Value is the total value including other transaction statuses (pending, on-hold, etc) as well as the value of any unpaid invoices.", 'zero-bs-crm' ) . "</p>",
				'output_function' => 'jpcrm_contactlist_learn_menu',
			),
			'viewcontact' => array(
				'title'           => __('Viewing Contact','zero-bs-crm'),
				'url'             => 'https://jetpackcrm.com/feature/contacts/',
				'img'             => 'learn-edit-contact.png',
				'video'           => false,
				'content'         => "<p>" . __( "View Contact gives you an easy way to see your contact information in one place.", 'zero-bs-crm' ) . "</p>",
				'output_function' => 'jpcrm_viewcontact_learn_menu',
			),
			'contactnew' => array(
				'title'   => __('Add Contact','zero-bs-crm'),
				'url'     => 'https://jetpackcrm.com/feature/contacts/',
				'img'     => 'learn-import-contacts.png',
				'video'   => false,
				'content' => "<p>" . __( "There are plenty of ways which you can add contacts to your CRM", 'zero-bs-crm' ) . "</p><div class=\"ui divider\"></div><p>" . __( "<strong>Adding them manually</strong> You can add contacts manually. This takes time.", 'zero-bs-crm' ) . "</p><p>" . __( "<strong>Import from CSV</strong> You can import via a CSV file.", 'zero-bs-crm' ) . "</p><p>" . __( "<strong>Import using our extensions</strong> such as PayPal Sync, Stripe Sync or WooSync which will help get your contacts into your CRM automatically.", 'zero-bs-crm' ) . "</p>",
			),
			'contactedit' => array(
				'title'           => __('Edit Contact','zero-bs-crm'),
				'url'             => 'https://jetpackcrm.com/feature/contacts/',
				'img'             => 'learn-edit-contact.png',
				'video'           => false,
				'content'         => "<p>" . __( "Keep your contacts' details up to date.", 'zero-bs-crm' ) . "</p><p>" . __( "<strong>Key details</strong> should be kept up to date here. Your contacts email, their address, plus any additional information you want to hold on them.", 'zero-bs-crm' ) . "</p><p>" . sprintf( __( 'If the available fields below are not enough, you can add custom fields to your contacts record through the <a href="%s">custom field settings</a>', 'zero-bs-crm' ), admin_url( 'admin.php?page=' . $zbs->slugs['settings'] . '&tab=customfields' ) ) . "</p>",
				'output_function' => 'jpcrm_contactedit_learn_menu2',
			),
			'contacttags' => array(
				'title'       => __('Contact Tags','zero-bs-crm'),
				'url'         => 'https://jetpackcrm.com/feature/tags/',
				'img'         => 'learn-contact-tags.png',
				'video'       => 'https://www.youtube.com/watch?v=KwGh-Br_exc',
				'video_title' => __( "Introduction to Tags and Segments", 'zero-bs-crm' ),
				'content'     => "<p>" . __( "Tags are a powerful part of Jetpack CRM. You can tag your contacts and then filter or send emails based on those tags.", 'zero-bs-crm' ) . "</p><p>" . __( "You can add as many tags as you like. Use them to keep track of important things with your contact. For example, contact has agreed to receive marketing material (or contact has opted out of marketing).", 'zero-bs-crm' ) . "</p>",
			),
			'newedit' => array(
				'title'           => __("New Contact","zero-bs-crm"),
				'url'             => 'https://jetpackcrm.com/feature/contacts/',
				'img'             => 'learn-new-contact.png',
				'video'           => false,
				'content'         => "<p>" . __( "There are plenty of ways which you can add contacts to your CRM", 'zero-bs-crm' ) . "</p><div class=\"ui divider\"></div><p>" . __( "<strong>Adding them manually</strong> You can add contacts manually. This takes time.", 'zero-bs-crm' ) . "</p><p>" . __( "<strong>Import from CSV</strong> You can import via a CSV file.", 'zero-bs-crm' ) . "</p><p>" . __( "<strong>Import using our extensions</strong> such as PayPal Sync, Stripe Sync or WooSync which will help get your contacts into your CRM automatically.", 'zero-bs-crm' ) . "</p>",
				'output_function' => 'jpcrm_contactedit_learn_menu2',
			),
			'companytags' => array(
				'title'       => __(jpcrm_label_company().' Tags','zero-bs-crm'),
				'url'         => 'https://jetpackcrm.com/feature/b2b-mode/',
				'img'         => 'learn-company-tags.png',
				'video'       => 'https://www.youtube.com/watch?v=KwGh-Br_exc',
				'video_title' => __( "Introduction to Tags and Segments", 'zero-bs-crm' ),
				'content'     => "<p>" . __( "" . jpcrm_label_company() . " Tags let you add tags to your " . jpcrm_label_company( true ) . " for easier filtering in the " . jpcrm_label_company() . " List", 'zero-bs-crm' ) . "</p><p>" . __( "Tags help you organise your " . jpcrm_label_company() . " easier, expanding on just searching or filtering by status.", 'zero-bs-crm' ) . "</p>",
			),
			'sendmail' => array(
				'title'   => __('Send Email','zero-bs-crm'),
				'url'     => 'https://jetpackcrm.com/feature/system-emails/',
				'img'     => 'learn-send-email.png',
				'video'   => false,
				'content' => "<p>" . __( "Send your contact a single email from this page.", 'zero-bs-crm' ) . "</p><p>" . __( "<strong>Emails</strong> sent from here are logged against your contact in their Activity log", 'zero-bs-crm' ) . "</p><p><img style=\"max-width:90%\" src=\"" . ZEROBSCRM_URL . 'i/learn/learn-email-activity-log.png' . "\" alt=\"\" /></p><p>" . __( "Emails are sent using your chosen method of delivery (wp_mail, SMTP).", 'zero-bs-crm' ) . "</p>",
			),
			'viewcompany' => array(
				'title'           => __( "Viewing " . jpcrm_label_company(), 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/b2b-mode/',
				'img'             => 'learn-new-company.png',
				'video'           => false,
				'content'         => "<p>" . __( "View " . jpcrm_label_company() . " gives you an overview of the key " . jpcrm_label_company() . " information. Including the ability to see which contacts work at the " . jpcrm_label_company() . " and click into viewing the contact information easily.", 'zero-bs-crm' ) . "</p>",
				'output_function' => 'jpcrm_viewcompany_learn_menu',
			),
			'newcompany' => array(
				'title'   => __( "New " . jpcrm_label_company(), 'zero-bs-crm' ),
				'url'     => 'https://jetpackcrm.com/feature/b2b-mode/',
				'img'     => 'learn-new-company.png',
				'video'   => false,
				'content' => "<p>" . __( "Add a New Compay to your CRM. When adding a " . jpcrm_label_company() . " you can also choose which contacts to assign to the " . jpcrm_label_company() . ".", 'zero-bs-crm' ) . "</p><p>" . __( "Managing large clients, this gives you an easy way to zero in on contacts at a particular company.", 'zero-bs-crm' ) . "</p>",
			),
			'manageformscrm' => array(
				'title'           => __( "Forms", "zero-bs-crm" ),
				'url'             => 'https://jetpackcrm.com/feature/forms/',
				'img'             => 'learn-forms.png',
				'video'           => 'https://www.youtube.com/watch?v=mBPjV1KUb-w',
				'video_title'     => __( "All about Forms", 'zero-bs-crm' ),
				'content'         => "<p>" . __( "We offer built in Lead generation forms. Using these forms you can see which form is drivng the most growth in your list", 'zero-bs-crm' ) . "</p><p>" . __( "If you do not want to use the built in Forms, you can use any of our Form connector extensions, such as Gravity Forms, or Contact Form 7.", 'zero-bs-crm' ) . "</p>",
				'output_function' => 'jpcrm_formlist_learn_menu',
			),
			'editform' => array(
				'title'       => __( "Edit Form", "zero-bs-crm" ),
				'url'         => 'https://jetpackcrm.com/feature/forms/',
				'img'         => 'learn-forms.png',
				'content'     => '<p></p>',
				'video'       => 'https://www.youtube.com/watch?v=mBPjV1KUb-w',
				'video_title' => __( "All about Forms", 'zero-bs-crm' ),
				'add_new'     => ' <a href="' . jpcrm_esc_link( 'create', -1, 'zerobs_form', false ) . '" class="button ui blue tiny zbs-add-new">' . __( 'Add New',"zero-bs-crm") . '</a>'
			),
			'formnew' => array(
				'title'       => __( "New Form", "zero-bs-crm" ),
				'url'         => 'https://jetpackcrm.com/feature/forms/',
				'img'         => 'learn-forms.png',
				'video'       => 'https://www.youtube.com/watch?v=mBPjV1KUb-w',
				'video_title' => __( "All about Forms", 'zero-bs-crm' ),
				'content'     => "<p>" . __( "Add a New Form and choose your Form Type. Form Types are great to choose which type of layout you want on your site.", 'zero-bs-crm' ) . "</p><p>" . __( "Each form tracks the number of views it has had compared to how many completions.", 'zero-bs-crm' ) . "</p><p>" . __( "The more information you ask for on a form, the lower the completion rate. Only ask for what you need and keep your contact list growing fast", 'zero-bs-crm' ) . "</p>",
			),
			'manage-events' => array(
				'title'           => __( "Task Calendar", "zero-bs-crm" ),
				'url'             => 'https://jetpackcrm.com/feature/tasks/',
				'img'             => 'learn-task-calendar.png',
				'video'           => false,
				'content'         => "<p>" . __( "Tasks are our internal word for managing things to do related to contacts.", 'zero-bs-crm' ) . "</p><p>" . __( "They are not intended to be a full appointment system operatable from the front end. They are useful to schedule short appointments and if using Client Portal Pro your clients can add them to their Calendar.", 'zero-bs-crm' ) . "</p>",
				'output_function' => 'jpcrm_tasklist_learn_menu',
			),
			'manage-events-list' => array(
				'title'           => __( "Task List", "zero-bs-crm" ),
				'url'             => 'https://jetpackcrm.com/feature/tasks/',
				'img'             => 'learn-task-calendar.png',
				'video'           => false,
				'content'         => "<p>" . __( "Tasks are our internal word for managing things to do related to contacts.", 'zero-bs-crm' ) . "</p><p>" . __( "They are not intended to be a full appointment system operatable from the front end. They are useful to schedule short appointments and if using Client Portal Pro your clients can add them to their Calendar.", 'zero-bs-crm' ) . "</p>",
				'output_function' => 'jpcrm_tasklistview_learn_menu',
			),
			'taskedit' => array(
				'title'           => __( "Edit Task", "zero-bs-crm" ),
				'url'             => 'https://jetpackcrm.com/feature/tasks/',
				'img'             => 'learn-task-calendar.png',
				'video'           => false,
				'content'         => "<p>" . __( "Tasks are our internal word for managing things to do related to contacts.", 'zero-bs-crm' ) . "</p><p>" . __( "They are not intended to be a full appointment system operatable from the front end. They are useful to schedule short appointments and if using Client Portal Pro your clients can add them to their Calendar.", 'zero-bs-crm' ) . "</p>",
				'output_function' => 'jpcrm_taskedit_learn_menu',
			),
			'tasknew' => array(
				'title'           => __( "New Task", "zero-bs-crm" ),
				'url'             => 'https://jetpackcrm.com/feature/tasks/',
				'img'             => 'learn-task-calendar.png',
				'video'           => false,
				'content'         => "<p>" . __( "Tasks are our internal word for managing things to do related to contacts.", 'zero-bs-crm' ) . "</p><p>" . __( "They are not intended to be a full appointment system operatable from the front end. They are useful to schedule short appointments and if using Client Portal Pro your clients can add them to their Calendar.", 'zero-bs-crm' ) . "</p>",
				'output_function' => 'jpcrm_tasknew_learn_menu',
			),
			'managequotes' => array(
				'title'           => __( "Manage Quotes", 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/quotes/',
				'img'             => 'learn-quote-list.png',
				'video'           => false,
				'content'         => "<p>" . __( "Here is your list of Quotes. You can see which quotes you have issued in the past.", 'zero-bs-crm' ) . "</p><p>" . __( "You can also change the status of quotes in Bulk Actions (tick a quote row, then scroll to the bottom for Bulk Actions)", 'zero-bs-crm' ) . "</p>",
				'output_function' => 'jpcrm_quotelist_learn_menu',
			),
			'quotenew' => array(
				'title'   => __( "New Quote", 'zero-bs-crm' ),
				'url'     => 'https://jetpackcrm.com/feature/quotes/',
				'img'     => 'learn-new-quote.png',
				'video'   => false,
				'content' => '<p>' . __( 'Add a new Quote here. When creating a Quote you fill in the key details such as contact name and quote value, you can then choose which template it should populate.', 'zero-bs-crm' ) . '</p><p>' . __( 'Templates automatically fill in the contact fields and save you time if you issue similar quotes regularly.', 'zero-bs-crm' ) . '</p>',
				'add_new' => '<div id="zbs-quote-learn-nav"></div>'
			),
			'quoteedit' => array(
				'title'   => __( "Edit Quote", 'zero-bs-crm' ),
				'url'     => 'https://jetpackcrm.com/feature/quotes/',
				'img'     => 'learn-new-quote.png',
				'video'   => false,
				'content' => '<p>' . __( 'When creating a Quote you fill in the key details such as contact name and quote value, you can then choose which template it should populate.', 'zero-bs-crm' ) . '</p><p>' . __( 'Templates automatically fill in the contact fields and save you time if you issue similar quotes regularly.', 'zero-bs-crm' ) . '</p>',
				'add_new' => '<div id="zbs-quote-learn-nav"></div>  <a href="' . jpcrm_esc_link( 'create', -1, ZBS_TYPE_QUOTE, false ) . '" class="button ui blue tiny zbs-add-new">' . __('Add New',"zero-bs-crm") . '</a>'
			),
			'quotetags' => array(
				'title'       => __( "Quote Tags", 'zero-bs-crm' ),
				'url'         => 'https://jetpackcrm.com/feature/quotes/',
				'img'         => 'learn-quotes-tags.png',
				'video'       => 'https://www.youtube.com/watch?v=KwGh-Br_exc',
				'video_title' => __( "Introduction to Tags and Segments", 'zero-bs-crm' ),
				'content'     => "<p>" . __( "Quote tags can be used to filter your quote list.", 'zero-bs-crm' ) . "</p>",
			),
			'transactiontags' => array(
				'title'       => __( "Transaction Tags", 'zero-bs-crm' ),
				'url'         => 'https://jetpackcrm.com/feature/transactions/',
				'img'         => 'learn-trans-tags.png',
				'video'       => 'https://www.youtube.com/watch?v=KwGh-Br_exc',
				'video_title' => __( "Introduction to Tags and Segments", 'zero-bs-crm' ),
				'content'     => "<p>" . __( "Transaction tags can be used to filter your transaction list.", 'zero-bs-crm' ) . "</p><p>" . __( "Some of our Sync tools like PayPal Sync or WooSync will automatically tag the transaction with the item name. This left you filter based on product and even feed into tag based filters in the Sales Dashboard extension", 'zero-bs-crm' ) . "</p>",
			),
			'transnew' => array(
				'title'   => __( "New Transaction", 'zero-bs-crm' ),
				'url'     => 'https://jetpackcrm.com/feature/transactions/',
				'img'     => 'learn-trans.png',
				'video'   => false,
				'content' => "<p>" . __( "Adding a new Transaction is easy. You should assign it to a contact and then optionally to an invoice.", 'zero-bs-crm' ) . "</p><p>" . __( "Assigned transactions are deducted from the balance of an invoice and feed into the total value for the contact", 'zero-bs-crm' ) . "</p><p>" . __( "Be sure to define your transaction statuses to include in the total via the Transactions settings tab in settings.", 'zero-bs-crm' ) . "</p>",
				'add_new' => '<div id="zbs-transaction-learn-nav"></div>'
			),
			'transedit' => array(
				'title'           => __( "Edit Transaction", 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/transactions/',
				'img'             => 'learn-trans.png',
				'video'           => false,
				'content'         => "<p>" . __( "Editing a Transaction is easy. You should assign it to a contact and then optionally to an invoice.", 'zero-bs-crm' ) . "</p><p>" . __( "Assigned transactions are deducted from the balance of an invoice and feed into the total value for the contact", 'zero-bs-crm' ) . "</p><p>" . __( "Be sure to define your transaction statuses to include in the total via the Transactions settings tab in settings.", 'zero-bs-crm' ) . "</p>",
				'output_function' => 'jpcrm_transedit_learn_menu',
			),		  
			'managetransactions' => array(
				'title'           => __( "Transaction List", 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/transactions/',
				'img'             => 'learn-transactions-list.png',
				'video'           => false,
				'content'         => "<p>" . __( "Here is your transactions list. This includes all transactions statuses such as completed, refunded, cancelled, failed. You can manage your transactions and see who has made them.", 'zero-bs-crm' ) . "</p><p>" . __( "Transactions Total is how much your contact has spent with you (for approved statuses). You can choose which transaction types should be included in your settings.", 'zero-bs-crm' ) . "</p><p>" . __( "Total Value is the total value including other transaction statuses (pending, on-hold, etc) as well as the value of any unpaid invoices.", 'zero-bs-crm' ) . "</p>",
				'output_function' => 'jpcrm_translist_learn_menu',
			),
			'quote-templates' => array(
				'title'   => __( "Quote Templates", 'zero-bs-crm' ),
				'url'     => 'https://jetpackcrm.com/feature/quotes/',
				'img'     => 'learn-quote-template.png',
				'video'   => false,
				'content' => '<p>' . __( 'Quote Templates save you time. You can enter placeholders so that when you generate a new Quote using the template the contact fields are automatically populated.', 'zero-bs-crm' ) . '</p>',
				'add_new' => ' <a href="' . jpcrm_esc_link('create',-1,'zerobs_quo_template',false)  . '#free-extensions-tour" class="button ui blue tiny zbs-add-new" id="add-template">' . __('Add Template',"zero-bs-crm") . '</a>'
			),
			'quotetemplatenew' => array(
				'title'   => __( "New Quote Template", 'zero-bs-crm' ),
				'url'     => 'https://jetpackcrm.com/feature/quotes/',
				'img'     => 'learn-quote-templates.png',
				'video'   => false,
				'content' => "<p>" . __( "A Quote Template is where you should populate all the business information when putting together a proposal or quote for your services", 'zero-bs-crm' ) . "</p><p>" . __( "Templates save time meaning in new quotes you can just edit any price information and be up and running in seconds, vs typing out all the details again", 'zero-bs-crm' ) . "</p>",
			),
			'quotetemplateedit' => array(
				'title'   => __( "Edit Quote Template", 'zero-bs-crm' ),
				'url'     => 'https://jetpackcrm.com/feature/quotes/',
				'img'     => 'learn-quote-templates.png',
				'video'   => false,
				'content' => "<p>" . __( "A Quote Template is where you should populate all the business information when putting together a proposal or quote for your services", 'zero-bs-crm' ) . "</p><p>" . __( "Templates save time meaning in new quotes you can just edit any price information and be up and running in seconds, vs typing out all the details again", 'zero-bs-crm' ) . "</p>",
			),
			'manageinvoices' => array(
				'title'           => __( "Manage Invoices", 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/invoices/',
				'img'             => 'learn-invoice-list.png',
				'video'           => false,
				'content'         => "<p>" . __( "Here is your Invoice List. It shows you all your invoices in one place and you can manage the status, download PDF versions and keep everything in one place", 'zero-bs-crm' ) . "</p>",
				'output_function' => 'jpcrm_invoicelist_learn_menu',
			),
			'invoicenew' => array(
				'title'   => __( "New Invoice", 'zero-bs-crm' ),
				'url'     => 'https://jetpackcrm.com/feature/invoices/',
				'img'     => 'learn-new-invoice.png',
				'video'   => false,
				'content' => "<p>" . __( "You're in business to get paid. Having invoices in your CRM is a great way to keep contacts and payments together.", 'zero-bs-crm' ) . "</p><p>" . __( "Do you want to provide PDF invoices to your clients? Simple. Choose the PDF option and download your invoices as PDF.", 'zero-bs-crm' ) . "</p><p>" . __( "The real power of invoicing comes when you allow your invoices to be accessed and paid straight from your client portal using Invoicing Pro.", 'zero-bs-crm' ) . "</p>",
				'add_new' => '<div id="zbs-invoice-learn-nav"></div>'
			),
			'invoiceedit' => array(
				'title'           => __( "Edit Invoice", 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/invoices/',
				'img'             => 'learn-invoice-list.png',
				'video'           => false,
				'content'         => "<p>" . __( "You're in business to get paid. Having invoices in your CRM is a great way to keep contacts and payments together.", 'zero-bs-crm' ) . "</p><p>" . __( "Do you want to provide PDF invoices to your clients? Simple. Choose the PDF option and download your invoices as PDF.", 'zero-bs-crm' ) . "</p><p>" . __( "The real power of invoicing comes when you allow your invoices to be accessed and paid straight from your client portal using Invoicing Pro.", 'zero-bs-crm' ) . "</p>",
				'output_function' => 'jpcrm_invoiceedit_learn_menu',
			),
			'invoicetags' => array(
				'title'       => __( "Invoice Tags", 'zero-bs-crm' ),
				'url'         => 'https://jetpackcrm.com/feature/invoices/',
				'img'         => 'learn-invoices-tags.png',
				'video'       => 'https://www.youtube.com/watch?v=KwGh-Br_exc',
				'video_title' => __( "Introduction to Tags and Segments", 'zero-bs-crm' ),
				'content'     => "<p>" . __( "Invoice tags can be used to filter your invoice list.", 'zero-bs-crm' ) . "</p>",
			),
			'team' => array(
				'title'   => __( "Your Team", 'zero-bs-crm' ),
				'url'     => 'https://jetpackcrm.com/feature/team/',
				'img'     => 'learn-zbs-team.png',
				'video'   => false,
				'content' => "<p>" . __( "Here is your CRM team. You can see what Role your team members have and see when they were last active.", 'zero-bs-crm' ) . "</p>",
			),
			'teamadd' => array(
				'title'   => __( "Add new team member", 'zero-bs-crm' ),
				'url'     => 'https://jetpackcrm.com/feature/team/',
				'img'     => 'learn-zbs-team.png',
				'video'   => false,
				'content' => "<p>" . __( "As your business grows you will want to expand your team.", 'zero-bs-crm' ) . "</p><p>" . __( "Add New Team Membersor search your WordPress users to add them to your team.", 'zero-bs-crm' ) . "</p><p>" . __( "WordPress Administrator level by default has access to everything. You can manage your other user permissions here.", 'zero-bs-crm' ) . "</p>",
			),
			'teamedit' => array(
				'title'   => __( "Edit team member", 'zero-bs-crm' ),
				'url'     => 'https://jetpackcrm.com/feature/team/',
				'img'     => 'learn-zbs-team.png',
				'video'   => false,
				'content' => "<p>" . __( "As your business grows you will want to expand your team.", 'zero-bs-crm' ) . "</p><p>" . __( "Add New Team Membersor search your WordPress users to add them to your team.", 'zero-bs-crm' ) . "</p><p>" . __( "WordPress Administrator level by default has access to everything. You can manage your other user permissions here.", 'zero-bs-crm' ) . "</p>",
			),
			'extensions' => array(
				'title'   => __( "Extend your CRM", 'zero-bs-crm' ),
				'url'     => 'https://jetpackcrm.com/pricing/',
				'img'     => 'learn-extensions-list.png',
				'video'   => false,
				'content' => "<p>" . sprintf( __( "The core of the CRM is free to use, and you can manage your core modules (extensions) <a href=\"%s\">here</a>; this page lets you manage premium extensions.", 'zero-bs-crm' ), admin_url( 'admin.php?page=' . $zbs->slugs['modules'] ) ) . "</p><p>" . __( "<b>Premium Extensions</b> Want all the extensions? Purchase our Entrepeneur's Bundle to get access to them all.", 'zero-bs-crm' ) . "</p>",
			),
			'managecompanies' => array(
				'title'           => __( "Manage " . jpcrm_label_company(true), 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/companies/',
				'img'             => 'learn-company-list.png',
				'video'           => false,
				'content'         => "<p>" . __( "Keep track of important " . jpcrm_label_company() . " level relationships in your CRM", 'zero-bs-crm' ) . "</p><p>" . __( "Managing " . jpcrm_label_company( true ) . " is a way of seeing which contacts work at which " . jpcrm_label_company() . ". If you have three or four contacts who keep in touch with you, it is useful to know which " . jpcrm_label_company() . " they all share in common", 'zero-bs-crm' ) . "</p>",
				'output_function' => 'jpcrm_companylist_learn_menu',
			),
			'companynew' => array(
				'title'   => __( "New " . jpcrm_label_company(true), 'zero-bs-crm' ),
				'url'     => 'https://jetpackcrm.com/feature/companies/',
				'img'     => 'learn-company-list.png',
				'video'   => false,
				'content' => "<p>" . __( "Add a New Compay to your CRM. When adding a " . jpcrm_label_company() . " you can also choose which contacts to assign to the " . jpcrm_label_company() . ".", 'zero-bs-crm' ) . "</p><p>" . __( "Managing large clients, this gives you an easy way to zero in on contacts at a particular company.", 'zero-bs-crm' ) . "</p>",
			),
			'companyedit' => array(
				'title'   => __( "Edit " . jpcrm_label_company(true), 'zero-bs-crm' ),
				'url'     => 'https://jetpackcrm.com/feature/companies/',
				'img'     => 'learn-company-list.png',
				'video'   => false,
				'content' => "<p>" . __( "Editing a Compay in your CRM. When editing a " . jpcrm_label_company() . " you can also choose which contacts to assign to the " . jpcrm_label_company() . ".", 'zero-bs-crm' ) . "</p><p>" . __( "Managing large clients, this gives you an easy way to zero in on contacts at a particular company.", 'zero-bs-crm' ) . "</p>",
			),
			'mail' => array(
				'title'   => __( "Mail Settings", 'zero-bs-crm' ),
				'url'     => 'https://jetpackcrm.com/feature/system-emails/',
				'img'     => 'learn-mail.png',
				'video'   => false,
				'content' => "<p>" . __( "Your Mail settings control the emails that are sent out of your CRM.", 'zero-bs-crm' ) . "</p><p>" . __( "You can choose how you want your email 'From' name to look when single emails are sent and setup various mail delivery options (such as adding your STMP settings).", 'zero-bs-crm' ) . "</p>",
			),
			'maildelivery' => array(
				'title'   => __( "Mail Delivery Options", 'zero-bs-crm' ),
				'url'     => 'https://jetpackcrm.com/feature/mail-delivery/',
				'img'     => 'learn-mail-delivery.png',
				'video'   => false,
				'content' => "<p>" . __( "Mail Delivery options help you improve your CRM email deliverability. If you are running Mail Campaigns or our Mail Templates you may also wish to choose which email account sends the emails (or system emails).", 'zero-bs-crm' ) . "</p><p>" . __( "You could have your new client account emails come from one email and your invoices come from another email", 'zero-bs-crm' ) . "</p>",
			),
			'email-templates' => array(
				'title'           => __( "System Email Templates", 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/system-emails/',
				'img'             => 'learn-mail.png',
				'video'           => false,
				'content'         => "<p>" . __( "Edit your different system email templates.", 'zero-bs-crm' ) . "</p>",
				'output_function' => 'jpcrm_emailtemplates_learn_menu'
			),	
			'recent-emails' => array(
				'title'           => __( "Recent Email Activity", 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/system-emails/',
				'img'             => 'learn-mail.png',
				'video'           => false,
				'content'         => "<p>" . __( "Recent email activity across your CRM email templates.", 'zero-bs-crm' ) . "</p>",
				'output_function' => 'jpcrm_emailtemplates_learn_menu'
			),	
			'template-settings' => array(
				'title'           => __( "Template Settings", 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/system-emails/',
				'img'             => 'learn-mail.png',
				'video'           => false,
				'content'         => "<p>" . __( "Manage your main email template settings.", 'zero-bs-crm' ) . "</p>",
				'output_function' => 'jpcrm_emailtemplates_learn_menu'
			),	  
			'viewsegment' => array(
				'title'           => __( "View Segment", 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/segments/',
				'img'             => 'learn-segment-edit.png',
				'video'           => 'https://www.youtube.com/watch?v=KwGh-Br_exc',
				'video_title'     => __( "Introduction to Tags and Segments", 'zero-bs-crm' ),
				'content'         => "<p>" . __( "Create a segment to partition a group of contacts into a manageable list.", 'zero-bs-crm' ) . "</p><p>" . __( "Perfect for quick filters and links in seamlessly with Mail Campaigns and Automations. Segments are a great way to give you extra list power and save you having to manually group contacts based on multiple tags.", 'zero-bs-crm' ) . "</p>",
				'output_function' => 'jpcrm_segmentedit_learn_menu',
			),
			'segmentedit' => array(
				'title'           => __( "Edit Segment", 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/segments/',
				'img'             => 'learn-segment-edit.png',
				'video'           => 'https://www.youtube.com/watch?v=KwGh-Br_exc',
				'video_title'     => __( "Introduction to Tags and Segments", 'zero-bs-crm' ),
				'content'         => "<p>" . __( "Create a segment to partition a group of contacts into a manageable list.", 'zero-bs-crm' ) . "</p><p>" . __( "Perfect for quick filters and links in seamlessly with Mail Campaigns and Automations. Segments are a great way to give you extra list power and save you having to manually group contacts based on multiple tags.", 'zero-bs-crm' ) . "</p>",
				'output_function' => 'jpcrm_segmentedit_learn_menu',
			),
			'segments' => array(
				'title'           => __( "Segments", 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/segments/',
				'img'             => 'learn-segment-list.png',
				'video'           => 'https://www.youtube.com/watch?v=KwGh-Br_exc',
				'video_title'     => __( "Introduction to Tags and Segments", 'zero-bs-crm' ),
				'content'         => "<p>" . __( "Here is your segment list. This is where you will see any segments you create.", 'zero-bs-crm' ) . "</p><p>" . __( "Segments are a powerful way to split out groups of contacts from your contact list and act on them (e.g. via Mail Campaigns or Automations).", 'zero-bs-crm' ) . "</p>",
				'output_function' => 'jpcrm_segmentlist_learn_menu',
			),
			'notifications' => array(
				'title'           => __( "Notifications", 'zero-bs-crm' ),
				'url'             => 'https://kb.jetpackcrm.com/knowledge-base/jetpack-crm-notifications/',
				'img'             => 'learn-notifications.png',
				'video'           => false,
				'content'         => "<p>" . __( "When you are running your CRM you want to be kept up to date with everything.", 'zero-bs-crm' ) . "</p><p>" . __( "Notifications are here to help keep you notified. Here is where you will see useful messages and updates from us.", 'zero-bs-crm' ) . "</p>",
				'output_function' => 'jpcrm_notifications_learn_menu',
			),
			'exportcontact' => array(
				'title'   => __( "Export Contacts", 'zero-bs-crm' ),
				'url'     => 'https://jetpackcrm.com/feature/contacts/',
				'img'     => 'learn-export-contacts.png',
				'video'   => false,
				'content' => "<p>" . __( "You can export your contact information here to do additional analysis outside of Jetpack CRM", 'zero-bs-crm' ) . "</p><p>" . __( "Export and use in an Excel File, or export to import into other tools you use for your business needs", 'zero-bs-crm' ) . "</p>",
				'add_new' => '<a href="' . admin_url( 'admin.php?page=' . $zbs->slugs['export-tools'] . '&zbswhat=contacts' ) . '" class="button ui blue tiny zbs-add-new">' . __( 'Export Other Types',"zero-bs-crm") . '</a>'
			),
			'export-tools' => array(
				'title'   => __( "Export Tools", 'zero-bs-crm' ),
				'url'     => 'https://kb.jetpackcrm.com/knowledge-base/how-to-export-company-data/',
				'img'     => 'learn-export-tools.png',
				'video'   => false,
				'content' => "<p>" . __( "Here is the central area for exporting information from your CRM.", 'zero-bs-crm' ) . "</p><p>" . __( "Export to keep backups offline. Export to do additional analysis and keep your CRM data in tact.", 'zero-bs-crm' ) . "</p>",
			),
			'datatools' => array(
				'title'       => __( "Data Tools", 'zero-bs-crm' ),
				'url'         => 'https://kb.jetpackcrm.com/knowledge-base/how-to-export-company-data/',
				'img'         => 'learn-data-tools.png',
				'video'       => 'https://www.youtube.com/watch?v=2KDy-a2wC8w',
				'video_title' => __( "How to import contacts using CSV files", 'zero-bs-crm' ),
				'content'     => "<p>" . __( "Data Tools is the area where you can Bulk Delete contacts or Import from CSV.", 'zero-bs-crm' ) . "</p><p>" . __( "You can also Export various types of CRM data, such as Contacts and Quotes and Invoices.", 'zero-bs-crm' ) . "</p>",
			),
			'connect' => array(
				'title'   => __( "Connect", 'zero-bs-crm' ),
				'url'     => 'https://kb.jetpackcrm.com/knowledge-base/how-do-i-update-an-extension/',
				'img'     => 'learn-extensions-list.png',
				'video'   => false,
				'content' => "<p></p>",
			),
			'systemstatus' => array(
				'title'   => __( "System Assistant", 'zero-bs-crm' ),
				'img'     => 'learn-system-settings.png',
				'video'   => false,
				'content' => "<p>" . __( "This page is your CRM backend hub. You can use the System Assistant to guide your setup, or the System Status tab lets you see the various server and software settings which exist \"behind the scenes\" in your Jetpack CRM install.", 'zero-bs-crm' ) . "</p><p>" . __( "You will not need to change anything here, but our support team might ask you to load this page to retrieve a status flag.", 'zero-bs-crm' ) . "</p>",
			),
			'modules' => array(
				'title'       => __( "Core Modules", 'zero-bs-crm' ),
				'img'         => 'learn-core-modules.png',
				'video'       => 'https://www.youtube.com/watch?v=j9RsXPcgeIo',
				'video_title' => __( "Introduction to core CRM modules", 'zero-bs-crm' ),
				'content'     => "<p>" . sprintf( __( "From this page you can manage which core modules are enabled, it gives you ultimate control of the areas of your CRM that you'd like to use or hide. Modules are kind of like bundled CRM extensions and vary from object-areas like Invoices to functionality like adding PDF generation.<br><br>If you'd like to manage your premium extensions, you can do that <a href=\"%s\">here</a>", 'zero-bs-crm' ), admin_url( 'admin.php?page=' . $zbs->slugs['extensions'] ) ) . "</p>",
			),
			'export' => array(
				'title'   => __( "Export", 'zero-bs-crm' ),
				'url'     => 'https://kb.jetpackcrm.com/knowledge-base/how-to-export-company-data/',
				'img'     => 'learn-extensions-list.png',
				'video'   => false,
				'content' => "<p></p>",
			),
			'bulktagger' => array(
				'title'   => __( "Bulk Tagger", 'zero-bs-crm' ),
				'url'     => 'https://kb.jetpackcrm.com/article-categories/bulk-tagger/',
				'img'     => 'learn-extensions-list.png',
				'video'   => false,
				'content' => "<p></p>",
			),
			'salesdash' => array(
				'title'   => __( "Sales Dashboard", 'zero-bs-crm' ),
				'url'     => 'https://kb.jetpackcrm.com/article-categories/sales-dashboard/',
				'img'     => 'learn-extensions-list.png',
				'video'   => false,
				'content' => "<p></p>",
			),
			'home' => array(
				'title'   => __( "Home", 'zero-bs-crm' ),
				'url'     => 'https://jetpackcrm.com/',
				'img'     => 'learn-extensions-list.png',
				'video'   => false,
				'content' => "<p></p>",
				'hide'    => true,
			),
			'welcome' => array(
				'title'   => __( "Welcome", 'zero-bs-crm' ),
				'url'     => 'https://jetpackcrm.com/',
				'img'     => 'learn-contact-list.png',
				'video'   => false,
				'content' => "<p></p>",
			),
			'sync' => array(
				'title'   => __( "Sync Tools", 'zero-bs-crm' ),
				'url'     => 'https://jetpackcrm.com/pricing/',
				'img'     => 'learn-contact-list.png',
				'video'   => false,
				'content' => "<p></p>",
			),
			'settings' => array(
				'title'           => __( "Settings", 'zero-bs-crm' ),
				'url'             => 'https://kb.jetpackcrm.com/knowledge-base/settings-page/',
				'img'             => 'learn-settings-page.png',
				'video'           => false,
				'content'         => "<p>" . __( "This settings page lets you control all of the different areas of Jetpack CRM. As you install extensions you will also see their settings pages showing up on the left hand menu below.", 'zero-bs-crm' ),
				'output_function' => 'jpcrm_settings_learn_menu',
			),
			'emails' => array(
				'title'           => __( "Emails", 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/emails',
				'img'             => 'learn-emails.png',
				'video'           => false,
				'content'         => "<p>" . __( "Emails are centric to your CRM communications. Send emails to your contacts and schedule them to send at certain times in the future (if conditions are met).", 'zero-bs-crm' ) . "</p><p>" . __( "Check out our System Emails Pro extension for the fully featured email solution.", 'zero-bs-crm' ) . "</p>",
				'output_function' => 'jpcrm_emails_learn_menu',
			),
			'profile' => array(
				'title'   => __( "Your Profile", 'zero-bs-crm' ),
				'img'     => 'learn-your-profile.png',
				'video'   => false,
				'content' => "<p>" . __( "This is your profile page.", 'zero-bs-crm' ) . "</p>",
			),
			'formedit' => array(
				'img'     => 'learn-forms.png',
				'video'   => false,
				'content' => "<p>" . __( "Form Types are great to choose which type of layout you want on your site.", 'zero-bs-crm' ) . "</p><p>" . __( "Each form tracks the number of views it has had compared to how many completions.", 'zero-bs-crm' ) . "</p><p>" . __( "The more information you ask for on a form, the lower the completion rate. Only ask for what you need and keep your contact list growing fast", 'zero-bs-crm' ) . "</p>",
			),
			'crmresources' => array(
				'title'   => __( 'CRM Resources', 'zero-bs-crm' ),
				'img'     => '',
				'video'   => false,
				'content' => '<p>' . __( 'The CRM Resources page collects together the general resources for CRM Admins.', 'zero-bs-crm' ) . '</p>',
			),
			'delete' => array(
				'title'           => __( 'Delete', 'zero-bs-crm' ),
				'img'             => '',
				'video'           => false,
				'content'         => '<p></p>',
				'output_function' => 'jpcrm_delete_learn_menu',
			),

		);


		// Extension tie-ins
		if ( isset( $zbs->slugs['stripesync'] ) ){

		  $learn_menu_array[ $zbs->slugs['stripesync'] ] = array(
		  	'title' => __( "Stripe Sync", 'zero-bs-crm' ),
		    'img' => '',
		    'video' => false,
		    'content' => "<p></p>",
			'output_function' => 'zeroBSCRM_stripesync_learn_menu',
		  );

		}
		if ( isset( $zbs->slugs['woosync'] ) ){

		  $learn_menu_array[ $zbs->slugs['woosync'] ] = array(
		  	'title' => 'WooSync',
		    'img' => '',
		    'video' => false,
		    'content' => "<p></p>",
			'output_function' => 'zeroBSCRM_woosync_learn_menu',
		  );

		}
		if ( isset( $zbs->slugs['mailpoet'] ) ){

		  $learn_menu_array[ $zbs->slugs['mailpoet'] ] = array(
		  	'title' => 'MailPoet',
		    'img' => '',
		    'video' => false,
		    'content' => "<p></p>",
			'output_function' => 'zeroBSCRM_mailpoet_learn_menu',
		  );

		}
		if ( isset( $zbs->slugs['paypalsync'] ) ){

		  $learn_menu_array[ $zbs->slugs['paypalsync'] ] = array(
		  	'title' => __( "PayPal Sync", 'zero-bs-crm' ),
		    'img' => '',
		    'video' => false,
		    'content' => "<p></p>",
			'output_function' => 'zeroBSCRM_paypalsync_learn_menu',
		  );

		}


		return $learn_menu_array;

	}


}