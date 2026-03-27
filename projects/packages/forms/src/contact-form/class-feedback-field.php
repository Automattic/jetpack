<?php
/**
 * Feedback_Field class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use Automattic\Jetpack\Forms\Jetpack_Forms;

/**
 * Feedback field class.
 *
 * Represents the submitted form data of an individual field.
 */
class Feedback_Field {
	use Country_Code_Utils;

	/**
	 * Cached admin theme color.
	 *
	 * @var string|null
	 */
	private static $admin_theme_color = null;

	/**
	 * The key of the field.
	 *
	 * @var string
	 */
	private $key;

	/**
	 * The label of the field.
	 *
	 * @var string
	 */
	private $label;

	/**
	 * The value of the field.
	 *
	 * @var mixed
	 */
	private $value;

	/**
	 * The type of the field.
	 *
	 * @var string
	 */
	private $type;

	/**
	 * Additional metadata for the field.
	 *
	 * @var array
	 */
	private $meta;

	/**
	 * The original form field ID from the form schema.
	 *
	 * @since 5.5.0
	 *
	 * @var string
	 */
	protected $form_field_id = '';

	/**
	 * Constructor.
	 *
	 * @param string      $key           The key of the field.
	 * @param mixed       $label         The label of the field. Non-string values will be converted to empty string.
	 * @param mixed       $value         The value of the field.
	 * @param string      $type          The type of the field (default is 'basic').
	 * @param array       $meta          Additional metadata for the field (default is an empty array).
	 * @param string|null $form_field_id The original form field ID (default is null).
	 */
	public function __construct( $key, $label, $value, $type = 'basic', $meta = array(), $form_field_id = null ) {
		$this->key           = $key;
		$this->label         = is_string( $label ) ? html_entity_decode( $label, ENT_QUOTES | ENT_HTML5, 'UTF-8' ) : '';
		$this->value         = $value;
		$this->type          = $type;
		$this->meta          = $meta;
		$this->form_field_id = is_string( $form_field_id ) ? $form_field_id : '';
	}

	/**
	 * Get the value of the field.
	 *
	 * @return string
	 */
	public function get_key() {
		return $this->key;
	}

	/**
	 * Get the label of the field.
	 *
	 * @param string $context The context in which the label is being rendered (default is 'default').
	 * @param int    $count   The count of the label occurrences (default is 1).
	 *
	 * @return string
	 */
	public function get_label( $context = 'default', $count = 1 ) {

		$postfix = $count > 1 ? " ({$count})" : '';

		if ( in_array( $context, array( 'api', 'csv' ), true ) ) {
			if ( empty( $this->label ) ) {
				return __( 'Field', 'jetpack-forms' ) . $postfix;
			}

			return $this->label . $postfix;
		}

		return $this->label . $postfix;
	}

	/**
	 * Get the value of the field.
	 *
	 * @return mixed
	 */
	public function get_value() {
		return $this->value;
	}

	/**
	 * Get the original form field ID.
	 *
	 * @since 5.5.0
	 *
	 * @return string
	 */
	public function get_form_field_id() {
		return $this->form_field_id;
	}

	/**
	 * Get the value of the field for rendering.
	 *
	 * @param string $context The context in which the value is being rendered (default is 'default').
	 *
	 * @return string
	 */
	public function get_render_value( $context = 'default' ) {
		switch ( $context ) {
			case 'submit':
				return $this->get_render_submit_value();
			case 'api':
				return $this->get_render_api_value();
			case 'web': // For the post-submission page screen.
				return $this->get_render_web_value();
			case 'email':
				return $this->get_render_email_value();
			case 'email_html':
				return $this->get_render_email_html_value();
			case 'ajax':
				return $this->get_render_web_value(); // For now, we use the same value for ajax and web.
			case 'csv':
				return $this->get_render_csv_value();
			case 'default':
			default:
				return $this->get_render_default_value();
		}
	}

	/**
	 * Get the value of the field for rendering the CSV.
	 *
	 * @return string
	 */
	private function get_render_csv_value() {
		if ( $this->is_of_type( 'image-select' ) ) {
			return implode(
				', ',
				array_map(
					function ( $choice ) {
						$value = $choice['selected'];

						if ( ! empty( $choice['label'] ) ) {
							$value .= ' - ' . $choice['label'];
						}

						return $value;
					},
					$this->value['choices']
				)
			);
		}

		if ( $this->value === null ) {
			return '';
		}

		return $this->get_render_default_value();
	}

