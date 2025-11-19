<?php
/**
 * PDF generation for Jetpack Contact Form responses.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use Dompdf\Dompdf;
use Dompdf\Options;

/**
 * Class Response_PDF
 *
 * Generates a PDF of a response.
 */
class Response_PDF {
	/**
	 * Singleton instance
	 *
	 * @var Response_PDF
	 */
	private static $instance = null;

	/**
	 * Initialize and return singleton instance.
	 *
	 * @return Response_PDF
	 */
	public static function init() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Private constructor to enforce singleton usage via self::init().
	 * Intentionally left empty.
	 */
	private function __construct() {
	}

	/**
	 * Generates and streams a PDF for the given feedback response.
	 *
	 * Uses Dompdf to render the response HTML as a PDF and outputs it
	 * directly to the browser.
	 *
	 * See documentation https://github.com/dompdf/dompdf
	 *
	 * @param int $feedback_id the feedback id.
	 *
	 * @return string
	 */
	public function stream_pdf( $feedback_id ) {
		if ( ! class_exists( Dompdf::class ) ) {
			return '';
		}

		$options = new Options();

		// Allow remote images (http/s), but they're only allowed from same-site urls
		$options->set( 'isRemoteEnabled', true );
		$options->set( 'isHtml5ParserEnabled', true );
		$options->set( 'defaultFont', 'Sans-Serif' );

		$dompdf = new Dompdf( $options );

		$dompdf->setPaper( 'A4', 'portrait' );
		$dompdf->setHttpContext(
			stream_context_create(
				array(
					'ssl' => array(
						'verify_peer'       => false,
						'verify_peer_name'  => false,
						'allow_self_signed' => true,
					),
				)
			)
		);

		$html = $this->get_form_html( $feedback_id );

		$dompdf->loadHtml( $html );

		// Render the HTML as PDF
		$dompdf->render();

		$filename = 'jetpack-forms-response-' . $feedback_id . '.pdf';

		header( 'Content-type: application/pdf', true, 200 );
		header( 'Content-Disposition: attachment; filename=' . $filename );
		header( 'Cache-Control: private' );
		header( 'Expires: 0' );

		// Output the generated PDF to Browser
		$dompdf->stream( $filename, array( 'Attachment' => false ) );

		// Return success indicator (stream() outputs directly and returns void)
		return 'streamed';
	}

	/**
	 * Returns a compiled form with labels and values formatted for the pdf file
	 * in a form of an array of lines.
	 *
	 * @param int               $feedback_id - the feedback ID.
	 * @param Contact_Form|null $form - the form.
	 *
	 * @return array $lines
	 */
	public static function get_compiled_form_fields( $feedback_id, $form ) {
		$compiled_form = array();
		$response      = Feedback::get( $feedback_id );

		if ( $response instanceof Feedback ) {
			// If the response is an instance of Feedback, we can use its method to get compiled fields.
			$compiled_form = $response->get_compiled_fields( 'pdf', 'label|value' );
		}

		/**
		 * This filter allows a site owner to customize the response pdf file, by adding their own HTML around it for example.
		 *
		 * @module contact-form
		 *
		 * @since $$next-version$$
		 *
		 * @param array $compiled_form the form response to be filtered
		 * @param int $feedback_id the ID of the feedback form
		 * @param Contact_Form $form a copy of this object
		 */
		$updated_compiled_form = apply_filters( 'jetpack_forms_response_pdf', $compiled_form, $feedback_id, $form );
		if ( $updated_compiled_form !== $compiled_form ) {
			$compiled_form = $updated_compiled_form;
		} else {
			// add styling to the array
			foreach ( $compiled_form as $key => $value ) {
				$safe_display_label = Contact_Form::escape_and_sanitize_field_label( $value['label'] );
				$safe_display_value = Contact_Form::escape_and_sanitize_field_value( $value['value'] );

				if ( ! empty( $safe_display_label ) ) {
					$compiled_form[ $key ] = sprintf(
						'<p><strong>%1$s</strong><br /><span>%2$s</span></p>',
						Contact_Form::maybe_add_colon_to_label( $safe_display_label ),
						$safe_display_value
					);
				} else {
					$compiled_form[ $key ] = sprintf(
						'<p><span>%s</span></p>',
						$safe_display_value
					);
				}
			}
		}

		return $compiled_form;
	}

