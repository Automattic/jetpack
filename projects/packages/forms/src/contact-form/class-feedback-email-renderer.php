<?php
/**
 * Feedback_Email_Renderer class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use Automattic\Jetpack\Forms\Dashboard\Dashboard as Forms_Dashboard;
use Automattic\Jetpack\Forms\Jetpack_Forms;
use Jetpack_Tracks_Event;
use PHPMailer\PHPMailer\PHPMailer;

/**
 * Handles all email rendering for form submissions.
 *
 * Owns the pipeline from form data to HTML email: field compilation,
 * sanitization, template wrapping, and email sending utilities.
 */
class Feedback_Email_Renderer {

	/**
	 * The color of the respondent email link in the email header.
	 *
	 * @var string
	 */
	public const TEXT_SECONDARY_COLOR = '#757575';

	/**
	 * The color of the links in the email.
	 *
	 * @var string
	 */
	public const LINK_COLOR = '#1e1e1e';

	/**
	 * The color of the text in the email.
	 *
	 * @var string
	 */
	public const TEXT_COLOR = '#1e1e1e';

	/**
	 * Font size for field labels.
	 *
	 * @var string
	 */
	public const FONT_SIZE_FIELD_LABEL = '15px';

	/**
	 * Font size for field values, chips, and respondent name.
	 *
	 * @var string
	 */
	public const FONT_SIZE_FIELD_VALUE = '16px';

	/**
	 * Font size for metadata section and powered-by text.
	 *
	 * @var string
	 */
	public const FONT_SIZE_METADATA = '13px';

	/**
	 * Font size for action buttons and respondent email.
	 *
	 * @var string
	 */
	public const FONT_SIZE_BUTTON = '14px';

	/**
	 * Font size for small annotations like file sizes.
	 *
	 * @var string
	 */
	public const FONT_SIZE_SMALL = '12px';