	/**
	 * Get the value of the field for rendering the post-submission page.
	 *
	 * @return string|array
	 */
	private function get_render_web_value() {
		if ( $this->is_of_type( 'image-select' ) ) {
			return $this->value;
		}

		// For phone fields, add country flag before the number.
		if ( $this->is_of_type( 'phone' ) || $this->is_of_type( 'telephone' ) ) {
			return $this->get_phone_value_with_flag();
		}

		// For URL fields, return a structured array with the URL for proper link rendering.
		// 'displayValue' preserves the original user input for display text.
		// 'url' is used for the href and may have https:// prepended.
		if ( $this->is_of_type( 'url' ) ) {
			if ( ! empty( $this->value ) ) {
				return array(
					'type'         => 'url',
					'url'          => $this->value,
					'displayValue' => $this->value,
				);
			}
		}

		// For file fields, return a structured array with file metadata for proper rendering.
		if ( $this->is_of_type( 'file' ) ) {
			$files = array();
			if ( isset( $this->value['files'] ) && is_array( $this->value['files'] ) ) {
				foreach ( $this->value['files'] as $file ) {
					if ( ! isset( $file['size'] ) || ! isset( $file['file_id'] ) ) {
						continue;
					}
					$file_id = absint( $file['file_id'] );
					$files[] = array(
						'file_id' => $file_id,
						'name'    => $file['name'] ?? __( 'Attached file', 'jetpack-forms' ),
						'size'    => size_format( $file['size'] ),
						'url'     => apply_filters( 'jetpack_unauth_file_download_url', '', $file_id ),
					);
				}
			}
			return array(
				'type'  => 'file',
				'files' => $files,
			);
		}

		// For rating fields, return a structured array with rating data for star/heart display.
		if ( $this->is_of_type( 'rating' ) ) {
			return $this->get_rating_value();
		}

		return $this->get_render_default_value();
	}

	/**
	 * Get phone value with country flag emoji.
	 *
	 * @return string Phone number with country flag prefix.
	 */
	private function get_phone_value_with_flag() {
		if ( empty( $this->value ) ) {
			return $this->value;
		}

		// Try to extract country code from phone number prefix.
		$country_code = $this->get_country_code_from_phone( $this->value );

		if ( ! empty( $country_code ) ) {
			$flag = self::country_code_to_emoji_flag( $country_code );
			if ( ! empty( $flag ) ) {
				return $flag . ' ' . $this->value;
			}
		}

		return $this->value;
	}

	/**
	 * Extract country code from phone number based on its prefix.
	 *
	 * @param string $phone_number The phone number with country prefix (e.g., "+49 123456789").
	 *
	 * @return string|null The ISO country code (e.g., "DE") or null if not found.
	 */
	private function get_country_code_from_phone( $phone_number ) {
		// Remove spaces and normalize the phone number.
		$normalized = preg_replace( '/\s+/', '', $phone_number );

		// Must start with + for international format.
		if ( strpos( $normalized, '+' ) !== 0 ) {
			return null;
		}

		$prefix_to_country = self::get_phone_prefix_to_country_map();

		foreach ( $prefix_to_country as $prefix => $country ) {
			if ( strpos( $normalized, $prefix ) === 0 ) {
				return $country;
			}
		}

		return null;
	}

	/**
	 * Get rating value as a structured array for web rendering.
	 *
	 * Parses the rating value (format: "rating/max" e.g., "3/5") and returns
	 * a structured array with the rating, max, and iconStyle for star/heart display.
	 *
	 * @return array|string Structured rating data or original value if parsing fails.
	 */
	private function get_rating_value() {
		if ( empty( $this->value ) ) {
			return $this->value;
		}

		// Parse the rating value format: "rating/max" (e.g., "3/5").
		$parts = explode( '/', $this->value );
		if ( count( $parts ) !== 2 ) {
			return $this->value;
		}

		$rating = (int) $parts[0];
		$max    = (int) $parts[1];

		// Validate parsed values.
		if ( $rating < 0 || $max <= 0 ) {
			return $this->value;
		}

		if ( $rating > $max ) {
			return $this->value;
		}
		// Get icon style from meta data (defaults to 'stars').
		$icon_style = $this->get_meta_key_value( 'iconStyle' );
		if ( empty( $icon_style ) ) {
			$icon_style = 'stars';
		}

		return array(
			'type'         => 'rating',
			'rating'       => $rating,
			'maxRating'    => $max,
			'iconStyle'    => $icon_style,
			'displayValue' => $this->value,
		);
	}

