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
 * This is a bit of a misnomer, as it really refers to the page titlebar (under the top menu).
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
	 * Title of page
	 *
	 * @var string
	 */
	private $page_title;

	/**
	 * HTML to the left of the page header, often containing buttons
	 *
	 * @var string
	 */
	private $left_buttons;

	/**
	 * HTML to the right of the page header, often containing buttons
	 *
	 * @var string
	 */
	private $right_buttons;

	/**
	 * Whether or not to show the learn button
	 *
	 * @var bool
	 */
	private $show_learn;

	/**
	 * The learn box title
	 *
	 * @var string
	 */
	private $learn_title;

	/**
	 * The learn box content (HTML)
	 *
	 * @var string
	 */
	private $learn_content;

	/**
	 * The "learn more" link url
	 *
	 * @var string
	 */
	private $learn_more_url;

	/**
	 * The learn image url
	 *
	 * @var string
	 */
	private $learn_image_url;

	/**
	 * The learn video url
	 *
	 * @var string
	 */
	private $learn_video_url;

	/**
	 * Any extra JS to output
	 *
	 * @var string
	 */
	private $extra_js;

	/**
	 * Any extra css styles to add to the popup element
	 *
	 * @var string
	 */
	private $popup_extra_css;

	/**
	 * If $learn_video_url is provided, specify a video title here
	 *
	 * @var string
	 */
	private $learn_video_title;

	/**
	 * An icon to show before the page title
	 *
	 * @var string
	 */
	private $icon_class;

	/**
	 * The slug to use for a "back to list" link, or false if not used
	 *
	 * @var string|bool
	 */
	private $back_slug;

	/**
	 * Setup learn menu.
	 */
	public function __construct() {
		// set slugs
		$this->set_slugs();

		// require legacy functions
		require_once ZEROBSCRM_INCLUDE_PATH . 'jpcrm-learn-menu-legacy-functions.php';
	}

	/**
	 * Renders a learn menu
	 */
	public function render_learn_menu() {

		// retrieve
		$learn_menu_settings = $this->get_content( $this->slug );

		if ( is_array( $learn_menu_settings ) ) {

			// allow filter function for more complex operations on $learn_menu_settings
			if ( isset( $learn_menu_settings['filter_function'] ) ) {
				$learn_menu_settings = call_user_func( $learn_menu_settings['filter_function'], $learn_menu_settings );
			}

			// render

			// adapted from `zeroBSCRM_admin_subtop_menu()`
			// ... so there are functions to call for some learn menus, (if specified in 'output_function' attr)
			// ... else the intention is to use `render_generic_learn_menu()` (previously `zeroBS_genericLearnMenu()`)

			// if we have an `output_function` use it, else render generically
			if ( isset( $learn_menu_settings['output_function'] ) && function_exists( $learn_menu_settings['output_function'] ) ) {

				// call learn menu function
				call_user_func( $learn_menu_settings['output_function'] );

			} else {

				// render generic learn menu with content
				$this->render_generic_learn_menu(
					$learn_menu_settings['title'],
					$learn_menu_settings['left_buttons'],
					$learn_menu_settings['right_buttons'],
					$learn_menu_settings['show_learn'],
					$learn_menu_settings['learn_title'],
					$learn_menu_settings['content'],
					$learn_menu_settings['url'],
					$this->get_image_url( $learn_menu_settings['img'] ),
					$learn_menu_settings['video'],
					$learn_menu_settings['extra_js'],
					'',
					( ! empty( $learn_menu_settings['video_title'] ) ? $learn_menu_settings['video_title'] : '' ),
					$learn_menu_settings['icon_class'],
					$learn_menu_settings['back_slug']
				);
			}
		}

		// for any exts to hook into (currently PayPal Sync) :)
		do_action( 'zerobscrm-subtop-menu' ); // phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores
	}

	/**
	 * Sets slug values
	 */
	private function set_slugs() {

		global $zbs;

		// retrieve slug
		$slug = $this->get_slug();

		// set if legitimate
		if ( $this->slug_has_learn_content( $slug ) ) {

			// store the slug
			$this->slug = $slug;

		} else { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedElse

			// error here? :thinking-face:

		}

		// retrieve override slug
		$this->override_slug = $this->get_override_slug();

		// Catch override slug situations
		switch ( $this->override_slug ) {

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
		$slug = '';
		if ( isset( $_GET['page'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$slug = sanitize_text_field( $_GET['page'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		}

		// HERE we set pageKey to be slug (lazy global)
		// this is used for screenoptions, so will require you to set it wherever you want to use them (see userScreenOptions in core.php)
		// must be exposed via zeroBS_outputScreenOptions :)
		// note: for some 'sub pages' e.g. add-edit TYPE - this'll be appended to by functions below/above this level.
		// ... so if this is just 'root' we can override it, otherwise, don't (default)
		if ( $zbs->pageKey === 'root' ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			$zbs->pageKey = $slug; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		}

		// Specific page checks
		// There are instances where page checks override passed slug
		// because they're a bit more complex logic than a slug-check
		// (as adapted from previous setup)

		// if slug is a $zbs->slug value, use the key
		// e.g. translates `zerobscrm-dash` into `dash`
		$core_slug_key = array_search( $slug, $zbs->slugs, true );
		if ( ! empty( $core_slug_key ) ) {
			$slug = $core_slug_key;
		}

		// Add edit generic
		if ( $slug === $zbs->slugs['addedit'] || $slug === 'addedit' ) {

			// if we have action, switch :)
			if ( isset( $_GET['action'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended

				if ( $_GET['action'] !== 'edit' && $_GET['action'] !== 'delete' ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended

					if ( isset( $_GET['zbstype'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended

						$action = sanitize_text_field( $_GET['zbstype'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.MissingUnslash

						switch ( $action ) {

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
		if ( zeroBSCRM_is_customer_new_page() ) {
			$slug = 'contactnew';
		} elseif ( zeroBSCRM_is_customer_edit_page() ) {
			$slug = 'contactedit';
		}
		if ( zeroBSCRM_is_customertags_page() ) {
			$slug = 'contacttags';
		}

		// Segments
		if ( zeroBSCRM_is_segment_new_page() || zeroBSCRM_is_segment_new_page() ) {
			$slug = 'segmentedit';
		}

		// Companies
		if ( zeroBSCRM_is_company_new_page() ) {
			$slug = 'companynew';
		} elseif ( zeroBSCRM_is_company_edit_page() ) {
			$slug = 'companyedit';
		}
		if ( zeroBSCRM_is_companytags_page() ) {
			$slug = 'companytags';
		}

		// Quotes
		if ( zeroBSCRM_is_quo_new_page() ) {
			$slug = 'quotenew';
		} elseif ( zeroBSCRM_is_quo_edit_page() ) {
			$slug = 'quoteedit';
		}
		if ( zeroBSCRM_is_quotetags_page() ) {
			$slug = 'quotetags';
		}

		// Quote Templates
		if ( zeroBSCRM_is_quotetemplate_new_page() ) {
			$slug = 'quotetemplatenew';
		} elseif ( zeroBSCRM_is_quotetemplate_edit_page() ) {
			$slug = 'quotetemplateedit';
		}

		// Invoices
		if ( zeroBSCRM_is_invoice_new_page() ) {
			$slug = 'invoicenew';
		} elseif ( zeroBSCRM_is_invoice_edit_page() ) {
			$slug = 'invoiceedit';
		}
		if ( zeroBSCRM_is_invoicetags_page() ) {
			$slug = 'invoicetags';
		}

		// Transactions
		if ( zeroBSCRM_is_transaction_new_page() ) {
			$slug = 'transactionnew';
		} elseif ( zeroBSCRM_is_transaction_edit_page() ) {
			$slug = 'transactionedit';
		}
		if ( zeroBSCRM_is_transactiontags_page() ) {
			$slug = 'transactiontags';
		}

		// Tasks
		if ( zeroBSCRM_is_task_new_page() ) {
			$slug = 'tasknew';
		} elseif ( zeroBSCRM_is_task_edit_page() ) {
			$slug = 'taskedit';
		}

		// Forms
		if ( zeroBSCRM_is_form_new_page() ) {
			$slug = 'formnew';
		} elseif ( zeroBSCRM_is_form_edit_page() ) {
			$slug = 'editform';
		}

		// profile page
		if ( zeroBSCRM_is_profile_page() ) {
			$slug = 'profile';
		}

		// generic delete page
		if ( zeroBSCRM_is_delete_page() ) {
			$slug = 'delete';
		}

		if ( $slug === 'email-templates' ) {
			if ( ! empty( $_GET['zbs_template_editor'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
				$slug = 'template-settings';
			} elseif ( empty( $_GET['zbs_template_id'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
				$slug = 'recent-emails';
			}
		}

		if ( $slug === 'settings' ) {
			$tab = ( empty( $_GET['tab'] ) ? '' : sanitize_text_field( $_GET['tab'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.MissingUnslash
			if ( $tab === 'maildelivery' ) {
				$slug = 'maildelivery';
			} elseif ( $tab === 'mail' ) {
				$slug = 'mail';
			}
		}

		return $slug;
	}

	/**
	 * Retrieve override slug
	 */
	private function get_override_slug() {

		// CUSTOM slugs to affect behavior of standard WP pages
		$override_slug = '';
		if ( isset( $_GET['zbsslug'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$override_slug = sanitize_text_field( $_GET['zbsslug'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		}

		return $override_slug;
	}

	/**
	 * Verification of a slug
	 *
	 * @param string $slug Learn menu slug.
	 */
	public function slug_has_learn_content( $slug ) {

		if ( ! empty( $slug ) && $this->get_content( $slug ) ) {

			return true;

		}

		return false;
	}

	/**
	 * Render generic learn menu by parameters
	 *
	 * Noting here that this is a drop-in replacement for `zeroBS_genericLearnMenu()`,
	 * so some of the params are somewhat unnecessary, but have been kept in for parity
	 *
	 * @param string $page_title The current page title.
	 * @param string $left_buttons A string to append in the 'add new x' area of learn menu (e.g. "Add new contact" button).
	 * @param string $right_buttons A string to append in the 'filter' area of learn menu (e.g. "Filtered by tag x" on a list view).
	 * @param bool   $show_learn Whether to show the learn button or not.
	 * @param string $learn_title The learn box title.
	 * @param string $learn_content The learn content html.
	 * @param string $learn_more_url The learn more link url.
	 * @param string $learn_image_url The learn image url.
	 * @param string $learn_video_url The learn video url.
	 * @param string $extra_js Any extra JS to output.
	 * @param string $popup_extra_css Any extra css styles to add to the popup element.
	 * @param string $learn_video_title If {$learn_video_url} specify a video title here.
	 * @param string $icon_class An icon to show before the page title.
	 * @param string $back_slug The slug to use for a "back to list" link.
	 */
	public function render_generic_learn_menu(
		$page_title = '',
		$left_buttons = '',
		$right_buttons = '',
		$show_learn = true,
		$learn_title = '',
		$learn_content = '',
		$learn_more_url = '',
		$learn_image_url = '',
		$learn_video_url = '',
		$extra_js = '',
		$popup_extra_css = '',
		$learn_video_title = '',
		$icon_class = '',
		$back_slug = false
	) {

		// assign params as object properties so we don't have to pass them all over the place
		$this->page_title        = $page_title;
		$this->left_buttons      = $left_buttons;
		$this->right_buttons     = $right_buttons;
		$this->show_learn        = $show_learn;
		$this->learn_title       = $learn_title;
		$this->learn_content     = $learn_content;
		$this->learn_more_url    = $learn_more_url;
		$this->learn_image_url   = $learn_image_url;
		$this->learn_video_url   = $learn_video_url;
		$this->extra_js          = $extra_js;
		$this->popup_extra_css   = $popup_extra_css;
		$this->learn_video_title = $learn_video_title;
		$this->icon_class        = $icon_class;
		$this->back_slug         = $back_slug;

		// WL users don't see learn:
		if ( zeroBSCRM_isWL() ) {
			$show_learn = false;
		}

		// determine whether to show learn popup sidebar
		if ( ! $show_learn ) {
			$do_popup_sidebar = false;
		} elseif ( ! empty( $learn_video_url ) ) {
			$do_popup_sidebar = true;
		} elseif ( ! empty( $learn_image_url ) && ! empty( $learn_more_url ) ) {
			$do_popup_sidebar = true;
		} else {
			$do_popup_sidebar = false;
		}

		// js to enact learn / any custom js
		?>
		<script type="text/javascript">
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
				<?php echo $extra_js . "\n"; /* phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped */ ?>
			});
		</script>
		<div class="<?php echo esc_attr( $this->get_learn_menu_container_css_classes() ); ?>">
			<?php
			if ( $back_slug ) {
				?>
				<a href="<?php echo jpcrm_esc_link( $back_slug ); /* phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped */ ?>" class="jpcrm-button transparent-bg font-14px zero-padding"><i class="fa fa-arrow-left"></i>&nbsp;<?php echo esc_html__( 'Back to list', 'zero-bs-crm' ); ?></a>
				<?php
			}
			?>
			<div class="<?php echo esc_attr( $this->get_learn_menu_css_classes() ); ?>">
				<div class="jpcrm-learn-menu-subdiv-75">
					<div class="jpcrm-learn-menu-subdiv-75">
						<div class="jpcrm-learn-page-title">
							<?php

							if ( ! empty( $icon_class ) ) {
								echo '<i class="' . esc_attr( $icon_class ) . ' icon"></i>';
							}
							echo esc_html( $page_title );
							?>
						</div>
						<?php
						if ( $show_learn ) {
							$this->draw_learn_popup( $do_popup_sidebar );
						}
						?>
					</div>
					<div class="jpcrm-learn-menu-subdiv-25">
						<?php echo ( empty( $left_buttons ) ? '' : $left_buttons ); /* phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped */ ?>
					</div>
				</div>
				<div class="jpcrm-learn-menu-subdiv-25">
					<?php echo ( empty( $right_buttons ) ? '' : $right_buttons ); /* phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped */ ?>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Draws learn menu popup.
	 *
	 * @param bool $do_popup_sidebar Determine whether there's a popup sidebar (e.g. for a video).
	 */
	public function draw_learn_popup( $do_popup_sidebar ) {
		global $zbs;

		?>
		<div class="ui tiny learn button" id="learn">
			<img class="jpcrm-info-gridicon" src="<?php echo esc_url( ZEROBSCRM_URL ); ?>i/gridicon-info.svg" />
		</div>
		<div class="ui special popup top left transition hidden" id="learn-pop" style="<?php echo esc_attr( $this->popup_extra_css ); ?>">
			<div class="jpcrm-learn-popup-close"></div>
			<div class="jpcrm-learn-container ui grid">
				<div class="jpcrm-learn-content <?php echo ( $do_popup_sidebar ? 'ten' : 'sixteen' ); ?> wide column">
					<h3 class="learn-h3"><?php echo esc_html( $this->learn_title ); ?></h3>
					<div class="content">
						<?php

						// content
						echo $this->learn_content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

						// learn more link
						if ( ! empty( $this->learn_more_url ) ) {
							echo '<br/><a href="' . esc_url( $this->learn_more_url ) . '" target="_blank" class="learn-more-link">' . esc_html__( 'Learn More', 'zero-bs-crm' ) .
							'<img class="jpcrm-external-link-icon" src="' . esc_url( ZEROBSCRM_URL ) . 'i/external-link.svg" />' .
							'</a>';
						}
						?>
					</div>
				</div>
				<?php
				// sidebar if image/video
				if ( $do_popup_sidebar ) {
					?>
					<div class="jpcrm-learn-sidebar six wide column">
						<div class="sidebar-content">
							<?php
							if ( ! empty( $this->learn_video_url ) ) {
								$video_thumbnail_url = jpcrm_youtube_url_to_thumbnail_url( $this->learn_video_url );
								?>
								<div class="jpcrm-learn-popup-video">
									<?php
									if ( ! empty( $video_thumbnail_url ) ) {
										?>
										<a href="<?php echo esc_url( $this->learn_video_url ); ?>" target="_blank"><img src="<?php echo esc_url( $video_thumbnail_url ); ?>" alt="<?php echo esc_attr( $this->learn_video_title ); ?>" class="jpcrm-video-thumbnail" /></a>
										<?php
									}
									?>
									<br>
									<?php
									// show title if present
									if ( ! empty( $learn_video_title ) ) {
										?>
										<a href="<?php echo esc_url( $this->learn_video_url ); ?>" target="_blank"><?php echo esc_html( $this->learn_video_title ); ?></a>
										<?php
									}
									?>
									<div class="jpcrm-learn-popup-video-cta">
										<a href="<?php echo esc_url( $zbs->urls['youtube_intro_playlist'] ); ?>" target="_blank"><img src="<?php echo esc_url( ZEROBSCRM_URL ); ?>i/first-use-dash-learn-video-ico.png" alt="<?php esc_attr_e( 'View More on YouTube', 'zero-bs-crm' ); ?>" /> <?php esc_html_e( 'View More on YouTube', 'zero-bs-crm' ); ?></a>
									</div>
								</div>
								<?php
							} elseif ( ! empty( $this->learn_image_url ) && ! empty( $this->learn_more_url ) ) {
								?>
								<div class="jpcrm-learn-popup-image">
									<a href="<?php echo esc_url( $this->learn_more_url ); ?>" target="_blank"><img src="<?php echo esc_url( $this->learn_image_url ); ?>" alt="<?php echo esc_attr( $this->learn_title ); ?>" class="jpcrm-learn-image" /></a>
									<?php

									// show title if present
									if ( ! empty( $this->learn_title ) ) {
										?>
										<br>
										<a href="<?php echo esc_url( $this->learn_more_url ); ?>" target="_blank"><?php echo esc_html( $this->learn_title ); ?></a>
										<?php
									}

									?>
									<div class="jpcrm-learn-popup-image-cta">
										<a href="<?php echo esc_url( $this->learn_more_url ); ?>" target="_blank"><div class="jpcrm-learn-popup-external-link"></div> <?php esc_html_e( 'Read more', 'zero-bs-crm' ); ?></a>
									</div>
								</div>
								<?php

							}

							?>
						</div>
					</div>
					<?php
				}
				?>
				</div>
		</div>
		<?php
	}

	/**
	 * Apply filters to a learn menus content
	 *
	 * Unclear if this is used anywhere.
	 *
	 * @param string $slug A slug used in a filter name.
	 * @param array  $learn_menu_array A learn menu content array.
	 */
	public function apply_filters_to_content( $slug, $learn_menu_array ) {

		if ( ! empty( $slug ) && is_array( $learn_menu_array ) ) {

			// legacy content filtering, not certain where this is used.
			if ( isset( $learn_menu_array['content'] ) ) {

				// filter
				$learn_menu_array['content'] = apply_filters( 'zbs_learn_' . $slug . '_content', $learn_menu_array['content'] );
			}
		}

		return $learn_menu_array;
	}

	/**
	 * Retrieve learn menu content
	 *
	 * @param string $slug Learn menu slug.
	 */
	private function get_content( $slug ) {

		global $zbs;

		// retrieve full list
		$learn_menu_content = $this->get_all_content();

		// check if available
		if ( isset( $learn_menu_content[ $slug ] ) ) {

			if ( empty( $learn_menu_content[ $slug ]['title'] ) ) {
				$learn_menu_content[ $slug ]['title'] = '';
			}
			if ( empty( $learn_menu_content[ $slug ]['left_buttons'] ) ) {
				$learn_menu_content[ $slug ]['left_buttons'] = '';
			}
			if ( empty( $learn_menu_content[ $slug ]['right_buttons'] ) ) {
				$learn_menu_content[ $slug ]['right_buttons'] = '';
			}
			if ( ! isset( $learn_menu_content[ $slug ]['show_learn'] ) || $learn_menu_content[ $slug ]['show_learn'] !== false ) {
				$learn_menu_content[ $slug ]['show_learn'] = true;
			}
			if ( empty( $learn_menu_content[ $slug ]['learn_title'] ) ) {
				$learn_menu_content[ $slug ]['learn_title'] = $learn_menu_content[ $slug ]['title'];
			}
			if ( empty( $learn_menu_content[ $slug ]['content'] ) ) {
				$learn_menu_content[ $slug ]['content'] = '<p></p>';
			}
			if ( empty( $learn_menu_content[ $slug ]['url'] ) ) {
				$learn_menu_content[ $slug ]['url'] = $zbs->urls['docs'];
			}
			if ( empty( $learn_menu_content[ $slug ]['img'] ) ) {
				$learn_menu_content[ $slug ]['img'] = 'learn-extensions-list.png';
			}
			if ( empty( $learn_menu_content[ $slug ]['video'] ) ) {
				$learn_menu_content[ $slug ]['video'] = false;
			}
			if ( empty( $learn_menu_content[ $slug ]['extra_js'] ) ) {
				$learn_menu_content[ $slug ]['extra_js'] = '';
			}
			if ( empty( $learn_menu_content[ $slug ]['extra_css'] ) ) {
				$learn_menu_content[ $slug ]['extra_css'] = '';
			}
			if ( empty( $learn_menu_content[ $slug ]['video_title'] ) ) {
				$learn_menu_content[ $slug ]['video_title'] = '';
			}
			if ( empty( $learn_menu_content[ $slug ]['icon_class'] ) ) {
				$learn_menu_content[ $slug ]['icon_class'] = '';
			}
			if ( empty( $learn_menu_content[ $slug ]['back_slug'] ) ) {
				$learn_menu_content[ $slug ]['back_slug'] = false;
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
	 * @param string $slug Learn menu slug.
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
	 * @param string $slug Learn menu slug.
	 */
	public function get_content_urls( $slug ) {

		$content_urls = array(
			'learn' => '',
			'img'   => '',
			'vid'   => '',
		);

		$content = $this->get_content( $slug );

		if ( ! empty( $content ) ) {
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
	 * @param string $img_url Image url.
	 */
	public function get_image_url( $img_url ) {

		if ( empty( $img_url ) ) {
			return '';
		}

		if ( strpos( $img_url, '/' ) ) {
			// is probably an absolute url
			return $img_url;
		}

		// for now return blank string
		return '';
	}

	/**
	 * Retrieve learn menu content (using $this->slug)
	 *  This replaces a previous collection of 4~ global arrays
	 *  The array key used should either match a $zbs->slugs[] key, or be otherwise caught
	 *  by the special conditions in `get_slugs()` and `set_slugs()`
	 *
	 * The aim here is for this array to be the one source of truth for learn menus.
	 */
	private function get_all_content() {

		global $zbs;

		// learn content
		$learn_menu_array = array(

			'dash'               => array(
				'title'         => __( 'Dashboard', 'zero-bs-crm' ),
				'url'           => 'https://jetpackcrm.com/feature/dashboard/',
				'img'           => 'learn-dashboard.png',
				'content'       => '<p>' . __( 'This your CRM dashboard. It shows you at a glance some key data from your CRM activity.', 'zero-bs-crm' ) . '</p><p>' . __( '<b>Sales Funnel</b> shows how effective you are at converting leads to customers.', 'zero-bs-crm' ) . '</p><p>' . __( '<b>Revenue Chart</b> shows you the overview of your transactions for the past few months.', 'zero-bs-crm' ) . '</p>',
				'right_buttons' => '<button class="jpcrm-button transparent-bg font-14px" type="button" id="jpcrm_dash_page_options">' . esc_html__( 'Page options', 'zero-bs-crm' ) . '&nbsp;<i class="fa fa-cog"></i></button>',
			),
			'managecontacts'     => array(
				'title'           => __( 'Contacts', 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/contacts/',
				'img'             => 'learn-contact-list.png',
				'content'         => '<p>' . __( 'Here is your contact list. It is central to your CRM. You can manage your contacts here and apply quick filters.', 'zero-bs-crm' ) . '</p><p>' . __( 'Transactions Total is how much your contact has spent with you (for approved statuses). You can choose which transaction types should be included in your settings.', 'zero-bs-crm' ) . '</p><p>' . __( 'Total Value is the total value including other transaction statuses (pending, on-hold, etc) as well as the value of any unpaid invoices.', 'zero-bs-crm' ) . '</p>',
				'filter_function' => 'jpcrm_contactlist_learn_menu',
			),
			'viewcontact'        => array(
				'title'           => __( 'Viewing Contact', 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/contacts/',
				'img'             => 'learn-edit-contact.png',
				'content'         => '<p>' . __( 'View Contact gives you an easy way to see your contact information in one place.', 'zero-bs-crm' ) . '</p>',
				'back_slug'       => $zbs->slugs['managecontacts'],
				'filter_function' => 'jpcrm_viewcontact_learn_menu',
			),
			'contactnew'         => array(
				'title'        => __( 'New Contact', 'zero-bs-crm' ),
				'url'          => 'https://jetpackcrm.com/feature/contacts/',
				'img'          => 'learn-import-contacts.png',
				'content'      => '<p>' . __( 'There are plenty of ways which you can add contacts to your CRM', 'zero-bs-crm' ) . '</p><div class="ui divider"></div><p><strong>' . __( 'Adding them manually', 'zero-bs-crm' ) . '</strong> ' . __( 'You can add contacts manually. This takes time.', 'zero-bs-crm' ) . '</p><p><strong>' . __( 'Import from CSV', 'zero-bs-crm' ) . '</strong> ' . __( 'You can import via a CSV file.', 'zero-bs-crm' ) . '</p><p><strong>' . __( 'Import using our extensions', 'zero-bs-crm' ) . '</strong> ' . __( 'such as PayPal Sync, Stripe Sync or WooSync which will help get your contacts into your CRM automatically.', 'zero-bs-crm' ) . '</p>',
				'left_buttons' => '<button class="jpcrm-button transparent-bg font-14px" type="button" id="jpcrm_page_options">' . esc_html__( 'Page options', 'zero-bs-crm' ) . '&nbsp;<i class="fa fa-cog"></i></button>',
				'back_slug'    => $zbs->slugs['managecontacts'],
			),
			'contactedit'        => array(
				'title'           => __( 'Edit Contact', 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/contacts/',
				'img'             => 'learn-edit-contact.png',
				'content'         => '<p>' . __( 'Keep the details of your contacts up to date.', 'zero-bs-crm' ) . '</p><p>' . __( '<strong>Key details</strong> should be kept up to date here. Your contacts email, their address, plus any additional information you want to hold on them.', 'zero-bs-crm' ) . '</p><p>' . sprintf( __( 'If the available fields below are not enough, you can add custom fields to your contacts record through the <a href="%s">custom field settings</a>', 'zero-bs-crm' ), admin_url( 'admin.php?page=' . $zbs->slugs['settings'] . '&tab=customfields' ) ) . '</p>',   // phpcs:ignore WordPress.WP.I18n.MissingTranslatorsComment
				'back_slug'       => $zbs->slugs['managecontacts'],
				'filter_function' => 'jpcrm_contactedit_learn_menu',
			),
			'contacttags'        => array(
				'title'       => __( 'Contact Tags', 'zero-bs-crm' ),
				'url'         => 'https://jetpackcrm.com/feature/tags/',
				'img'         => 'learn-contact-tags.png',
				'video'       => 'https://www.youtube.com/watch?v=KwGh-Br_exc',
				'video_title' => __( 'Introduction to Tags and Segments', 'zero-bs-crm' ),
				'content'     => '<p>' . __( 'Tags are a powerful part of Jetpack CRM. You can tag your contacts and then filter or send emails based on those tags.', 'zero-bs-crm' ) . '</p><p>' . __( 'You can add as many tags as you like. Use them to keep track of important things with your contact. For example, contact has agreed to receive marketing material (or contact has opted out of marketing).', 'zero-bs-crm' ) . '</p>',
			),
			'companytags'        => array(
				'title'       => __( jpcrm_label_company() . ' Tags', 'zero-bs-crm' ), // phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText
				'url'         => 'https://jetpackcrm.com/feature/b2b-mode/',
				'img'         => 'learn-company-tags.png',
				'video'       => 'https://www.youtube.com/watch?v=KwGh-Br_exc',
				'video_title' => __( 'Introduction to Tags and Segments', 'zero-bs-crm' ),
				'content'     => '<p>' . __( jpcrm_label_company() . ' tags let you label your ' . jpcrm_label_company( true ) . ' for easier filtering in the ' . jpcrm_label_company() . ' list.', 'zero-bs-crm' ) . '</p><p>' . __( 'Tags help you organise your ' . jpcrm_label_company() . ' easier, expanding on just searching or filtering by status.', 'zero-bs-crm' ) . '</p>', // phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText
			),
			'sendmail'           => array(
				'title'   => __( 'Send Email', 'zero-bs-crm' ),
				'url'     => 'https://jetpackcrm.com/feature/system-emails/',
				'img'     => 'learn-send-email.png',
				'content' => '<p>' . __( 'Send your contact a single email from this page.', 'zero-bs-crm' ) . '</p><p>' . __( '<strong>Emails</strong> sent from here are logged against your contact in their Activity log', 'zero-bs-crm' ) . '</p><p><img style="max-width:90%" src="' . ZEROBSCRM_URL . 'i/learn/learn-email-activity-log.png" alt="" /></p><p>' . __( 'Emails are sent using your chosen method of delivery (wp_mail, SMTP).', 'zero-bs-crm' ) . '</p>',
			),
			'viewcompany'        => array(
				'title'           => __( 'Viewing ' . jpcrm_label_company(), 'zero-bs-crm' ), // phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText
				'url'             => 'https://jetpackcrm.com/feature/b2b-mode/',
				'img'             => 'learn-new-company.png',
				'content'         => '<p>' . __( 'View ' . jpcrm_label_company() . ' gives you an overview of the key ' . jpcrm_label_company() . ' information. Including the ability to see which contacts work at the ' . jpcrm_label_company() . ' and click into viewing the contact information easily.', 'zero-bs-crm' ) . '</p>', // phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText
				'back_slug'       => $zbs->slugs['managecompanies'],
				'filter_function' => 'jpcrm_viewcompany_learn_menu',
			),
			'manageformscrm'     => array(
				'title'           => __( 'Forms', 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/forms/',
				'img'             => 'learn-forms.png',
				'video'           => 'https://www.youtube.com/watch?v=mBPjV1KUb-w',
				'video_title'     => __( 'All about Forms', 'zero-bs-crm' ),
				'content'         => '<p>' . __( 'We offer built-in lead generation forms. Using these forms you can see which form is driving the most growth in your list.', 'zero-bs-crm' ) . '</p><p>' . __( 'If you want more features than the built-in forms provide, you can use our form integrations with Jetpack Contact Forms, Gravity Forms, or Contact Form 7.', 'zero-bs-crm' ) . '</p>',
				'filter_function' => 'jpcrm_formlist_learn_menu',
			),
			'editform'           => array(
				'title'       => __( 'Edit Form', 'zero-bs-crm' ),
				'url'         => 'https://jetpackcrm.com/feature/forms/',
				'img'         => 'learn-forms.png',
				'content'     => '<p>' . __( 'Each form has its views and submissions tracked.', 'zero-bs-crm' ) . '</p><p>' . __( 'The more information asked for on a form, the lower the submission rate. Only ask for what you need and keep your contact list growing fast.', 'zero-bs-crm' ) . '</p>',
				'video'       => 'https://www.youtube.com/watch?v=mBPjV1KUb-w',
				'video_title' => __( 'All about Forms', 'zero-bs-crm' ),
				'back_slug'   => $zbs->slugs['manageformscrm'],
			),
			'formnew'            => array(
				'title'       => __( 'New Form', 'zero-bs-crm' ),
				'url'         => 'https://jetpackcrm.com/feature/forms/',
				'img'         => 'learn-forms.png',
				'video'       => 'https://www.youtube.com/watch?v=mBPjV1KUb-w',
				'video_title' => __( 'All about Forms', 'zero-bs-crm' ),
				'content'     => '<p>' . __( 'Add a new form and choose your form layout.', 'zero-bs-crm' ) . '</p><p>' . __( 'Each form has its views and submissions tracked.', 'zero-bs-crm' ) . '</p><p>' . __( 'The more information asked for on a form, the lower the submission rate. Only ask for what you need and keep your contact list growing fast.', 'zero-bs-crm' ) . '</p>',
				'back_slug'   => $zbs->slugs['manageformscrm'],
			),
			'manage-tasks'      => array(
				'title'           => __( 'Task Calendar', 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/tasks/',
				'img'             => 'learn-task-calendar.png',
				'content'         => '<p>' . __( 'Tasks are our internal word for managing things to do related to contacts.', 'zero-bs-crm' ) . '</p><p>' . __( 'They are not intended to be a full appointment system operatable from the front end. They are useful to schedule short appointments and if using Client Portal Pro your clients can add them to their Calendar.', 'zero-bs-crm' ) . '</p>',
				'filter_function' => 'jpcrm_taskcalendar_learn_menu',
			),
			'manage-tasks-list' => array(
				'title'           => __( 'Task List', 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/tasks/',
				'img'             => 'learn-task-calendar.png',
				'content'         => '<p>' . __( 'Tasks are our internal word for managing things to do related to contacts.', 'zero-bs-crm' ) . '</p><p>' . __( 'They are not intended to be a full appointment system operatable from the front end. They are useful to schedule short appointments and if using Client Portal Pro your clients can add them to their Calendar.', 'zero-bs-crm' ) . '</p>',
				'filter_function' => 'jpcrm_tasklistview_learn_menu',
			),
			'taskedit'           => array(
				'title'           => __( 'Edit Task', 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/tasks/',
				'img'             => 'learn-task-calendar.png',
				'content'         => '<p>' . __( 'Tasks are our internal word for managing things to do related to contacts.', 'zero-bs-crm' ) . '</p><p>' . __( 'They are not intended to be a full appointment system operatable from the front end. They are useful to schedule short appointments and if using Client Portal Pro your clients can add them to their Calendar.', 'zero-bs-crm' ) . '</p>',
				'filter_function' => 'jpcrm_taskedit_learn_menu',
			),
			'tasknew'            => array(
				'title'           => __( 'New Task', 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/tasks/',
				'img'             => 'learn-task-calendar.png',
				'content'         => '<p>' . __( 'Tasks are our internal word for managing things to do related to contacts.', 'zero-bs-crm' ) . '</p><p>' . __( 'They are not intended to be a full appointment system operatable from the front end. They are useful to schedule short appointments and if using Client Portal Pro your clients can add them to their Calendar.', 'zero-bs-crm' ) . '</p>',
				'filter_function' => 'jpcrm_tasknew_learn_menu',
			),
			'managequotes'       => array(
				'title'           => __( 'Quotes', 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/quotes/',
				'img'             => 'learn-quote-list.png',
				'content'         => '<p>' . __( 'Here is your list of quotes. You can see which quotes you have issued in the past.', 'zero-bs-crm' ) . '</p><p>' . __( 'You can also change the status of quotes in Bulk Actions by ticking a quote row.', 'zero-bs-crm' ) . '</p>',
				'filter_function' => 'jpcrm_quotelist_learn_menu',
			),
			'quotenew'           => array(
				'title'        => __( 'New Quote', 'zero-bs-crm' ),
				'url'          => 'https://jetpackcrm.com/feature/quotes/',
				'img'          => 'learn-new-quote.png',
				'content'      => '<p>' . __( 'Add a new quote here. When creating a quote you fill in the key details such as contact name and quote value. You can then choose which template should populate the quote content.', 'zero-bs-crm' ) . '</p><p>' . __( 'Templates automatically fill in the contact fields and save you time if you regularly issue similar quotes.', 'zero-bs-crm' ) . '</p>',
				'left_buttons' => '<div id="zbs-quote-learn-nav"></div>',
				'back_slug'    => $zbs->slugs['managequotes'],
			),
			'quoteedit'          => array(
				'title'        => __( 'Edit Quote', 'zero-bs-crm' ),
				'url'          => 'https://jetpackcrm.com/feature/quotes/',
				'img'          => 'learn-new-quote.png',
				'left_buttons' => '<div id="zbs-quote-learn-nav"></div>',
				'back_slug'    => $zbs->slugs['managequotes'],
			),
			'quotetags'          => array(
				'title'       => __( 'Quote Tags', 'zero-bs-crm' ),
				'url'         => 'https://jetpackcrm.com/feature/quotes/',
				'img'         => 'learn-quotes-tags.png',
				'video'       => 'https://www.youtube.com/watch?v=KwGh-Br_exc',
				'video_title' => __( 'Introduction to Tags and Segments', 'zero-bs-crm' ),
				'content'     => '<p>' . __( 'Quote tags can be used to filter your quote list.', 'zero-bs-crm' ) . '</p>',
			),
			'transactiontags'    => array(
				'title'       => __( 'Transaction Tags', 'zero-bs-crm' ),
				'url'         => 'https://jetpackcrm.com/feature/transactions/',
				'img'         => 'learn-trans-tags.png',
				'video'       => 'https://www.youtube.com/watch?v=KwGh-Br_exc',
				'video_title' => __( 'Introduction to Tags and Segments', 'zero-bs-crm' ),
				'content'     => '<p>' . __( 'Transaction tags can be used to filter your transaction list.', 'zero-bs-crm' ) . '</p><p>' . __( 'Some of our sync tools like PayPal Sync or WooSync can automatically tag the transaction with the item name. This lets you filter based on product and even feed tag-based filters in the Sales Dashboard extension.', 'zero-bs-crm' ) . '</p>',
			),
			'transactionnew'     => array(
				'title'        => __( 'New Transaction', 'zero-bs-crm' ),
				'url'          => 'https://jetpackcrm.com/feature/transactions/',
				'img'          => 'learn-trans.png',
				'content'      => '<p>' . __( 'Adding a new transaction is easy. You should assign it to a contact and then optionally to an invoice.', 'zero-bs-crm' ) . '</p><p>' . __( 'Assigned transactions are deducted from the balance of an invoice and feed into the total value for the contact.', 'zero-bs-crm' ) . '</p><p>' . __( 'Be sure to define which transaction statuses to include in totals via the Transactions tab in CRM Settings.', 'zero-bs-crm' ) . '</p>',
				'left_buttons' => '<div id="zbs-transaction-learn-nav"></div>',
				'back_slug'    => $zbs->slugs['managetransactions'],
			),
			'transactionedit'    => array(
				'title'        => __( 'Edit Transaction', 'zero-bs-crm' ),
				'url'          => 'https://jetpackcrm.com/feature/transactions/',
				'img'          => 'learn-trans.png',
				'content'      => '<p>' . __( 'Editing a Transaction is easy. You should assign it to a contact and then optionally to an invoice.', 'zero-bs-crm' ) . '</p><p>' . __( 'Assigned transactions are deducted from the balance of an invoice and feed into the total value for the contact.', 'zero-bs-crm' ) . '</p><p>' . __( 'Be sure to define which transaction statuses to include in totals via the Transactions tab in CRM Settings.', 'zero-bs-crm' ) . '</p>',
				'left_buttons' => '<div id="zbs-transaction-learn-nav"></div>',
				'back_slug'    => $zbs->slugs['managetransactions'],
			),
			'managetransactions' => array(
				'title'           => __( 'Transactions', 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/transactions/',
				'img'             => 'learn-transactions-list.png',
				'content'         => '<p>' . __( 'Here is your transactions list. This transactions of all statuses, such as completed, refunded, cancelled, and failed. You can manage your transactions and see who has made them.', 'zero-bs-crm' ) . '</p><p>' . __( 'You can choose which transaction types should be included in totals in the Transactions tab of the CRM settings.', 'zero-bs-crm' ) . '</p>',
				'filter_function' => 'jpcrm_transactionlist_learn_menu',
			),
			'quote-templates'    => array(
				'title'         => __( 'Quote Templates', 'zero-bs-crm' ),
				'url'           => 'https://jetpackcrm.com/feature/quotes/',
				'img'           => 'learn-quote-template.png',
				'content'       => '<p>' . __( 'Quote templates save you time. You can enter placeholders so that when you generate a new quote using the template, the contact fields are automatically populated.', 'zero-bs-crm' ) . '</p>',
				'right_buttons' => ' <a href="' . jpcrm_esc_link( 'create', -1, 'zerobs_quo_template', false ) . '#free-extensions-tour" class="jpcrm-button font-14px" id="add-template">' . __( 'Add new template', 'zero-bs-crm' ) . '</a>',
			),
			'quotetemplatenew'   => array(
				'title'     => __( 'New Quote Template', 'zero-bs-crm' ),
				'url'       => 'https://jetpackcrm.com/feature/quotes/',
				'img'       => 'learn-quote-templates.png',
				'content'   => '<p>' . __( 'A quote template is where you should populate all the business information when putting together a proposal or quote for your services.', 'zero-bs-crm' ) . '</p><p>' . __( 'Templates save time, since in new quotes you can just edit any price information and be up and running in seconds vs. typing out all the details again.', 'zero-bs-crm' ) . '</p>',
				'back_slug' => $zbs->slugs['quote-templates'],
			),
			'quotetemplateedit'  => array(
				'title'     => __( 'Edit Quote Template', 'zero-bs-crm' ),
				'url'       => 'https://jetpackcrm.com/feature/quotes/',
				'img'       => 'learn-quote-templates.png',
				'content'   => '<p>' . __( 'A quote template is where you should populate all the business information when putting together a proposal or quote for your services.', 'zero-bs-crm' ) . '</p><p>' . __( 'Templates save time, since in new quotes you can just edit any price information and be up and running in seconds vs. typing out all the details again.', 'zero-bs-crm' ) . '</p>',
				'back_slug' => $zbs->slugs['quote-templates'],
			),
			'manageinvoices'     => array(
				'title'           => __( 'Invoices', 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/invoices/',
				'img'             => 'learn-invoice-list.png',
				'content'         => '<p>' . __( 'Here is your Invoice List. It shows you all your invoices. You can search and filter the list to find the invoices you want.', 'zero-bs-crm' ) . '</p>',
				'filter_function' => 'jpcrm_invoicelist_learn_menu',
			),
			'invoicenew'         => array(
				'title'           => __( 'New Invoice', 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/invoices/',
				'img'             => 'learn-new-invoice.png',
				'content'         => '<p>' . __( 'Having invoices in your CRM is a great way to keep contacts and payments together.', 'zero-bs-crm' ) . '</p><p>' . __( 'Do you want to provide PDF invoices to your clients? Simple. Choose the PDF option and download your invoices as PDF.', 'zero-bs-crm' ) . '</p><p>' . __( 'The real power of invoicing comes when you allow your invoices to be accessed and paid straight from your client portal using Invoicing Pro.', 'zero-bs-crm' ) . '</p>',
				'left_buttons'    => '<div id="zbs-invoice-learn-nav"></div>',
				'back_slug'       => $zbs->slugs['manageinvoices'],
				'filter_function' => 'jpcrm_invoicenew_learn_menu',
			),
			'invoiceedit'        => array(
				'title'           => __( 'Edit Invoice', 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/invoices/',
				'img'             => 'learn-invoice-list.png',
				'content'         => '<p>' . __( 'Having invoices in your CRM is a great way to keep contacts and payments together.', 'zero-bs-crm' ) . '</p><p>' . __( 'Do you want to provide PDF invoices to your clients? Simple. Choose the PDF option and download your invoices as PDF.', 'zero-bs-crm' ) . '</p><p>' . __( 'The real power of invoicing comes when you allow your invoices to be accessed and paid straight from your client portal using Invoicing Pro.', 'zero-bs-crm' ) . '</p>',
				'left_buttons'    => '<div id="zbs-invoice-learn-nav"></div>',
				'back_slug'       => $zbs->slugs['manageinvoices'],
				'filter_function' => 'jpcrm_invoiceedit_learn_menu',
			),
			'invoicetags'        => array(
				'title'       => __( 'Invoice Tags', 'zero-bs-crm' ),
				'url'         => 'https://jetpackcrm.com/feature/invoices/',
				'img'         => 'learn-invoices-tags.png',
				'video'       => 'https://www.youtube.com/watch?v=KwGh-Br_exc',
				'video_title' => __( 'Introduction to Tags and Segments', 'zero-bs-crm' ),
				'content'     => '<p>' . __( 'Invoice tags can be used to filter your invoice list.', 'zero-bs-crm' ) . '</p>',
			),
			'team'               => array(
				'title'   => __( 'Your Team', 'zero-bs-crm' ),
				'url'     => 'https://jetpackcrm.com/feature/team/',
				'img'     => 'learn-zbs-team.png',
				'content' => '<p>' . __( 'Here is your CRM team. You can see what role your team members have and when they were last active.', 'zero-bs-crm' ) . '</p>',
			),
			'teamadd'            => array(
				'title'   => __( 'Add New Team Member', 'zero-bs-crm' ),
				'url'     => 'https://jetpackcrm.com/feature/team/',
				'img'     => 'learn-zbs-team.png',
				'content' => '<p>' . __( 'As your business grows you will want to expand your team.', 'zero-bs-crm' ) . '</p><p>' . __( 'Add new team members or search existing WordPress users to add them to your team.', 'zero-bs-crm' ) . '</p><p>' . __( 'WordPress Administrator level by default has access to everything. You can manage your other user permissions here.', 'zero-bs-crm' ) . '</p>',
			),
			'teamedit'           => array(
				'title'   => __( 'Edit Team Member', 'zero-bs-crm' ),
				'url'     => 'https://jetpackcrm.com/feature/team/',
				'img'     => 'learn-zbs-team.png',
				'content' => '<p>' . __( 'As your business grows you will want to expand your team.', 'zero-bs-crm' ) . '</p><p>' . __( 'Add new team members or search existing WordPress users to add them to your team.', 'zero-bs-crm' ) . '</p><p>' . __( 'WordPress Administrator level by default has access to everything. You can manage your other user permissions here.', 'zero-bs-crm' ) . '</p>',
			),
			'extensions'         => array(
				'title'           => __( 'Extensions', 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/pricing/',
				'img'             => 'learn-extensions-list.png',
				'video'           => false,
				'content'         => '<p>' . sprintf( __( 'The core of the CRM is free to use, and you can manage your core modules (extensions) <a href="%s">here</a>; this page lets you manage premium extensions.', 'zero-bs-crm' ), admin_url( 'admin.php?page=' . $zbs->slugs['modules'] ) ) . '</p><p>' . __( '<b>Premium Extensions</b> Want all the extensions? Purchase our Entrepeneur Bundle to get access to them all.', 'zero-bs-crm' ) . '</p>', // phpcs:ignore WordPress.WP.I18n.MissingTranslatorsComment
				'filter_function' => 'jpcrm_extensions_learn_menu',
			),
			'managecompanies'    => array(
				'title'           => __( jpcrm_label_company( true ), 'zero-bs-crm' ), // phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText
				'url'             => 'https://jetpackcrm.com/feature/companies/',
				'img'             => 'learn-company-list.png',
				'content'         => '<p>' . __( 'Keep track of important ', 'zero-bs-crm' ) . jpcrm_label_company() . __( ' level relationships in your CRM', 'zero-bs-crm' ) . '</p><p>' . __( 'Managing ', 'zero-bs-crm' ) . jpcrm_label_company( true ) . __( ' is a way of seeing which contacts work at which ', 'zero-bs-crm' ) . jpcrm_label_company() . __( ' If you have three or four contacts who keep in touch with you, it is useful to know which ', 'zero-bs-crm' ) . jpcrm_label_company() . __( ' they all share in common.', 'zero-bs-crm' ) . '</p>',
				'filter_function' => 'jpcrm_companylist_learn_menu',
			),
			'companynew'         => array(
				'title'     => sprintf( __( 'New %s', 'zero-bs-crm' ), jpcrm_label_company() ), // phpcs:ignore WordPress.WP.I18n.MissingTranslatorsComment
				'url'       => 'https://jetpackcrm.com/feature/companies/',
				'img'       => 'learn-company-list.png',
				'content'   => '<p>' . __( 'Add a New Company to your CRM. When adding a ', 'zero-bs-crm' ) . jpcrm_label_company() . __( ' you can also choose which contacts to assign to the ', 'zero-bs-crm' ) . jpcrm_label_company() . __( '.', 'zero-bs-crm' ) . '</p><p>' . __( 'Managing large clients, this gives you an easy way to zero in on contacts at a particular company.', 'zero-bs-crm' ) . '</p>',
				'back_slug' => $zbs->slugs['managecompanies'],
			),
			'companyedit'        => array(
				'title'           => sprintf( __( 'Edit %s', 'zero-bs-crm' ), jpcrm_label_company() ), // phpcs:ignore WordPress.WP.I18n.MissingTranslatorsComment
				'url'             => 'https://jetpackcrm.com/feature/companies/',
				'img'             => 'learn-company-list.png',
				'content'         => '<p>' . __( 'Editing a Company in your CRM. When editing a ', 'zero-bs-crm' ) . jpcrm_label_company() . __( ' you can also choose which contacts to assign to the ', 'zero-bs-crm' ) . jpcrm_label_company() . __( '.', 'zero-bs-crm' ) . '</p><p>' . __( 'Managing large clients, this gives you an easy way to zero in on contacts at a particular company.', 'zero-bs-crm' ) . '</p>',
				'back_slug'       => $zbs->slugs['managecompanies'],
				'filter_function' => 'jpcrm_companyedit_learn_menu',
			),
			'mail'               => array(
				'title'   => __( 'Settings: Mail', 'zero-bs-crm' ),
				'url'     => 'https://jetpackcrm.com/feature/system-emails/',
				'img'     => 'learn-mail.png',
				'content' => '<p>' . __( 'Your mail settings control the emails that are sent out of your CRM.', 'zero-bs-crm' ) . '</p><p>' . __( 'You can choose how you want your email "From" name to look when single emails are sent and setup various mail delivery options (such as adding your STMP settings).', 'zero-bs-crm' ) . '</p>',
			),
			'maildelivery'       => array(
				'title'   => __( 'Settings: Mail Delivery', 'zero-bs-crm' ),
				'url'     => 'https://jetpackcrm.com/feature/mail-delivery/',
				'img'     => 'learn-mail-delivery.png',
				'content' => '<p>' . __( 'Mail delivery options help you improve your CRM email deliverability. If you are running Mail Campaigns or our mail templates you may also wish to choose which email account sends the emails (or system emails).', 'zero-bs-crm' ) . '</p><p>' . __( 'You could have your new client account emails come from one email and your invoices come from another email.', 'zero-bs-crm' ) . '</p>',
			),
			'email-templates'    => array(
				'title'   => __( 'System Email Templates', 'zero-bs-crm' ),
				'url'     => 'https://jetpackcrm.com/feature/system-emails/',
				'img'     => 'learn-mail.png',
				'content' => '<p>' . __( 'Edit your different system email templates.', 'zero-bs-crm' ) . '</p>',
			),
			'recent-emails'      => array(
				'title'   => __( 'Recent Email Activity', 'zero-bs-crm' ),
				'url'     => 'https://jetpackcrm.com/feature/system-emails/',
				'img'     => 'learn-mail.png',
				'content' => '<p>' . __( 'Recent email activity across your CRM email templates.', 'zero-bs-crm' ) . '</p>',
			),
			'template-settings'  => array(
				'title'   => __( 'Template Settings', 'zero-bs-crm' ),
				'url'     => 'https://jetpackcrm.com/feature/system-emails/',
				'img'     => 'learn-mail.png',
				'content' => '<p>' . __( 'Manage your main email template settings.', 'zero-bs-crm' ) . '</p>',
			),
			'viewsegment'        => array(
				'title'           => __( 'View Segment', 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/segments/',
				'img'             => 'learn-segment-edit.png',
				'video'           => 'https://www.youtube.com/watch?v=KwGh-Br_exc',
				'video_title'     => __( 'Introduction to Tags and Segments', 'zero-bs-crm' ),
				'content'         => '<p>' . __( 'Create a segment to partition a group of contacts into a manageable list.', 'zero-bs-crm' ) . '</p><p>' . __( 'Perfect for quick filters and links in seamlessly with Mail Campaigns and Automations. Segments are a great way to give you extra list power and save you having to manually group contacts based on multiple tags.', 'zero-bs-crm' ) . '</p>',
				'icon_class'      => 'pie chart',
				'back_slug'       => $zbs->slugs['segments'],
				'filter_function' => 'jpcrm_segmentedit_learn_menu',
			),
			'segmentedit'        => array(
				'title'           => __( 'Edit Segment', 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/segments/',
				'img'             => 'learn-segment-edit.png',
				'video'           => 'https://www.youtube.com/watch?v=KwGh-Br_exc',
				'video_title'     => __( 'Introduction to Tags and Segments', 'zero-bs-crm' ),
				'content'         => '<p>' . __( 'Create a segment to partition a group of contacts into a manageable list.', 'zero-bs-crm' ) . '</p><p>' . __( 'Perfect for quick filters and links in seamlessly with Mail Campaigns and Automations. Segments are a great way to give you extra list power and save you having to manually group contacts based on multiple tags.', 'zero-bs-crm' ) . '</p>',
				'icon_class'      => 'pie chart',
				'back_slug'       => $zbs->slugs['segments'],
				'filter_function' => 'jpcrm_segmentedit_learn_menu',
			),
			'segments'           => array(
				'title'           => __( 'Segments', 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/segments/',
				'img'             => 'learn-segment-list.png',
				'video'           => 'https://www.youtube.com/watch?v=KwGh-Br_exc',
				'video_title'     => __( 'Introduction to Tags and Segments', 'zero-bs-crm' ),
				'content'         => '<p>' . __( 'Here is your segment list. This is where you will see any segments you create.', 'zero-bs-crm' ) . '</p><p>' . __( 'Segments are a powerful way to split out groups of contacts from your contact list and act on them (e.g. via Mail Campaigns or Automations).', 'zero-bs-crm' ) . '</p>',
				'icon_class'      => 'pie chart',
				'filter_function' => 'jpcrm_segmentlist_learn_menu',
			),
			'notifications'      => array(
				'title'           => __( 'Notifications', 'zero-bs-crm' ),
				'url'             => 'https://kb.jetpackcrm.com/knowledge-base/jetpack-crm-notifications/',
				'img'             => 'learn-notifications.png',
				'content'         => '<p>' . __( 'When you are running your CRM you want to be kept up to date with everything.', 'zero-bs-crm' ) . '</p><p>' . __( 'Notifications are here to help keep you notified. Here is where you will see useful messages and updates from us.', 'zero-bs-crm' ) . '</p>',
				'filter_function' => 'jpcrm_notifications_learn_menu',
			),
			'export-tools'       => array(
				'title'   => __( 'Export Tools', 'zero-bs-crm' ),
				'url'     => 'https://kb.jetpackcrm.com/knowledge-base/how-to-export-company-data/',
				'img'     => 'learn-export-tools.png',
				'content' => '<p>' . __( 'Here is the central area for exporting information from your CRM.', 'zero-bs-crm' ) . '</p><p>' . __( 'Export to keep backups offline, to do additional analysis in a spreadsheet, or to import into other tools you use.', 'zero-bs-crm' ) . '</p>',
			),
			'datatools'          => array(
				'title'       => __( 'Data Tools', 'zero-bs-crm' ),
				'url'         => 'https://kb.jetpackcrm.com/knowledge-base/how-to-export-company-data/',
				'img'         => 'learn-data-tools.png',
				'video'       => 'https://www.youtube.com/watch?v=2KDy-a2wC8w',
				'video_title' => __( 'How to import contacts using CSV files', 'zero-bs-crm' ),
				'content'     => '<p>' . __( 'Data Tools is the area where you can reset your CRM data or import data from a CSV file.', 'zero-bs-crm' ) . '</p><p>' . __( 'You can also export various types of CRM data, including as contacts, transactions, quotes, and invoices.', 'zero-bs-crm' ) . '</p>',
			),
			'systemstatus'       => array(
				'title'   => __( 'System Assistant', 'zero-bs-crm' ),
				'img'     => 'learn-system-settings.png',
				'content' => '<p>' . __( 'This page is your CRM backend hub. You can use the System Assistant to guide your setup, or the System Status tab lets you see the various server and software settings which exist behind the scenes in your Jetpack CRM install.', 'zero-bs-crm' ) . '</p><p>' . __( 'You will not need to change anything here, but our support team might ask you to load this page to retrieve a status flag.', 'zero-bs-crm' ) . '</p>',
			),
			'modules'            => array(
				'title'       => __( 'Core Modules', 'zero-bs-crm' ),
				'img'         => 'learn-core-modules.png',
				'video'       => 'https://www.youtube.com/watch?v=j9RsXPcgeIo',
				'video_title' => __( 'Introduction to core CRM modules', 'zero-bs-crm' ),
				'content'     => '<p>' . __( 'From this page you can manage which core modules are enabled, it gives you ultimate control of the areas of your CRM that you plan to use or hide. Modules are kind of like bundled CRM extensions and vary from object-areas like Invoices to functionality like adding PDF generation.', 'zero-bs-crm' ) . '</p><p>' . sprintf( __( 'If you want to manage your premium extensions, you can do that <a href="%s">here</a>.', 'zero-bs-crm' ), admin_url( 'admin.php?page=' . $zbs->slugs['extensions'] ) ) . '</p>', // phpcs:ignore WordPress.WP.I18n.MissingTranslatorsComment
			),
			'export'             => array(
				'title' => __( 'Export', 'zero-bs-crm' ),
				'url'   => 'https://kb.jetpackcrm.com/knowledge-base/how-to-export-company-data/',
				'img'   => 'learn-extensions-list.png',
			),
			'bulktagger'         => array(
				'title' => __( 'Bulk Tagger', 'zero-bs-crm' ),
				'url'   => 'https://kb.jetpackcrm.com/article-categories/bulk-tagger/',
				'img'   => 'learn-extensions-list.png',
			),
			'salesdash'          => array(
				'title' => __( 'Sales Dashboard', 'zero-bs-crm' ),
				'url'   => 'https://kb.jetpackcrm.com/article-categories/sales-dashboard/',
				'img'   => 'learn-extensions-list.png',
			),
			'home'               => array(
				'show_learn' => false,
			),
			'welcome'            => array(
				'title' => __( 'Welcome', 'zero-bs-crm' ),
				'url'   => 'https://jetpackcrm.com/',
				'img'   => 'learn-contact-list.png',
			),
			'sync'               => array(
				'title' => __( 'Sync Tools', 'zero-bs-crm' ),
				'url'   => 'https://jetpackcrm.com/pricing/',
				'img'   => 'learn-contact-list.png',
			),
			'settings'           => array(
				'title'           => __( 'Settings', 'zero-bs-crm' ),
				'url'             => 'https://kb.jetpackcrm.com/knowledge-base/settings-page/',
				'img'             => 'learn-settings-page.png',
				'content'         => '<p>' . __( 'This settings page lets you control all of the different areas of Jetpack CRM. As you install extensions you will also see their settings pages showing up on the left hand menu below.', 'zero-bs-crm' ),
				'filter_function' => 'jpcrm_settings_learn_menu',
			),
			'emails'             => array(
				'title'           => __( 'Emails', 'zero-bs-crm' ),
				'url'             => 'https://jetpackcrm.com/feature/emails',
				'img'             => 'learn-emails.png',
				'content'         => '<p>' . __( 'Emails are centric to your CRM communications. Send emails to your contacts and schedule them to send at certain times in the future (if conditions are met).', 'zero-bs-crm' ) . '</p><p>' . __( 'Check out our System Emails Pro extension to extend the email functionality.', 'zero-bs-crm' ) . '</p>',
				'filter_function' => 'jpcrm_emails_learn_menu',
			),
			'profile'            => array(
				'title'   => __( 'Your Profile', 'zero-bs-crm' ),
				'img'     => 'learn-your-profile.png',
				'content' => '<p>' . __( 'This is your profile page.', 'zero-bs-crm' ) . '</p>',
			),
			'crmresources'       => array(
				'title'   => __( 'CRM Resources', 'zero-bs-crm' ),
				'content' => '<p>' . __( 'The CRM Resources page collects together the general resources for CRM Admins.', 'zero-bs-crm' ) . '</p>',
			),
			'delete'             => array(
				'title'           => __( 'Delete', 'zero-bs-crm' ),
				'output_function' => 'jpcrm_delete_learn_menu',
			),
			'csvlite'            => array(
				'title'           => __( 'CSV Importer Lite', 'zero-bs-crm' ),
				'learn_title'     => esc_html__( 'Import contacts from CSV', 'zero-bs-crm' ),
				'filter_function' => 'jpcrm_csvlite_learn_menu',
			),
		);

		/**
		 * Extension tie-ins
		 */
		if ( isset( $zbs->slugs['stripesync'] ) ) {
			$learn_menu_array[ $zbs->slugs['stripesync'] ] = array(
				'title'           => __( 'Stripe Sync', 'zero-bs-crm' ),
				'output_function' => 'zeroBSCRM_stripesync_learn_menu',
			);
		}

		if ( isset( $zbs->slugs['woosync'] ) ) {
			$learn_menu_array[ $zbs->slugs['woosync'] ] = array(
				'title'           => 'WooSync',
				'output_function' => 'zeroBSCRM_woosync_learn_menu',
			);
		}

		if ( isset( $zbs->slugs['mailpoet'] ) ) {
			$learn_menu_array[ $zbs->slugs['mailpoet'] ] = array(
				'title'           => 'MailPoet',
				'output_function' => 'zeroBSCRM_mailpoet_learn_menu',
			);
		}

		if ( isset( $zbs->slugs['paypalsync'] ) ) {
			$learn_menu_array[ $zbs->slugs['paypalsync'] ] = array(
				'title'           => 'PayPal Sync',
				'output_function' => 'zeroBSCRM_paypalsync_learn_menu',
			);
		}

		$learn_menu_array = apply_filters( 'jpcrm_learn_menus', $learn_menu_array );

		return $learn_menu_array;
	}

	/**
	 * Retrieves the CSS classes for the Learn menu container.
	 *
	 * @return string The CSS classes for the Learn menu container.
	 */
	private function get_learn_menu_container_css_classes() {
		$classes = 'jpcrm-learn-menu-container';

		if ( isset( $_GET['page'] ) && jpcrm_is_full_width_page( wp_unslash( $_GET['page'] ) ) ) { // phpcs:ignore
			$classes .= ' jpcrm-full-width';
		}

		$classes = apply_filters( 'jetpack_crm_learn_menu_container_css_classes', $classes );
		return $classes;
	}

	/**
	 * Retrieves the CSS classes for the Learn menu.
	 *
	 * @return string The CSS classes for the Learn menu.
	 */
	private function get_learn_menu_css_classes() {
		$classes = 'jpcrm-learn-menu';

		if ( isset( $_GET['page'] ) && jpcrm_is_full_width_page( wp_unslash( $_GET['page'] ) ) ) { // phpcs:ignore
			$classes .= ' jpcrm-full-width';
		}

		$classes = apply_filters( 'jetpack_crm_learn_menu_css_classes', $classes );
		return $classes;
	}
}