	/**
	 * Build the complete email content for a form submission.
	 *
	 * Assembles the email title, compiled form fields, footer, actions,
	 * respondent info, metadata, and wraps everything in the HTML template.
	 *
	 * @param int          $post_id      The feedback post ID.
	 * @param Contact_Form $form         The form instance.
	 * @param Feedback     $response     The feedback response object.
	 * @param array        $context_data Context data with keys:
	 *   'time'                 => string  Formatted date/time string.
	 *   'url'                  => string  Source page URL.
	 *   'comment_author'       => string  Author name.
	 *   'comment_author_email' => string  Author email.
	 *   'comment_author_ip'    => string  Author IP address.
	 *   'is_spam'              => bool    Whether submission is spam.
	 *   'feedback_status'      => string  Post status of the feedback.
	 *
	 * @return array{title: string, message: string} The email title and rendered HTML message.
	 */
	public static function build_email_content( $post_id, $form, $response, $context_data ) {
		$time                 = $context_data['time'];
		$url                  = $context_data['url'];
		$comment_author       = $context_data['comment_author'];
		$comment_author_email = $context_data['comment_author_email'];
		$comment_author_ip    = $context_data['comment_author_ip'];
		$is_spam              = $context_data['is_spam'];
		$feedback_status      = $context_data['feedback_status'];

		/**
		 * Filter the title used in the response email.
		 *
		 * @module contact-form
		 *
		 * @since 0.18.0
		 *
		 * @param string the title of the email
		 */
		$default_email_title = __( 'Hey, a new form response just came in!', 'jetpack-forms' );
		$title               = (string) apply_filters( 'jetpack_forms_response_email_title', $default_email_title );
		$message             = self::get_compiled_form_for_email( $post_id, $form );

		if ( is_user_logged_in() ) {
			$sent_by_text = sprintf(
				// translators: the name of the site.
				'<br />' . esc_html__( 'Sent by a verified %s user.', 'jetpack-forms' ) . '<br />',
				isset( $GLOBALS['current_site']->site_name ) && $GLOBALS['current_site']->site_name ? $GLOBALS['current_site']->site_name : '"' . get_option( 'blogname' ) . '"'
			);
		} else {
			$sent_by_text = '<br />' . esc_html__( 'Sent by an unverified visitor to your site.', 'jetpack-forms' ) . '<br />';
		}

		$footer_time = sprintf(
			/* translators: Placeholder is the date and time when a form was submitted. */
			esc_html__( 'Time: %1$s', 'jetpack-forms' ),
			$time
		);
		$footer_ip = null;
		if ( $comment_author_ip ) {
			$ip_lookup_url               = sprintf( 'https://jetpack.com/redirect/?source=ip-lookup&path=%s', rawurlencode( $comment_author_ip ) );
			$comment_author_ip_with_link = '<a href="' . esc_url( $ip_lookup_url ) . '">' . esc_html( $comment_author_ip ) . '</a>';
			$comment_author_ip_with_flag = ( $response->get_country_flag() ? $response->get_country_flag() . ' ' : '' ) . $comment_author_ip_with_link;
			$footer_ip                   = sprintf(
				/* translators: Placeholder is the IP address of the person who submitted a form. */
				esc_html__( 'IP Address: %1$s', 'jetpack-forms' ),
				$comment_author_ip_with_flag
			);
		}
		$footer_browser = null;
		if ( $response->get_browser() ) {
			$footer_browser = sprintf(
				/* translators: Placeholder is the browser and platform used to submit a form. */
				esc_html__( 'Browser: %1$s', 'jetpack-forms' ),
				$response->get_browser()
			) . '<br />';
		}

		$footer_url = sprintf(
			/* translators: Placeholder is the URL of the page where a form was submitted. */
			__( 'Source URL: %1$s', 'jetpack-forms' ),
			esc_url( $url )
		);

		// Get the status of the feedback.
		$status = $is_spam ? 'spam' : 'inbox';

		// Build the dashboard URL with the status and the feedback's post id if we have a post id.
		$dashboard_url           = '';
		$mark_as_spam_url        = '';
		$footer_mark_as_spam_url = '';

		if ( $feedback_status !== 'jp-temp-feedback' ) {
			$dashboard_url           = Forms_Dashboard::get_forms_admin_url( $status, $post_id );
			$mark_as_spam_url        = self::add_mark_as_spam_to_url( $dashboard_url );
			$footer_mark_as_spam_url = sprintf(
				'<a href="%1$s">%2$s</a>',
				esc_url( $mark_as_spam_url ),
				__( 'Mark as spam', 'jetpack-forms' )
			);
		}

		$footer = implode(
			'',
			/**
			 * Filter the footer used in the response email.
			 *
			 * @module contact-form
			 *
			 * @since 0.18.0
			 *
			 * @param array the lines of the footer, one line per array element.
			 */
			apply_filters(
				'jetpack_forms_response_email_footer',
				array_filter(
					array(
						'<span style="font-size: ' . self::FONT_SIZE_SMALL . '">',
						$footer_time . '<br />',
						$footer_ip ? $footer_ip . '<br />' : null,
						$footer_browser ? $footer_browser . '<br />' : null,
						$footer_url . '<br /><br />',
						$footer_mark_as_spam_url ? $footer_mark_as_spam_url . '<br />' : null,
						$sent_by_text,
						'</span>',
					)
				)
			)
		);

		// Build the actions with both Mark as spam and View in dashboard buttons.
		// Use fully table-based layout for maximum email client compatibility - no display:inline-block.
		$actions = '';
		if ( $dashboard_url ) {
			$actions = sprintf(
				'<table role="presentation" border="0" cellpadding="0" cellspacing="0" class="button-table" align="center" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; margin: 0 auto;">
					<tr>
						<td class="button-cell" width="50%%" style="text-align: right; padding-right: 8px; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen-Sans, Ubuntu, Cantarell, \'Helvetica Neue\', sans-serif;">
							<a href="%1$s" class="action-button action-button-secondary" style="display: inline-block; background-color: transparent; color: %5$s; border: 1px solid #1e1e1e; border-radius: 4px; font-size: ' . self::FONT_SIZE_BUTTON . '; font-weight: 500; text-decoration: none; padding: 12px 24px; text-align: center; mso-padding-alt: 0;">%2$s</a>
						</td>
						<td class="button-cell" width="50%%" style="text-align: left; padding-left: 8px; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen-Sans, Ubuntu, Cantarell, \'Helvetica Neue\', sans-serif;">
							<a href="%3$s" class="action-button action-button-primary" style="display: inline-block; background-color: #3858e9; color: #ffffff; border-radius: 4px; font-size: ' . self::FONT_SIZE_BUTTON . '; font-weight: 500; text-decoration: none; padding: 12px 24px; text-align: center; mso-padding-alt: 0;">%4$s</a>
						</td>
					</tr>
				</table>',
				esc_url( $mark_as_spam_url ),
				__( 'Mark as spam', 'jetpack-forms' ),
				esc_url( $dashboard_url ),
				__( 'View in dashboard', 'jetpack-forms' ),
				self::LINK_COLOR
			);
		}

		// Build respondent info for the new email template.
		$respondent_info = array(
			'name'   => $comment_author,
			'email'  => $comment_author_email,
			'avatar' => $response->get_author_avatar(),
		);

		// Get the form title for source metadata.
		$form_title = $form->get_attribute( 'formTitle' );
		if ( empty( $form_title ) && $form->current_post ) {
			$form_title = Contact_Form::get_post_property( $form->current_post, 'post_title' );
		}

		// Build metadata for the new email template.
		$metadata = array(
			'date'       => $time,
			'source'     => $form_title,
			'source_url' => $url,
			'device'     => $response->get_browser(),
			'ip'         => $comment_author_ip,
			'ip_flag'    => $response->get_country_flag(),
		);

		/**
		 * Filters the message sent via email after a successful form submission.
		 *
		 * @module contact-form
		 *
		 * @since 1.3.1
		 *
		 * @param string $message Feedback email message.
		 * @param string $message Feedback email message as an array
		 */
		$message = apply_filters( 'contact_form_message', implode( '', $message ), $message );

		// This is called after `contact_form_message`, in order to preserve back-compat.
		$message = self::wrap_message_in_html_tags( $title, $message, $footer, $actions, $respondent_info, $metadata );

		return array(
			'title'   => $title,
			'message' => $message,
		);
	}