	/**
	 * Get the value of the field for rendering the email.
	 *
	 * Returns structured data for type-aware rendering when possible,
	 * similar to get_render_web_value(). The escape_and_sanitize_field_value()
	 * method in Contact_Form already handles all these structured types.
	 *
	 * @return mixed
	 */
	private function get_render_email_value() {
		// Phone: string with country flag prefix.
		if ( $this->is_of_type( 'phone' ) || $this->is_of_type( 'telephone' ) ) {
			return $this->get_phone_value_with_flag();
		}

		// URL: structured array for link rendering.
		if ( $this->is_of_type( 'url' ) && ! empty( $this->value ) ) {
			return array(
				'type'         => 'url',
				'url'          => $this->value,
				'displayValue' => $this->value,
			);
		}

		// File: return raw value (has field_id + files keys).
		if ( $this->is_of_type( 'file' ) ) {
			return $this->value;
		}

		// Rating: structured array with rating data.
		if ( $this->is_of_type( 'rating' ) ) {
			return $this->get_rating_value();
		}

		// Image-select: keep current string format for backward compat.
		if ( $this->is_of_type( 'image-select' ) ) {
			$choices = array();

			foreach ( $this->value['choices'] as $choice ) {
				// On the email, we want to show the actual selected value, not the perceived value, as the options can be shuffled.
				$value = $choice['selected'];

				if ( ! empty( $choice['label'] ) ) {
					$value .= ' - ' . $choice['label'];
				}
				$choices[] = $value;
			}

			return implode( ', ', $choices );
		}

		// Checkbox-multiple: preserve array for chip rendering.
		if ( $this->is_of_type( 'checkbox-multiple' ) && is_array( $this->value ) ) {
			return $this->value;
		}

		return $this->get_render_default_value();
	}

	/**
	 * Get the value of the field rendered as final HTML for the email template.
	 *
	 * Unlike get_render_email_value() which returns structured data for the
	 * backward-compat filter path, this returns ready-to-use HTML for the
	 * type-aware email rendering path.
	 *
	 * @return string HTML for the field value.
	 */
	private function get_render_email_html_value() {
		if ( $this->is_of_type( 'select' ) || $this->is_of_type( 'radio' ) || $this->is_of_type( 'checkbox-multiple' ) ) {
			return $this->render_email_chips( $this->value );
		}
		if ( $this->is_of_type( 'checkbox' ) || $this->is_of_type( 'consent' ) ) {
			return $this->render_email_consent();
		}
		if ( $this->is_of_type( 'phone' ) || $this->is_of_type( 'telephone' ) ) {
			return $this->render_email_phone();
		}
		if ( $this->is_of_type( 'url' ) ) {
			return $this->render_email_url();
		}
		if ( $this->is_of_type( 'rating' ) ) {
			return $this->render_email_rating();
		}
		if ( $this->is_of_type( 'file' ) ) {
			return $this->render_email_file();
		}
		if ( $this->is_of_type( 'image-select' ) ) {
			return $this->render_email_image_select();
		}
		return $this->render_email_default();
	}

	/**
	 * Render an empty value HTML.
	 *
	 * @return string HTML for empty values.
	 */
	private function render_empty_value_html() {
		return '<span style="color: ' . Feedback_Email_Renderer::TEXT_SECONDARY_COLOR . ';">&mdash;</span>';
	}

	/**
	 * Render a default text value for email (text, name, email, textarea, date, time, etc).
	 *
	 * @return string Escaped and formatted HTML.
	 */
	private function render_email_default() {
		if ( empty( $this->value ) && $this->value !== '0' ) {
			return $this->render_empty_value_html();
		}

		return Contact_Form::escape_and_sanitize_field_value( $this->value );
	}

	/**
	 * Render tag/chip values for select, radio, and checkbox-multiple fields.
	 *
	 * @param mixed $value The field value (string or array).
	 * @return string HTML with rounded chip elements.
	 */
	private function render_email_chips( $value ) {
		if ( empty( $value ) && $value !== '0' ) {
			return $this->render_empty_value_html();
		}

		$values = is_array( $value ) ? $value : array( $value );
		$chips  = array();

		foreach ( $values as $item ) {
			$safe_item = esc_html( is_string( $item ) ? $item : (string) $item );
			if ( $safe_item === '' ) {
				continue;
			}
			$chips[] = sprintf(
				'<div style="display: inline-block; height: 24px; padding: 0 8px; margin: 2px 4px 2px 0; background-color: #f0f0f0; border-radius: 2px; font-size: ' . Feedback_Email_Renderer::FONT_SIZE_FIELD_VALUE . '; line-height: 24px; color: %s;">%s</div>',
				Feedback_Email_Renderer::TEXT_COLOR,
				$safe_item
			);
		}

		if ( empty( $chips ) ) {
			return $this->render_empty_value_html();
		}

		return implode( '<br />', $chips );
	}