	/**
	 * Return Form HTML
	 *
	 * @param int $feedback_id the feedback id.
	 * @return string the HTML of the form or empty when not found.
	 */
	private function get_form_html( $feedback_id ) {

		$response = Feedback::get( $feedback_id );

		if ( ! $response ) {
			return '';
		}

		$header  = '<header>';
		$header .= '';
		if ( $response->get_author() ) {
			$header .= '<h3>' . $response->get_author() . '</h3>';
		}
		if ( $response->get_author_email() ) {
			$header .= '<p>';
			$header .= '<a href="mailto:' . $response->get_author_email() . '">' . $response->get_author_email() . '</a>';
			$header .= '</p>';
		}
		if ( $response->get_time() ) {
			$header .= sprintf(
				/* translators: Placeholder is the date of the form. */
				esc_html__( 'Date: %1$s', 'jetpack-forms' ),
				$response->get_time()
			);
			$header .= '<br/>';
		}
		if ( $response->get_entry_title() ) {
			$header .= sprintf(
				/* translators: Placeholder is the name of the form. */
				esc_html__( 'Source: %1$s', 'jetpack-forms' ),
				$response->get_entry_title()
			);
			$header .= '<br/>';
		}
		if ( $response->get_entry_permalink() ) {
			$header .= sprintf(
				/* translators: Placeholder is the URL of the form. */
				esc_html__( 'Source URL: %1$s', 'jetpack-forms' ),
				'<a href="' . $response->get_entry_permalink() . '">' . $response->get_entry_permalink() . '</a>'
			);
			$header .= '<br/>';
		}

		// Todo add flag when emoji support is added in Dompdf.
		if ( $response->get_ip_address() ) {
			$ip_address = '<span class="ip-address">' .
				( $response->get_country_flag() ? $response->get_country_flag() . ' ' : '' ) . $response->get_ip_address()
				. '</span>';

			$header .= sprintf(
				/* translators: Placeholder is the IP address of the person who submitted a form. */
				esc_html__( 'IP Address: %1$s', 'jetpack-forms' ),
				$ip_address
			);
			$header .= '<br/>';
		}

		if ( $response->get_browser() ) {
			$header .= sprintf(
				/* translators: Placeholder is the Browser address of the person who submitted a form. */
				esc_html__( 'Browser: %1$s', 'jetpack-forms' ),
				$response->get_browser()
			);
			$header .= '<br/>';
		}

		$header .= '</header>';

		$message = implode( '', self::get_compiled_form_fields( $feedback_id, null ) );

		$styles = '<style>
			/**
			 * From wp_enqueue_emoji_styles()
			 * https://github.com/WordPress/WordPress/blob/b924099da883c55c513087fef74e59ae626ebfb4/wp-includes/formatting.php#L5888-L5898
			 */
			 img.wp-smiley, img.emoji {
				display: inline !important;
				border: none !important;
				box-shadow: none !important;
				height: 1em !important;
				width: 1em !important;
				margin: 0 0.07em !important;
				vertical-align: -0.1em !important;
				background: none !important;
				padding: 0 !important;
			}

			body {
				font-size: 14px;
			}

			a {
				color: #000;
				text-decoration: none;
			}

			/* Align the flag with the IP */
			.ip-address {
				display: inline-block;
				vertical-align: middle !important;
			}
		</style>';

		// Dompdf does not support emojis: https://github.com/dompdf/dompdf/issues/1698,
		// and hence we're using `wp_staticize_emoji()` to convert them to images.
		// See potential workaround: https://www.beaubus.com/blog/add_emoji_support_to_dompdf.html
		$html = '<html><head><meta charset="UTF-8">'
			. $styles
			. '</head><body><article>'
			. wp_staticize_emoji( $header )
			. wp_staticize_emoji( $message )
			. '</article></body></html>';

		/**
		 * Filter the filename of the template HTML surrounding the response email. The PHP file will return the template in a variable called $template.
		 *
		 * @module contact-form
		 *
		 * @since $$next-version$$
		 *
		 * @param string the HTML body of the pdf
		 */
		$html = apply_filters( 'jetpack_forms_response_pdf_template', $html );

		return $html;
	}
}