	/**
	 * Adds the mark_as_spam parameter to a dashboard URL.
	 *
	 * This method handles both legacy and wp-build dashboard URLs:
	 * - Legacy: appends &mark_as_spam to the hash fragment
	 * - WP-Build: adds mark_as_spam to the path inside the p parameter
	 *
	 * @param string $url The dashboard URL.
	 * @return string The URL with mark_as_spam parameter added.
	 */
	private static function add_mark_as_spam_to_url( $url ) {
		// Check if this is a wp-build URL (contains &p= parameter).
		if ( strpos( $url, '&p=' ) !== false ) {
			// WP-Build URL format: admin.php?page=jetpack-forms-responses-wp-admin&p=/responses/inbox?responseIds=["123"]
			// We need to add &mark_as_spam=1 inside the p parameter path.
			$parts = explode( '&p=', $url, 2 );

			if ( count( $parts ) === 2 ) {
				$base_url = $parts[0];
				$path     = rawurldecode( $parts[1] );

				// Add mark_as_spam parameter to the path.
				$separator = strpos( $path, '?' ) !== false ? '&' : '?';
				$path     .= $separator . 'mark_as_spam=1';

				return $base_url . '&p=' . rawurlencode( $path );
			}
		}

		// Legacy URL format: admin.php?page=jetpack-forms-admin#/responses?status=inbox&r=123
		// Append &mark_as_spam to the hash fragment.
		return $url . '&mark_as_spam';
	}