	/**
	 * Render a consent/checkbox field value as a Yes/No chip.
	 *
	 * @return string HTML with a colored chip.
	 */
	private function render_email_consent() {
		$is_yes = ! empty( $this->value ) && strtolower( trim( (string) $this->value ) ) !== 'no';
		$label  = $is_yes ? __( 'Yes', 'jetpack-forms' ) : __( 'No', 'jetpack-forms' );

		return sprintf(
			'<span style="display: inline-block; padding: 0 8px; border-radius: 2px; font-size: ' . Feedback_Email_Renderer::FONT_SIZE_FIELD_VALUE . '; line-height: 1.4; background-color: #f0f0f0; color: %s;">%s</span>',
			Feedback_Email_Renderer::TEXT_COLOR,
			esc_html( $label )
		);
	}

	/**
	 * Render a phone field value as a clickable tel: link.
	 *
	 * @return string HTML with tel: link.
	 */
	private function render_email_phone() {
		if ( empty( $this->value ) ) {
			return $this->render_empty_value_html();
		}

		$raw_phone    = preg_replace( '/[^\d+]/', '', (string) $this->value );
		$country_code = $this->get_country_code_from_phone( $this->value );
		$flag_prefix  = '';

		if ( ! empty( $country_code ) ) {
			$flag = self::country_code_to_emoji_flag( $country_code );
			if ( ! empty( $flag ) ) {
				$flag_prefix = $flag . ' ';
			}
		}

		return $flag_prefix . sprintf(
			'<a href="tel:%1$s" style="color: %3$s; text-decoration: underline;">%2$s</a>',
			esc_attr( $raw_phone ),
			esc_html( $this->value ),
			self::get_admin_theme_color()
		);
	}

	/**
	 * Render a URL field value as a clickable link.
	 *
	 * @return string HTML with clickable link.
	 */
	private function render_email_url() {
		if ( empty( $this->value ) ) {
			return $this->render_empty_value_html();
		}

		$url = $this->value;

		// Prepend scheme if missing so the href is valid, but display the original input.
		if ( ! preg_match( '/^https?:\/\//i', $url ) ) {
			$url = 'https://' . $url;
		}

		return sprintf(
			'<a href="%1$s" style="color: %3$s; text-decoration: underline;" target="_blank">%2$s</a>',
			esc_url( $url ),
			esc_html( $this->value ),
			self::get_admin_theme_color()
		);
	}

	/**
	 * Render a rating field value as star characters.
	 *
	 * @return string HTML with gold/gray stars.
	 */
	private function render_email_rating() {
		if ( empty( $this->value ) || ! is_string( $this->value ) || strpos( $this->value, '/' ) === false ) {
			return $this->render_email_default();
		}

		$parts = explode( '/', $this->value );
		if ( count( $parts ) !== 2 ) {
			return $this->render_email_default();
		}

		$rating = (int) $parts[0];
		$max    = (int) $parts[1];

		if ( $max <= 0 ) {
			return $this->render_email_default();
		}

		$stars = '';
		for ( $i = 1; $i <= $max; $i++ ) {
			if ( $i <= $rating ) {
				$stars .= '<span style="color: #e6a117; font-size: 20px;">&#9733;</span>';
			} else {
				$stars .= '<span style="color: #cccccc; font-size: 20px;">&#9733;</span>';
			}
		}

		return $stars;
	}

	/**
	 * Render a file field value with thumbnail, file name, size, and download icon.
	 *
	 * @return string HTML with file info.
	 */
	private function render_email_file() {
		// We already know the field is type 'file' (dispatched from get_render_email_html_value).
		// The value may or may not contain 'field_id' depending on how it was loaded,
		// so we only check for the 'files' array rather than using is_file_upload_field().
		if ( ! is_array( $this->value ) || ! isset( $this->value['files'] ) || ! is_array( $this->value['files'] ) ) {
			return $this->render_email_default();
		}

		$files = $this->value['files'];
		if ( empty( $files ) ) {
			return $this->render_empty_value_html();
		}

		$file_items = array();
		foreach ( $files as $file ) {
			if ( empty( $file['file_id'] ) ) {
				continue;
			}

			$file_name = $file['name'] ?? __( 'Attached file', 'jetpack-forms' );
			$file_size = isset( $file['size'] ) ? size_format( $file['size'] ) : '';
			$file_url  = apply_filters( 'jetpack_unauth_file_download_url', '', absint( $file['file_id'] ) );
			$file_type = $file['type'] ?? '';

			$file_items[] = $this->render_email_file_row( $file_name, $file_size, $file_url, $file_type );
		}

		if ( empty( $file_items ) ) {
			return $this->render_empty_value_html();
		}

		return implode( '', $file_items );
	}

	/**
	 * Render a single file row with thumbnail, name/size, and download icon.
	 *
	 * @param string $file_name The file name.
	 * @param string $file_size The formatted file size.
	 * @param string $file_url  The download URL.
	 * @param string $file_type The MIME type of the file.
	 * @return string HTML table for the file row.
	 */
	private function render_email_file_row( $file_name, $file_size, $file_url, $file_type = '' ) {
		$thumbnail_html = $this->get_file_thumbnail_html( $file_name, $file_type );

		// File name — linked if download URL is available.
		$name_html = esc_html( $file_name );
		if ( ! empty( $file_url ) ) {
			$name_html = sprintf(
				'<a href="%1$s" style="color: %2$s; text-decoration: underline;" target="_blank">%3$s</a>',
				esc_url( $file_url ),
				Feedback_Email_Renderer::TEXT_COLOR,
				$name_html
			);
		}

		// File size on a second line.
		$size_html = '';
		if ( ! empty( $file_size ) ) {
			$size_html = sprintf(
				'<div style="font-size: 12px; color: %1$s; line-height: 1.4;">%2$s</div>',
				Feedback_Email_Renderer::TEXT_SECONDARY_COLOR,
				esc_html( $file_size )
			);
		}

		// Download icon (rasterized from @wordpress/icons 'download').
		$download_icon = '';
		if ( ! empty( $file_url ) ) {
			$download_icon_url = Jetpack_Forms::plugin_url() . 'contact-form/images/file-icons/download@2x.png';
			$download_icon     = sprintf(
				'<a href="%1$s" target="_blank" style="text-decoration: none;"><img src="%2$s" width="20" height="20" alt="%3$s" style="display: block; width: 20px; height: 20px; -webkit-user-select: none; user-select: none;" /></a>',
				esc_url( $file_url ),
				esc_url( $download_icon_url ),
				esc_attr__( 'Download', 'jetpack-forms' )
			);
		}

		// Build the file row as a table: [thumbnail] [name + size] [download icon].
		$html  = '<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 4px;">';
		$html .= '<tr>';

		// Thumbnail cell.
		$html .= '<td width="40" valign="middle" style="padding-right: 12px; width: 40px; vertical-align: middle; text-align: center;">';
		$html .= $thumbnail_html;
		$html .= '</td>';

		// Name and size cell.
		$html .= '<td valign="middle" style="font-size: 13px; line-height: 1.4;">';
		$html .= '<div>' . $name_html . '</div>';
		$html .= $size_html;
		$html .= '</td>';

		// Download icon cell.
		if ( ! empty( $download_icon ) ) {
			$html .= '<td width="20" valign="middle" align="right" style="padding-left: 12px; width: 20px;">';
			$html .= $download_icon;
			$html .= '</td>';
		}

		$html .= '</tr>';
		$html .= '</table>';

		return $html;
	}

	/**
	 * Get the thumbnail HTML for a file attachment.
	 *
	 * For previewable files (images: jpg, jpeg, png, gif, webp), uses the actual
	 * file URL as the thumbnail when available. For other file types, falls back
	 * to a file-type icon from the file-icons directory.
	 *
	 * @param string $file_name The original file name (used for extension-based icon lookup).
	 * @param string $file_type The MIME type of the file.
	 * @return string HTML for the thumbnail.
	 */
	private function get_file_thumbnail_html( $file_name = '', $file_type = '' ) {
		$icon_name = self::get_file_icon_name( $file_name, $file_type );
		$icon_url  = Jetpack_Forms::plugin_url() . 'contact-form/images/file-icons/' . $icon_name . '@2x.png';

		return sprintf(
			'<img src="%1$s" width="24" height="24" alt=""
				style="padding: 8px; border-radius: 50%%; width: 24px; height: 24px; background-color: #f0f0f0; -webkit-user-select: none; user-select: none;" />',
			esc_url( $icon_url )
		);
	}

	/**
	 * Map a file to its icon name based on extension then MIME type category.
	 *
	 * Mirrors the JS logic in modules/file-field/view.js getFileIcon().
	 *
	 * @param string $file_name The file name.
	 * @param string $file_type The MIME type.
	 * @return string The icon filename without extension.
	 */
	private static function get_file_icon_name( $file_name, $file_type ) {
		$extension = strtolower( pathinfo( $file_name, PATHINFO_EXTENSION ) );

		$extension_map = array(
			'pdf'  => 'pdf',
			'doc'  => 'txt',
			'docx' => 'txt',
			'txt'  => 'txt',
			'ppt'  => 'ppt',
			'pptx' => 'ppt',
			'xls'  => 'xls',
			'xlsx' => 'xls',
			'csv'  => 'xls',
			'zip'  => 'zip',
			'sql'  => 'sql',
			'cal'  => 'cal',
			'html' => 'html',
			'mp3'  => 'mp3',
			'mp4'  => 'mp4',
			'png'  => 'png',
			'jpg'  => 'png',
			'jpeg' => 'png',
			'gif'  => 'png',
			'webp' => 'png',
		);

		if ( isset( $extension_map[ $extension ] ) ) {
			return $extension_map[ $extension ];
		}

		// Fall back to MIME type category.
		$category     = explode( '/', $file_type )[0] ?? '';
		$category_map = array(
			'image' => 'png',
			'video' => 'mp4',
			'audio' => 'mp3',
		);

		return $category_map[ $category ] ?? 'txt';
	}