	/**
	 * Returns a compiled form with labels and values formatted for the email response
	 * in a form of an array of lines.
	 *
	 * @param int          $feedback_id - the feedback ID.
	 * @param Contact_Form $form - the form.
	 *
	 * @return array $lines
	 */
	public static function get_compiled_form_for_email( $feedback_id, $form ) {
		$compiled_form    = array();
		$field_collection = array();
		$response         = Feedback::get( $feedback_id );

		if ( $response instanceof Feedback ) {
			// Get both formats: 'all' for backward-compat filter, 'collection' for type-aware rendering.
			$compiled_form    = $response->get_compiled_fields( 'email', 'all' );
			$field_collection = $response->get_compiled_fields( 'email_html', 'collection' );
		}

		/**
		 * This filter allows a site owner to customize the response to be emailed, by adding their own HTML around it for example.
		 *
		 * @module contact-form
		 *
		 * @since 0.18.0
		 *
		 * @param array $compiled_form the form response to be filtered
		 * @param int $feedback_id the ID of the feedback form
		 * @param Contact_Form $form a copy of this object
		 */
		$updated_compiled_form = apply_filters( 'jetpack_forms_response_email', $compiled_form, $feedback_id, $form );
		if ( $updated_compiled_form !== $compiled_form ) {
			// Filter was customized — use old rendering path for backward compat.
			$compiled_form = $updated_compiled_form;
			foreach ( $compiled_form as $key => $value ) {
				if ( ! is_array( $value ) || ! isset( $value['label'] ) ) {
					continue;
				}
				$safe_display_label = Contact_Form::escape_and_sanitize_field_label( $value['label'] );
				$safe_display_value = Contact_Form::escape_and_sanitize_field_value( $value['value'] );

				if ( ! empty( $safe_display_label ) ) {
					$compiled_form[ $key ] = sprintf(
						'<p><strong>%1$s</strong><br /><span>%2$s</span></p>',
						Util::maybe_add_colon_to_label( $safe_display_label ),
						$safe_display_value
					);
				} else {
					$compiled_form[ $key ] = sprintf(
						'<p><span>%s</span></p>',
						$safe_display_value
					);
				}
			}
		} else {
			// No filter customization — use new type-aware rendering.
			$compiled_form = array();
			foreach ( $field_collection as $field_data ) {
				$compiled_form[] = self::format_field_for_email( $field_data );
			}
		}

		return $compiled_form;
	}

	/**
	 * Get the icon name for a given field type.
	 *
	 * @param string $type The field type.
	 * @return string The icon name.
	 */
	private static function get_field_icon_name( $type ) {
		$map = array(
			'text'              => 'field-text',
			'name'              => 'field-text',
			'email'             => 'field-email',
			'textarea'          => 'field-textarea',
			'select'            => 'field-select',
			'radio'             => 'field-single-choice',
			'checkbox'          => 'field-checkbox',
			'checkbox-multiple' => 'field-multiple-choice',
			'phone'             => 'field-telephone',
			'telephone'         => 'field-telephone',
			'number'            => 'field-number',
			'slider'            => 'field-slider',
			'date'              => 'field-date',
			'time'              => 'field-time',
			'url'               => 'field-url',
			'rating'            => 'field-rating',
			'image-select'      => 'field-image-select',
			'file'              => 'field-file',
			'consent'           => 'field-consent',
			'hidden'            => 'field-hidden',
		);
		return $map[ $type ] ?? 'field-text';
	}

	/**
	 * Format a single field for the email notification using type-aware rendering.
	 *
	 * Takes a collection item from get_compiled_fields( 'email', 'collection' )
	 * and produces a table row with an icon, label, and type-specific value.
	 *
	 * @param array $field_data Field data with keys: label, value, type, id, key, meta.
	 * @return string HTML for the field row.
	 */
	private static function format_field_for_email( $field_data ) {
		$label = $field_data['label'] ?? '';
		$value = $field_data['value'] ?? '';
		$type  = $field_data['type'] ?? 'text';

		$safe_label = Contact_Form::escape_and_sanitize_field_label( $label );
		$icon_name  = self::get_field_icon_name( $type );
		$icon_url   = Jetpack_Forms::plugin_url() . 'contact-form/images/field-icons/' . $icon_name . '@2x.png';

		// Value is already rendered as HTML by Feedback_Field::get_render_email_html_value().
		$rendered_value = $value;

		// Build the field row as a table with icon + content.
		$html  = '<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-bottom: 1px solid #F0F0F0; padding: 0; margin: 0;">';
		$html .= '<tr>';
		$html .= '<td class="field-icon-cell" width="24" valign="top" style="padding: 18px 16px 20px 0; width: 24px; vertical-align: top; -webkit-user-select: none; user-select: none;">';
		$html .= sprintf(
			'<img src="%s" width="24" height="24" alt="" style="display: block; width: 24px; height: 24px; -webkit-user-select: none; user-select: none;" />',
			esc_url( $icon_url )
		);
		$html .= '</td>';
		$html .= '<td valign="top" style="padding: 20px 0;">';
		if ( ! empty( $safe_label ) ) {
			$html .= sprintf(
				'<div style="font-size: ' . self::FONT_SIZE_FIELD_LABEL . '; color: %s; line-height: 1.4; margin-bottom: 8px;">%s</div>',
				self::TEXT_SECONDARY_COLOR,
				esc_html( $safe_label )
			);
		}
		$html .= sprintf(
			'<div style="font-size: ' . self::FONT_SIZE_FIELD_VALUE . '; color: %s; line-height: 1.5;">%s</div>',
			self::TEXT_COLOR,
			$rendered_value
		);
		$html .= '</td>';
		$html .= '</tr>';
		$html .= '</table>';

		return $html;
	}