	/**
	 * Render an image-select field for email.
	 *
	 * Renders each selected choice as a card with an image thumbnail,
	 * letter code, and label arranged horizontally.
	 *
	 * @return string HTML for the image-select field.
	 */
	private function render_email_image_select() {
		if ( ! is_array( $this->value ) || empty( $this->value['choices'] ) || ! is_array( $this->value['choices'] ) ) {
			return $this->render_empty_value_html();
		}

		$cards = array();
		foreach ( $this->value['choices'] as $choice ) {
			$letter     = isset( $choice['selected'] ) ? esc_html( $choice['selected'] ) : '';
			$label      = ! empty( $choice['label'] ) ? esc_html( $choice['label'] ) : '';
			$image_src  = ! empty( $choice['image']['src'] ) ? esc_url( $choice['image']['src'] ) : '';
			$show_label = ! empty( $choice['showLabels'] );

			// Image thumbnail or gray placeholder at 138×144.
			if ( $image_src !== '' ) {
				$image_html = sprintf(
					'<div style="padding: 8px 8px 0 8px;"><img src="%s" alt="%s" width="138" height="144" style="display: block; width: 138px; height: 144px; object-fit: cover;" /></div>',
					$image_src,
					$label !== '' ? $label : $letter
				);
			} else {
				$placeholder_icon = Jetpack_Forms::plugin_url() . 'contact-form/images/field-icons/field-image-select@2x.png';
				$image_html       = sprintf(
					'<div style="padding: 8px 8px 0 8px;"><div style="width: 138px; height: 144px; background-color: #f0f0f0; text-align: center; line-height: 144px;"><img src="%s" alt="" width="24" height="24" style="vertical-align: middle;" /></div></div>',
					esc_url( $placeholder_icon )
				);
			}

			// Letter code box + label.
			$caption_html = '';
			if ( $letter !== '' ) {
				$caption_html .= sprintf(
					'<span style="display: inline-block; min-width: 1em; padding: 4px; line-height: 1; text-align: center; border: 1px solid #dcdcde; border-radius: 2px; font-size: 11px; font-weight: 600; color: #1e1e1e; vertical-align: baseline;">%s</span>',
					$letter
				);
			}

			if ( $show_label && $label !== '' ) {
				$caption_html .= sprintf(
					' <span style="font-size: 13px; color: #1e1e1e; vertical-align: baseline;">%s</span>',
					$label
				);
			}

			// Card with fixed width matching the admin preview (138px image + 16px padding).
			$card  = '<div style="display: inline-block; vertical-align: top; width: 154px; border: 1px solid #dcdcde; border-radius: 8px; margin: 0 8px 8px 0;">';
			$card .= $image_html;
			if ( $caption_html !== '' ) {
				$card .= sprintf(
					'<div style="padding: 4px 8px 8px 8px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">%s</div>',
					$caption_html
				);
			}
			$card .= '</div>';

			$cards[] = $card;
		}

		if ( empty( $cards ) ) {
			return $this->render_empty_value_html();
		}

		return implode( '', $cards );
	}

	/**
	 * Get the default value of the field for rendering.
	 *
	 * @return string
	 */
	private function get_render_default_value() {
		if ( $this->is_of_type( 'file' ) ) {
			$files = array();
			foreach ( $this->value['files'] as &$file ) {
				if ( ! isset( $file['size'] ) || ! isset( $file['file_id'] ) ) {
					// this shouldn't happen, todo: log this
					continue;
				}
				$file_name = $file['name'] ?? __( 'Attached file', 'jetpack-forms' );
				$file_size = isset( $file['size'] ) ? size_format( $file['size'] ) : '';
				$files[]   = $file_name . ' (' . $file_size . ')';
			}
			return implode( ', ', $files );
		}

		if ( $this->is_of_type( 'image-select' ) ) {
			// Return the array as is.
			return $this->value;
		}

		if ( is_array( $this->value ) ) {
			return implode( ', ', $this->value );
		}

		return $this->value;
	}

	/**
	 * Get the value of the field for the API.
	 *
	 * @return string
	 */
	private function get_render_api_value() {
		if ( $this->is_of_type( 'file' ) ) {
			$files = array();
			$value = $this->value;
			foreach ( $value['files'] as $file ) {
				if ( ! isset( $file['size'] ) || ! isset( $file['file_id'] ) ) {
					// this shouldn't happen, todo: log this
					continue;
				}
				$file_id                = absint( $file['file_id'] );
				$file['file_id']        = $file_id;
				$file['size']           = size_format( $file['size'] );
				$file['url']            = apply_filters( 'jetpack_unauth_file_download_url', '', $file_id );
				$file['is_previewable'] = $this->is_previewable_file( $file );
				$files[]                = $file;
			}
			$value['files'] = $files;
			return $value;
		}

		if ( $this->is_of_type( 'image-select' ) ) {
			// Return the array as is.
			return $this->value;
		}

		if ( $this->is_of_type( 'checkbox-multiple' ) ) {
			// Since API gets format: collection, return the array as is.
			return $this->value;
		}

		if ( is_array( $this->value ) ) {
			// If the value is an array, we can return it as a JSON string.
			return implode( ', ', $this->value );
		}
		// This method is deprecated, use render_value instead.
		return $this->value;
	}
	/**
	 * Get the value of the field for rendering when submitting.
	 *
	 * This method is used to prepare the value for submission, especially for file fields.
	 *
	 * @return array|string The prepared value for submission.
	 */
	private function get_render_submit_value() {
		if ( $this->is_of_type( 'file' ) ) {
			$files = array();
			foreach ( $this->value['files'] as $file ) {
				if ( ! isset( $file['size'] ) || ! isset( $file['file_id'] ) ) {
					// this shouldn't happen, todo: log this
					continue;
				}
				$files[] = array(
					'file_id' => absint( $file['file_id'] ),
					'name'    => $file['name'] ?? '',
					'size'    => absint( $file['size'] ),
					'type'    => $file['type'] ?? '',
				);
			}

			return array(
				'field_id' => $this->get_form_field_id(),
				'files'    => $files,
			);
		}

		return $this->value;
	}

	/**
	 * Check if the field is of a specific type.
	 *
	 * @param string $type The type to check against.
	 *
	 * @return bool True if the field is of the specified type, false otherwise.
	 */
	public function is_of_type( $type ) {
		return $this->type === $type;
	}

	/**
	 * Check if the field should be compiled.
	 *
	 * @return bool
	 */
	public function compile_field() {
		return $this->get_meta_key_value( 'render' ) === false;
	}

	/**
	 * Get the type of the field.
	 *
	 * @return string
	 */
	public function get_type() {
		return $this->type;
	}