	/**
	 * Wrapper for wp_mail() that enables HTML messages with text alternatives
	 *
	 * @param string|array $to          Array or comma-separated list of email addresses to send message.
	 * @param string       $subject     Email subject.
	 * @param string       $message     Message contents.
	 * @param string|array $headers     Optional. Additional headers.
	 * @param string|array $attachments Optional. Files to attach.
	 *
	 * @return bool Whether the email contents were sent successfully.
	 */
	public static function wp_mail( $to, $subject, $message, $headers = '', $attachments = array() ) {
		add_filter( 'wp_mail_content_type', __CLASS__ . '::get_mail_content_type' );
		add_action( 'phpmailer_init', __CLASS__ . '::add_plain_text_alternative' );

		$result = \wp_mail( $to, $subject, $message, $headers, $attachments );

		remove_filter( 'wp_mail_content_type', __CLASS__ . '::get_mail_content_type' );
		remove_action( 'phpmailer_init', __CLASS__ . '::add_plain_text_alternative' );

		return $result;
	}

	/**
	 * Get the content type that should be assigned to outbound emails
	 *
	 * @return string
	 */
	public static function get_mail_content_type() {
		return 'text/html';
	}

	/**
	 * Add a plain-text alternative part to an outbound email
	 *
	 * This makes the message more accessible to mail clients that aren't HTML-aware, and decreases the likelihood
	 * that the message will be flagged as spam.
	 *
	 * @param PHPMailer $phpmailer - the phpmailer.
	 */
	public static function add_plain_text_alternative( $phpmailer ) {
		// phpcs:disable WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

		// Remove the preheader (hidden email preview text) so it doesn't duplicate the title in plain text.
		$alt_body = preg_replace( '/<span class="preheader">.*?<\/span>/s', '', $phpmailer->Body );

		// Add an extra break so that the extra space above the <p> is preserved after the <p> is stripped out.
		$alt_body = str_replace( '<p>', '<p><br />', $alt_body );

		// Convert <br> to \n breaks, to preserve the space between lines that we want to keep.
		$alt_body = str_replace( array( '<br>', '<br />' ), "\n", $alt_body );

		// Convert <div> to \n breaks, to preserve space between lines for new email formatting.
		$alt_body = str_replace( '<div', "\n<div", $alt_body );

		// Convert <hr> to an plain-text equivalent, to preserve the integrity of the message.
		$alt_body = str_replace( array( '<hr>', '<hr />' ), "----\n", $alt_body );

		// Trim the plain text message to remove the \n breaks that were after <doctype>, <html>, and <body>.
		$phpmailer->AltBody = trim( wp_strip_all_tags( $alt_body ) );
		// phpcs:enable WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	}

	/**
	 * Wrap a message body with the appropriate in HTML tags
	 *
	 * This helps to ensure correct parsing by clients, and also helps avoid triggering spam filtering rules
	 *
	 * @param string $title - title of the email.
	 * @param string $body - the message body.
	 * @param string $footer - the footer containing meta information.
	 * @param string $actions - HTML for actions displayed in the email.
	 * @param array  $respondent_info - Optional. Respondent information array with 'name', 'email', 'avatar'.
	 * @param array  $metadata - Optional. Metadata array with 'date', 'source', 'source_url', 'device', 'ip', 'ip_flag'.
	 *
	 * @return string
	 */
	public static function wrap_message_in_html_tags( $title, $body, $footer, $actions = '', $respondent_info = array(), $metadata = array() ) {
		// Don't do anything if the message was already wrapped in HTML tags
		// That could have be done by a plugin via filters.
		if ( str_contains( $body, '<html' ) ) {
			return $body;
		}

		$template = '';
		$style    = '';

		// The hash is just used to anonymize the admin email and have a unique identifier for the event.
		// The secret key used could have been a random string, but it's better to use the version number to make it easier to track.
		$event = new Jetpack_Tracks_Event(
			(object) array(
				'_en' => 'jetpack_forms_email_open',
				'_ui' => hash_hmac( 'md5', get_option( 'admin_email' ), JETPACK__VERSION ),
				'_ut' => 'anon',
			)
		);

		$tracking_pixel = '<img src="' . $event->build_pixel_url() . '" alt="" width="1" height="1" />';

		/**
		 * Filter the filename of the template HTML surrounding the response email. The PHP file will return the template in a variable called $template.
		 *
		 * @module contact-form
		 *
		 * @since 0.18.0
		 *
		 * @param string the filename of the HTML template used for response emails to the form owner.
		 */
		$print_style = null; // May be set by the template file loaded below.
		require apply_filters( 'jetpack_forms_response_email_template', __DIR__ . '/templates/email-response.php' );

		/**
		 * Filter the HTML for the powered by section in the email.
		 *
		 * @module contact-form
		 *
		 * @since 7.2.0
		 *
		 * @param string $powered_by_html The HTML for the powered by section in the email.
		 */
		// Use table-based layout for maximum email client compatibility.
		$logo_url        = Jetpack_Forms::plugin_url() . 'contact-form/images/field-icons/jetpack-logo@2x.png';
		$powered_by_html = apply_filters(
			'jetpack_forms_email_powered_by_html',
			str_replace(
				"\t",
				'',
				'
				<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="powered-by-table" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; margin-top: 24px;">
					<tr>
						<td align="center" class="powered-by" style="padding: 24px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen-Sans, Ubuntu, Cantarell, \'Helvetica Neue\', sans-serif;">
							<img src="' . esc_url( $logo_url ) . '" alt="Jetpack" width="20" height="20" style="vertical-align: middle; margin-right: 6px; border: 0; outline: none; text-decoration: none; -webkit-user-select: none; user-select: none;">
							<span style="font-size: ' . self::FONT_SIZE_METADATA . '; color: #50575e; line-height: 20px;">' .
					sprintf(
						// translators: %1$s is a link to the Jetpack Forms page.
						__( 'Powered by %1$s', 'jetpack-forms' ),
						'<a href="https://jetpack.com/forms/?utm_source=jetpack-forms&utm_medium=email&utm_campaign=form-submissions" style="font-size: ' . self::FONT_SIZE_METADATA . '; color: #50575e; text-decoration: none;">Jetpack Forms</a>'
					) . '</span>
						</td>
					</tr>
				</table>'
			)
		);

		// Generate respondent info HTML.
		$respondent_html = self::generate_respondent_info_html( $respondent_info );

		// Generate metadata HTML.
		$metadata_html = self::generate_metadata_html( $metadata );

		// Minify CSS to stay under Gmail's 8,192-char limit for style blocks.
		// The template file keeps readable formatting; we strip it here at render time.
		$style = self::minify_css( $style );

		$html_message = sprintf(
			// The tabs are just here so that the raw code is correctly formatted for developers
			// They're removed so that they don't affect the final message sent to users.
			str_replace(
				"\t",
				'',
				$template
			),
			esc_html( $title ),
			$body,
			'',
			'',
			$footer,
			$style,
			$tracking_pixel,
			$actions,
			$powered_by_html,
			$respondent_html,
			$metadata_html
		);

		// Inject print styles into <body> for Outlook.com compatibility (it strips <head> styles
		// but preserves <body> styles). The same styles are already in <head> for Gmail and others.
		// This is done after sprintf to avoid % signs in CSS being interpreted as format specifiers.
		// @phan-suppress-next-line PhanRedundantCondition -- $print_style is set by the template file loaded via require above.
		if ( ! empty( $print_style ) ) {
			$html_message = str_replace( '</body>', '<style type="text/css">' . $print_style . '</style></body>', $html_message );
		}

		return $html_message;
	}

	/**
	 * Generate HTML for respondent info section in email.
	 *
	 * @param array $respondent_info Array with 'name', 'email', 'avatar' keys.
	 * @return string HTML for respondent info section.
	 */
	private static function generate_respondent_info_html( $respondent_info ) {
		if ( empty( $respondent_info ) ) {
			return '';
		}

		$name   = isset( $respondent_info['name'] ) ? esc_html( $respondent_info['name'] ) : '';
		$email  = isset( $respondent_info['email'] ) ? esc_html( $respondent_info['email'] ) : '';
		$avatar = isset( $respondent_info['avatar'] ) ? esc_url( $respondent_info['avatar'] ) : '';

		// Don't show section if there's no name or email.
		if ( empty( $name ) && empty( $email ) ) {
			return '';
		}

		// Get initials for avatar fallback.
		$initials = '';
		if ( ! empty( $name ) ) {
			$name_parts = explode( ' ', $name );
			$initials   = strtoupper( substr( $name_parts[0], 0, 1 ) );
			if ( count( $name_parts ) > 1 ) {
				$initials .= strtoupper( substr( end( $name_parts ), 0, 1 ) );
			}
		} elseif ( ! empty( $email ) ) {
			$initials = strtoupper( substr( $email, 0, 1 ) );
		}

		// Avatar content - either image or initials.
		$avatar_content = ! empty( $avatar )
			? '<img src="' . $avatar . '" alt="" width="48" height="48" style="border-radius: 24px; vertical-align: middle;">'
			: esc_html( $initials );

		// Use table layout for maximum email client compatibility.
		$html = '
		<table role="presentation" border="0" cellpadding="0" cellspacing="0" class="respondent-table" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; margin-bottom: 16px;">
			<tr>
				<td class="respondent-avatar-cell" style="width: 64px; vertical-align: middle; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen-Sans, Ubuntu, Cantarell, \'Helvetica Neue\', sans-serif;">
					<!--[if mso]>
					<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="48" height="48" style="width: 48px; height: 48px;">
					<tr>
					<td align="center" valign="middle" style="width: 48px; height: 48px; background-color: #f0f0f0; border-radius: 24px; font-size: 18px; font-weight: 600; color: #50575e;">
					<![endif]-->
					<div class="respondent-avatar-wrapper" style="width: 48px; height: 48px; border-radius: 24px; background-color: #f0f0f0; text-align: center; line-height: 48px; font-size: 18px; font-weight: 600; color: #50575e;">
						' . $avatar_content . '
					</div>
					<!--[if mso]>
					</td>
					</tr>
					</table>
					<![endif]-->
				</td>
				<td class="respondent-details-cell" style="vertical-align: middle; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen-Sans, Ubuntu, Cantarell, \'Helvetica Neue\', sans-serif;">
					' . ( ! empty( $name ) ? '<div class="respondent-name" style="font-size: ' . self::FONT_SIZE_FIELD_VALUE . '; font-weight: 600; color: ' . self::TEXT_COLOR . '; margin: 0 0 2px 0; line-height: 1.4;">' . $name . '</div>' : '' ) . '
					' . ( ! empty( $email ) ? '<div class="respondent-email" style="font-size: ' . self::FONT_SIZE_BUTTON . '; margin: 0; line-height: 1.4;"><a href="mailto:' . $email . '" style="color: ' . self::TEXT_SECONDARY_COLOR . '; text-decoration: underline;">' . $email . '</a></div>' : '' ) . '
				</td>
			</tr>
		</table>';

		return str_replace( "\t", '', $html );
	}

	/**
	 * Generate HTML for metadata section in email.
	 *
	 * @param array $metadata Array with 'date', 'source', 'source_url', 'device', 'ip', 'ip_flag' keys.
	 * @return string HTML for metadata section.
	 */
	private static function generate_metadata_html( $metadata ) {
		if ( empty( $metadata ) ) {
			return '';
		}

		$rows = array();

		// Date row.
		if ( ! empty( $metadata['date'] ) ) {
			$rows[] = self::generate_metadata_row( __( 'Date', 'jetpack-forms' ), esc_html( $metadata['date'] ) );
		}

		// Source row.
		if ( ! empty( $metadata['source'] ) ) {
			$source_value = esc_html( $metadata['source'] );
			if ( ! empty( $metadata['source_url'] ) ) {
				$source_value = '<a href="' . esc_url( $metadata['source_url'] ) . '" style="color: ' . self::LINK_COLOR . '; text-decoration: underline;">' . $source_value . '</a>';
			}
			$rows[] = self::generate_metadata_row( __( 'Source', 'jetpack-forms' ), $source_value );
		}

		// Device row.
		if ( ! empty( $metadata['device'] ) ) {
			$rows[] = self::generate_metadata_row( __( 'Device', 'jetpack-forms' ), esc_html( $metadata['device'] ) );
		}

		// IP Address row.
		if ( ! empty( $metadata['ip'] ) ) {
			$ip_value = '';
			if ( ! empty( $metadata['ip_flag'] ) ) {
				$ip_value .= $metadata['ip_flag'] . ' ';
			}
			$ip_value .= esc_html( $metadata['ip'] );
			$rows[]    = self::generate_metadata_row( __( 'IP address', 'jetpack-forms' ), $ip_value );
		}

		if ( empty( $rows ) ) {
			return '';
		}

		// Use table layout for maximum email client compatibility.
		$html = '
		<table role="presentation" border="0" cellpadding="0" cellspacing="0" class="metadata-table" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; margin-bottom: 24px;">
			' . implode( '', $rows ) . '
			<tr><td colspan="2" style="padding: 24px 0 0 0; border-bottom: 1px solid #E4E4E7; font-size: 0; line-height: 0;">&nbsp;</td></tr>
		</table>';

		return str_replace( "\t", '', $html );
	}

	/**
	 * Generate a single metadata row.
	 *
	 * @param string $label The label text.
	 * @param string $value The value (can contain HTML).
	 * @return string HTML for the row.
	 */
	private static function generate_metadata_row( $label, $value ) {
		return '
			<tr>
				<td class="metadata-label" style="color: #50575e; width: 100px; padding: 4px 12px 4px 0; font-size: ' . self::FONT_SIZE_METADATA . '; vertical-align: top; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen-Sans, Ubuntu, Cantarell, \'Helvetica Neue\', sans-serif; line-height: 1.4;">' . esc_html( $label ) . ':</td>
				<td class="metadata-value" style="color: #1e1e1e; padding: 4px 0; font-size: ' . self::FONT_SIZE_METADATA . '; vertical-align: top; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen-Sans, Ubuntu, Cantarell, \'Helvetica Neue\', sans-serif; line-height: 1.4;">' . $value . '</td>
			</tr>';
	}

	/**
	 * Minify a CSS string by removing comments, collapsing whitespace,
	 * and stripping unnecessary characters.
	 *
	 * Gmail imposes an 8,192-character limit across all <style> blocks.
	 * This keeps the template file readable while fitting under the limit.
	 *
	 * @param string $css The CSS string (may include <style> tags).
	 * @return string The minified CSS string.
	 */
	private static function minify_css( $css ) {
		// Remove CSS comments.
		$css = preg_replace( '/\/\*.*?\*\//s', '', $css );
		// Collapse all whitespace (tabs, newlines, spaces) into single spaces.
		$css = preg_replace( '/\s+/', ' ', $css );
		// Remove spaces around CSS punctuation: { } ; : ,
		$css = preg_replace( '/\s*([{};,])\s*/', '$1', $css );
		// Remove space after colons in all contexts.
		$css = preg_replace( '/:\s+/', ':', $css );
		// Remove trailing semicolons before closing braces.
		$css = str_replace( ';}', '}', $css );
		return trim( $css );
	}
}