	/**
	 * Get the icon filename for a given field type.
	 *
	 * @param string $type The field type.
	 * @return string The icon name (without path or extension).
	 */
	public static function get_icon_name_for_type( $type ) {
		$map = array(
			'text'              => 'field-text',
			'name'              => 'field-name',
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
	 * Get the WordPress admin theme color for use in email links.
	 *
	 * Resolves the site admin's admin_color preference to the matching
	 * --wp-admin-theme-color hex value so email links visually match
	 * the Forms dashboard.
	 *
	 * @return string Hex color string.
	 */
	public static function get_admin_theme_color() {
		if ( self::$admin_theme_color !== null ) {
			return self::$admin_theme_color;
		}

		$color_scheme = 'fresh';
		$admin_user   = get_user_by( 'email', get_option( 'admin_email' ) );
		if ( $admin_user ) {
			$saved = get_user_option( 'admin_color', $admin_user->ID );
			if ( $saved ) {
				$color_scheme = $saved;
			}
		}

		$map = array(
			'fresh'     => '#2271b1',
			'light'     => '#0085ba',
			'blue'      => '#096484',
			'coffee'    => '#c7a589',
			'ectoplasm' => '#a3b745',
			'midnight'  => '#e14d43',
			'ocean'     => '#9ebaa0',
			'sunrise'   => '#dd823b',
			'modern'    => '#3858e9',
		);

		self::$admin_theme_color = $map[ $color_scheme ] ?? '#2271b1';
		return self::$admin_theme_color;
	}

	/**
	 * Get the meta array of the field.
	 *
	 * @return array
	 */
	public function get_meta() {
		return $this->meta;
	}

	/**
	 * Get a specific meta value by key.
	 *
	 * @param string $meta_key The key of the meta to retrieve.
	 *
	 * @return mixed|null Returns the value of the meta key if it exists, null otherwise.
	 */
	public function get_meta_key_value( $meta_key ) {
		if ( isset( $this->meta[ $meta_key ] ) ) {
			return $this->meta[ $meta_key ];
		}
		return null;
	}

	/**
	 * Get the serialized representation of the field.
	 *
	 * @return array
	 */
	public function serialize() {
		return array(
			'key'           => $this->get_key(),
			'label'         => $this->get_label(),
			'value'         => $this->get_value(),
			'type'          => $this->get_type(),
			'meta'          => $this->get_meta(),
			'form_field_id' => $this->get_form_field_id(),
		);
	}
	/**
	 * Create a Feedback_Field object from serialized data.
	 *
	 * @param array $data The serialized data.
	 *
	 * @return Feedback_Field|null Returns a Feedback_Field object or null if the data is invalid.
	 */
	public static function from_serialized( $data ) {
		if ( ! is_array( $data ) || ! isset( $data['key'] ) || ! isset( $data['value'] ) || ! isset( $data['label'] ) ) {
			return null;
		}

		return new self(
			$data['key'],
			$data['label'],
			$data['value'],
			$data['type'] ?? 'basic',
			$data['meta'] ?? array(),
			$data['form_field_id'] ?? ''
		);
	}

	/**
	 * Normalize Unicode characters in a string.
	 *
	 * This is only used for V2 version of the feedback. Since we didn't escape special characters
	 *
	 * @param string $string The string to normalize.
	 *
	 * @return string
	 */
	public static function normalize_unicode( $string ) {
		// Case 1: JSON-style escapes, e.g. "\u003cstrong\u003e" or "\ud83d\ude48"
		if ( strpos( $string, '\u' ) !== false ) {
			$decoded = json_decode( '"' . $string . '"' );
			if ( self::is_valid_json_decode( $decoded ) ) {
				return $decoded;
			}
		}

		// Case 2: Raw surrogate dumps, e.g. "ud83dude48" or "u003cstrongu003e"
		if ( preg_match( '/u[0-9a-fA-F]{4}/', $string ) ) {
			// Add missing backslashes before each uXXXX
			$json_ready = preg_replace( '/u([0-9a-fA-F]{4})/', '\\\\u$1', $string );
			$decoded    = json_decode( '"' . $json_ready . '"' );
			if ( self::is_valid_json_decode( $decoded ) ) {
				return $decoded;
			}
		}

		// Fallback: return unchanged
		return $string;
	}

	/**
	 * Check if the decoded JSON is valid.
	 *
	 * @param mixed $decoded The decoded JSON data.
	 * @return bool True if there are no errors, false otherwise.
	 */
	private static function is_valid_json_decode( $decoded ) {
		return $decoded !== null && json_last_error() === JSON_ERROR_NONE;
	}

	/**
	 * Create a Feedback_Field object from serialized data.
	 *
	 * @param array $data The serialized data.
	 *
	 * @return Feedback_Field|null Returns a Feedback_Field object or null if the data is invalid.
	 */
	public static function from_serialized_v2( $data ) {
		if ( ! is_array( $data ) || ! isset( $data['key'] ) || ! isset( $data['value'] ) || ! isset( $data['label'] ) ) {
			return null;
		}

		if ( is_string( $data['value'] ) ) { // just normalize plain string for now.
			$data['value'] = self::normalize_unicode( $data['value'] );
		}

		if ( is_string( $data['label'] ) ) { // just normalize plain string for now.
			$data['label'] = self::normalize_unicode( $data['label'] );
		}

		return new self(
			$data['key'],
			$data['label'],
			$data['value'],
			$data['type'] ?? 'basic',
			$data['meta'] ?? array(),
			$data['form_field_id'] ?? ''
		);
	}

	/**
	 * Check if the field has a file
	 *
	 * @return bool
	 */
	public function has_file() {
		if ( $this->is_of_type( 'file' ) ) {
			if ( ! isset( $this->value['files'] ) || ! is_array( $this->value['files'] ) ) {
				return false;
			}
			return count( $this->value['files'] ) > 0;
		}

		return false;
	}

	/**
	 * Checks if the file is previewable based on its type or extension.
	 * Only image formats are allowed to be previewed in the modal. PDFs may be previewed in the browser elsewhere, but not in the modal.
	 *
	 * @param array $file File data.
	 * @return bool True if the file is previewable, false otherwise.
	 */
	private function is_previewable_file( $file ) {
		$file_type = strtolower( pathinfo( $file['name'], PATHINFO_EXTENSION ) );
		// Check if the file is previewable based on its type or extension.
		// Note: This is a simplified check and does not match if the file is allowed to be uploaded by the server.
		$previewable_types = array( 'jpg', 'jpeg', 'png', 'gif', 'webp' );
		return in_array( $file_type, $previewable_types, true );
	}
}
