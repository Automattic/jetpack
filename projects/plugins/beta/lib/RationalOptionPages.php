<?php

/**
 * RationalOptionPages class
 *
 * @category	WordPress Development
 * @package		RationalOptionPages
 * @author		Jeremy Hixon <jeremy@jeremyhixon.com>
 * @copyright	Copyright (c) 2016
 * @link		http://jeremyhixon.com
 * @version		1.0.0
 * phpcs:ignoreFile -- this is not a core file
 */
class RationalOptionPages {
	/* ==========================================================================
	   Vars
	   ========================================================================== */
	protected $attributes = array(
		'input'		=> array(
			'autocomplete'	=> false,
			'autofocus'		=> false,
			'disabled'		=> false,
			'list'			=> false,
			'max'			=> false,
			'maxlength'		=> false,
			'min'			=> false,
			'pattern'		=> false,
			'readonly'		=> false,
			'required'		=> false,
			'size'			=> false,
			'step'			=> false,
		),
		'select'	=> array(
			'multiple'	=> false,
			'size'		=> 4,
		),
		'textarea'	=> array(
			'cols'		=> 20,
			'rows'		=> 2,
			'wrap'		=> 'soft',
		),
	);
	protected $defaults = array(
		'add_menu_page'			=> array(
			'page_title'			=> 'Option Page',
			'menu_title'			=> 'Option Page',
			'capability'			=> 'manage_options',
			'menu_slug'				=> 'option_page',
			'callback'				=> false,
			'icon_url'				=> false,
			'position'				=> null,
		),
		'add_settings_field'	=> array(
			'id'					=> 'settings_field',
			'title'					=> 'Settings Field',
			'callback'				=> false,
			'page'					=> 'option_page',
			'section'				=> 'settings_section',
			'args'					=> false,
		),
		'add_settings_section'	=> array(
			'id'					=> 'settings_section',
			'title'					=> 'Settings Section',
			'callback'				=> false,
			'page'					=> 'option_page',
		),
		'add_submenu_page'		=> array(
			'parent_slug'			=> 'option_page',
			'page_title'			=> 'Sub Option Page',
			'menu_title'			=> 'Sub Option Page',
			'capability'			=> 'manage_options',
			'menu_slug'				=> 'sub_option_page',
			'callback'				=> false,
		),
	);
	protected $errors;
	protected $fields = array(
		'checkbox'		=> array(
			'checked'		=> false,
			'value'			=> 'on',
		),
		'text'			=> array(
			'class'			=> 'regular-text',
			'placeholder'	=> '',
			'value'			=> false,
		),
		'textarea'		=> array(
			'class'			=> 'large-text',
			'placeholder'	=> '',
			'rows'			=> 10,
			'value'			=> false,
		),
		'wp_editor'		=> array(
			'wpautop'			=> true,
			'media_buttons'		=> true,
			'textarea_rows'		=> 'default',
			'tabindex'			=> false,
			'editor_css'		=> false,
			'editor_class'		=> '',
			'editor_height'		=> false,
			'teeny'				=> false,
			'dfw'				=> false,
			'tinymce'			=> true,
			'quicktags'			=> true,
			'drag_drop_upload'	=> false,
		),
	);
	protected $media_script = false;
	protected $notices;
	protected $options;
	protected $pages = array();
	protected $subpages = array();
	protected $points;

	/* ==========================================================================
	   Magic methods
	   ========================================================================== */
	/**
	 * Catches unknown method calls
	 *
	 * @param	string	$method		The method being requested
	 * @param	array	$arguments	Array of arguments passed to the method
	 */
	public function __call( $method, $arguments ) {
		$request = explode( '|', $method );
		$source = $request[0];
		$page_key = !empty( $request[1] ) ? $request[1] : false;
		$section_key = !empty( $request[2] ) ? $request[2] : false;
		$field_key = !empty( $request[3] ) ? $request[3] : false;

		switch ( $source ) {
			case 'add_menu_page':
			case 'add_submenu_page':
				$this->build_menu_page( $page_key );
				break;
			case 'add_settings_section':
				$this->build_settings_section( $page_key, $section_key );
				break;
			case 'add_settings_field':
				$this->build_settings_field( $page_key, $section_key, $field_key );
				break;
			case 'register_setting':
				$input = $this->sanitize_setting( $page_key, $arguments[0] );
				return $input;
				break;
			default:
				$this->submit_notice( $method );
		}
	}

	/**
	 * Class construct method. Configures class and hooks into WordPress.
	 *
	 * @param	array	$pages	Array of option pages
	 */
	public function __construct( $pages = array() ) {
		foreach ( $pages as $page_key => $page_params ) {
			$this->pages[ $page_key ] = $this->validate_page( $page_key, $page_params );
		}
		$this->pages = array_merge( $this->pages, $this->subpages );

		add_action( 'admin_enqueue_scripts', array( $this, 'admin_enqueue_scripts' ) );
		add_action( 'admin_head', array( $this, 'admin_head' ) );
		add_action( 'admin_init', array( $this, 'admin_init' ) );
		add_action( 'admin_menu', array( $this, 'admin_menu' ) );
		add_action( 'admin_notices', array( $this, 'admin_notices' ) );
	}

	/* ==========================================================================
	   WordPress hooks
	   ========================================================================== */
	/**
	 * Action: admin_enqueue_scripts
	 * Conditionally queue's up jQuery and the media uploader script
	 */
	public function admin_enqueue_scripts() {
		if ( $this->media_script ) {
			wp_enqueue_script( 'jquery' );
			wp_enqueue_media();
		}
	}

	/**
	 * Action: admin_head
	 * Conditionally adds the script to manage media uploads
	 */
	public function admin_head() {
		if ( $this->media_script ) {
?>			<script>
				jQuery.noConflict();
				(function($) {
					$(function() {
						var mediaUploader,
							rationalMediaButton = $( '.rational-media-upload' ),
							rationalMediaAttachment;

						rationalMediaButton.click( function( e ) {
							e.preventDefault();
							var rationalMediaDestination = $( this ).prev( 'input' );

							if ( mediaUploader ) {
								mediaUploader.open();
								return;
							}

							mediaUploader = wp.media.frames.file_frame = wp.media( {
								title:		'Choose File',
								button:		{
									text:		'Choose File',
								},
								multiple:	false,
							} );

							mediaUploader.on( 'select', function() {
								rationalMediaAttachment = mediaUploader.state().get('selection').first().toJSON();
								rationalMediaDestination.val( rationalMediaAttachment.url );
							} );

							mediaUploader.open();
						} );
					});
				})(jQuery);
			</script>
<?php	}
	}

	/**
	 * Action: admin_init
	 * Registers settings, adds sections and fields
	 */
	public function admin_init() {
		foreach ( $this->pages as $page_key => $page_params ) {
			// Finalize sanitize
			if ( empty( $page_params['custom'] ) && !is_array( $page_params['sanitize'] ) ) {
				$page_params['sanitize'] = array( $this, $page_params['sanitize'] );
			}

			register_setting(
				$page_key,
				$page_key,
				$page_params['sanitize']
			);

			if ( !empty( $page_params['sections'] ) ) {
				foreach ( $page_params['sections'] as $section_key => $section_params ) {
					// Sort and trim the array for the function
					$sort_order = array_keys( $this->defaults['add_settings_section'] );
					$params = $this->sort_array( $section_params, $sort_order );
					$params = array_slice( $params, 0, count( $this->defaults['add_settings_section'] ) );

					// Finalize callback
					if ( empty( $params['custom'] ) && !is_array( $params['callback'] ) ) {
						$params['callback'] = array( $this, $params['callback'] );
					}

					call_user_func_array( 'add_settings_section', $params );

					if ( !empty( $section_params['fields'] ) ) {
						foreach ( $section_params['fields'] as $field_key => $field_params ) {
							// Check for "media" type for adding script
							if ( !$this->media_script && $field_params['type'] === 'media' ) {
								$this->media_script = true;
							}

							// Sort and trim the array for the function
							$sort_order = array_keys( $this->defaults['add_settings_field'] );
							$params = $this->sort_array( $field_params, $sort_order );
							$params = array_slice( $params, 0, count( $this->defaults['add_settings_field'] ) );

							// Add label wrapper on title
							if (
								!in_array( $field_params['type'], array( 'radio' ) ) &&
								( empty( $field_params['no_label'] ) || $field_params['no_label'] === false )
							) {
								$params['title'] = "<label for='{$params['id']}'>{$params['title']}</label>";
							}

							// Finalize callback
							if ( empty( $params['custom'] ) && !is_array( $params['callback'] ) ) {
								$params['callback'] = array( $this, $params['callback'] );
							}

							call_user_func_array( 'add_settings_field', $params );
						}
					}
				}
			}
		}
	}

	/**
	 * Action: admin_menu. Adding the option pages to the admin menu.
	 */
	public function admin_menu() {
		$all_pages = array_merge( $this->pages, $this->subpages );

		foreach ( $all_pages as $page ) {
			// Sort and trim the array for the function
			$sort_order = array_keys( $this->defaults[ $page['function'] ] );
			$params = $this->sort_array( $page, $sort_order );
			$params = array_slice( $params, 0, count( $this->defaults[ $page['function'] ] ) );

			// Finalize callback
			$params['callback'] = array( $this, $params['callback'] );

			call_user_func_array( $page['function'], $params );
		}
	}

	/**
	 * Action: admin_notices. Spitting out notices when needed.
	 */
	public function admin_notices() {
		// notice-error, notice-warning, notice-success, or notice-info.
		if ( !empty( $this->errors ) ) {
			foreach ( $this->errors as $error ) {
				echo $error;
			}
		}
		if ( !empty( $this->notices ) ) {
			foreach ( $this->notices as $notice ) {
				echo $notice;
			}
		}

		// update point in array for future reference
		$this->points['admin_notices'] = true;
	}

	/* ==========================================================================
	   Helpers
	   ========================================================================== */
	public function add_page( $page_key, $page_params ) {
		$this->pages[ $page_key ] = $this->validate_page( $page_key, $page_params );
	}

	/**
	 * Builds the menu page
	 *
	 * @param	string	$page_key	The array key of the page needing built
	 */
	protected function build_menu_page( $page_key ) {
		$page = $this->pages[ $page_key ];
		$this->options = get_option( $page_key, array() );
		?><div class="wrap">
			<h1><?php echo $GLOBALS['title']; ?></h1><?php

			if ( !empty( $page['sections'] ) ) {
				?><form action="options.php" method="post"><?php
					settings_errors( $page_key );
					settings_fields( $page_key );
					do_settings_sections( $page['menu_slug'] );
					if ( $this->has_fields( $page ) ) {
						submit_button();
					}
				?></form><?php
			}
		?></div><?php
	}

	/**
	 * Builds the fields themselves
	 *
	 * @param	string	$page_key		The array key of the page
	 * @param	string	$section_key	The array key of the section
	 * @param	string	$field_key		The array key of the field
	 */
	protected function build_settings_field( $page_key, $section_key, $field_key ) {
		$page = $this->pages[ $page_key ];
		$section = $page['sections'][ $section_key ];
		$field = $section['fields'][ $field_key ];

		if ( $field['type'] !== 'checkbox' ) {
			$field['value'] = !empty( $this->options[ $field['id'] ] ) ? $this->options[ $field['id'] ] : $field['value'];
		}

		// Additional attributes
		if ( !empty( $field['attributes'] ) ) {
			$attributes = array();
			foreach ( $field['attributes'] as $attribute => $value ) {
				if ( !empty( $value ) ) {
					$attributes[] = "{$attribute}='{$value}'";
				}
			}
		}

		// Sanitize field values, unless 'sanitize' was set to false for this field.
		if ( !isset( $field['sanitize'] ) || $field['sanitize']) {
			$field['value'] = strip_tags($field['value']);		// Removes HTML tags
			$field['value'] = esc_attr($field['value']);		// Escapes field for HTML attributes
		}

		switch ( $field['type'] ) {
			case 'checkbox':
				$checked = $field['checked'] ? 'checked' : '';
				if ( isset( $this->options[ $field['id'] ] ) ) {
					$checked = checked( $field['value'], $this->options[ $field['id'] ], false );
				}
				printf(
					'<label><input %s %s id="%s" name="%s" title="%s" type="checkbox" value="%s">&nbsp; %s</label>',
					$checked,																			// checked
					!empty( $field['class'] ) ? "class='{$field['class']}'" : '',						// class
					$field['id'],																		// id
					"{$page_key}[{$field['id']}]",														// name
					$field['title_attr'],																// title
					$field['value'],																	// value
					!empty( $field['text'] ) ? $field['text'] : ''										// text
				);
				break;
			case 'media':
				$upload_button = sprintf(
					'<input class="button rational-media-upload" type="button" value="Upload">'
				);
				printf(
					'<input %s id="%s" name="%s" %s title="%s" type="text" value="%s" %s>%s%s',
					!empty( $field['class'] ) ? "class='{$field['class']}'" : '',						// class
					$field['id'],																		// id
					"{$page_key}[{$field['id']}]",														// name
					!empty( $field['placeholder'] ) ? "placeholder='{$field['placeholder']}'" : '',		// placeholder
					$field['title_attr'],																// title
					$field['value'],																	// value
					!empty( $attributes ) ? implode( ' ', $attributes ) : '',							// additional attributes
					$upload_button,																		// upload button
					!empty( $field['text'] ) ? "<p class='help'>{$field['text']}</p>" : ''				// text
				);
				break;
			case 'radio':
				echo '<fieldset><legend class="screen-reader-text">' . $field['title'] . '</legend>';
				$c = 0;
				foreach ( $field['choices'] as $value => $label ) {
					$checked = $value === $field['value'] ? 'checked' : '';
					if ( isset( $this->options[ $field['id'] ] ) ) {
						$checked = $value === $this->options[ $field['id'] ] ? 'checked' : '';
					}
					printf(
						'<label><input %s %s id="%s" name="%s" type="radio" title="%s" value="%s">&nbsp; %s</label>%s',
						$checked,																			// checked
						!empty( $field['class'] ) ? "class='{$field['class']}'" : '',						// class
						$field['id'],																		// id
						"{$page_key}[{$field['id']}]",														// name
						$label,																				// title
						$value,																				// value
						$label,																				// label
						$c < count( $field['choices'] ) - 1 ? '<br>' : ''									// line-break
					);
					$c++;
				}
				echo '</fieldset>';
				break;
			case 'select':
                                if (!empty($field['attributes']) && isset($field['attributes']['multiple']) && $field['attributes']['multiple']) {
                                  $field_tag_name = "{$page_key}[{$field['id']}][]";
                                  $field_name = "{$field['id']}[]";
                                }
                                else {
                                  $field_tag_name = "{$page_key}[{$field['id']}]";
                                  $field_name = "{$field['id']}";
                                }
				printf(
					'<select %s %s id="%s" name="%s" title="%s">',
					!empty( $field['class'] ) ? "class='{$field['class']}'" : '',						// class
                                        !empty( $attributes ) ? implode(' ', $attributes) : '',
					$field['id'],																		// id
					$field_tag_name,														// name
					$field['title_attr']																// title
				);
				foreach ( $field['choices'] as $value => $text ) {
					$selected = $value === $field['value'] ? 'selected' : '';
					if ( isset( $this->options[ $field['id'] ] ) ) {
                                                if (!is_array($this->options[ $field['id'] ] ) ) {
						  $selected = $value === $this->options[ $field['id'] ] ? 'selected="selected"' : '';
                                                }
                                                else {
                                                  $selected = '';
                                                  foreach ($this->options[ $field['id'] ] as $option) {
                                                    if ($value === $option) {
                                                      $selected = 'selected="selected"';
                                                      continue;
                                                    }
                                                  }
                                                }
					}
					printf(
						'<option %s value="%s">%s</option>',
						$selected,																			// selected
						$value,																				// value
						$text																				// text
					);
				}
				echo '</select>';
				break;
			case 'textarea':
				printf(
					'<textarea %s id="%s" name="%s" %s %s title="%s">%s</textarea>%s',
					!empty( $field['class'] ) ? "class='{$field['class']}'" : '',						// class
					$field['id'],																		// id
					"{$page_key}[{$field['id']}]",														// name
					!empty( $field['placeholder'] ) ? "placeholder='{$field['placeholder']}'" : '',		// placeholder
					!empty( $field['rows'] ) ? "rows='{$field['rows']}'" : '',							// rows
					$field['title_attr'],																// title
					$field['value'],																	// value
					!empty( $field['text'] ) ? "<p class='help'>{$field['text']}</p>" : ''				// text
				);
				break;
			case 'wp_editor':
				$field['textarea_name'] = "{$page_key}[{$field['id']}]";
				wp_editor( $field['value'], $field['id'], array(
					'textarea_name'		=> $field['textarea_name'],
				) );
				echo !empty( $field['text'] ) ? "<p class='help'>{$field['text']}</p>" : '';
				break;
			default:
				printf(
					'<input %s id="%s" name="%s" %s title="%s" type="%s" value="%s" %s>%s',
					!empty( $field['class'] ) ? "class='{$field['class']}'" : '',						// class
					$field['id'],																		// id
					"{$page_key}[{$field['id']}]",														// name
					!empty( $field['placeholder'] ) ? "placeholder='{$field['placeholder']}'" : '',		// placeholder
					$field['title_attr'],																// title
					$field['type'],																		// type
					$field['value'],																	// value
					!empty( $attributes ) ? implode( ' ', $attributes ) : '',							// additional attributes
					!empty( $field['text'] ) ? "<p class='help'>{$field['text']}</p>" : ''				// text
				);
		}
	}

	/**
	 * Builds the settings sections
	 *
	 * @param	string	$page_key		The array key of the page
	 * @param	type	$section_key	The array key of the section
	 */
	protected function build_settings_section( $page_key, $section_key ) {
		$page = $this->pages[ $page_key ];
		$section = $page['sections'][ $section_key ];

		echo !empty( $section['text'] ) ? $section['text'] : '';

		if ( !empty( $section['include'] ) ) {
			include $section['include'];
		}
	}

	/**
	 * Determines if the option page has fields or not
	 *
	 * @param	array	$page	The page array
	 *
	 * @return	boolean			True if fields are found, false otherwise
	 */
	protected function has_fields( $page ) {
		if ( !empty( $page['sections'] ) ) {
			foreach ( $page['sections'] as $section ) {
				if ( !empty( $section['fields'] ) ) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Cleans up the option page submissions before submitting to the DB
	 *
	 * @param	string	$page_key	The array key of the page
	 *
	 * @return	array				The sanitized post input
	 */
	protected function sanitize_setting( $page_key, $input ) {
		$page = $this->pages[ $page_key ];

		if ( !empty( $page['sections'] ) ) {
			foreach ( $page['sections'] as $section ) {
				if ( !empty( $section['fields'] ) ) {
					foreach ( $section['fields'] as $field ) {
						switch ( $field['type'] ) {
							case 'checkbox':
								if ( empty( $input[ $field['id'] ] ) ) {
									$input[ $field['id'] ] = false;
								}
								break;
							default:
								// Sanitize by default; skip if this field's 'sanitize' setting is false.
								if ( !isset($field['sanitize'])  || $field['sanitize'] ) {
									$input[ $field['id'] ] = strip_tags($input[ $field['id'] ]);
									$input[ $field['id'] ] = esc_attr($input[ $field['id'] ]);
								}
						}
					}
				}
			}
		}

		return $input;
	}

	/**
	 * Converts human-readable strings into more machine-friendly formats
	 *
	 * @param	string	$text		String to be formatted
	 * @param	string	$separator	The character that fills in spaces
	 *
	 * @return	string				Formatted text
	 */
	protected function slugify( $text, $separator = '_' ) {
		$text = preg_replace( '~[^\\pL\d]+~u', $separator, $text );
		$text = trim( $text, $separator );
		$text = iconv( 'utf-8', 'us-ascii//TRANSLIT', $text );
		$text = strtolower( $text );
		$text = preg_replace( '~[^-\w]+~', '', $text );
		if ( empty( $text ) ) {
			return 'n-a';
		}
		return $text;
	}

	/**
	 * Sorts one array using a second as a guide
	 *
	 * @param	array	$array			Array to be sorted
	 * @param	array	$order_array	Guide array
	 *
	 * @return	array					Sorted array
	 */
	protected function sort_array( $array, $order_array ) {
		$ordered = array();
		foreach ( $order_array as $key ) {
			if ( array_key_exists( $key, $array ) ) {
				$ordered[ $key ] = $array[ $key ];
				unset( $array[ $key ] );
			}
		}
		return $ordered + $array;
	}

	/**
	 * Conditionally outputs an error in WordPress admin
	 *
	 * @param	string	$error	The error to be output
	 */
	public function submit_error( $error ) {
		$error = sprintf(
			'<div class="notice notice-error"><p>%s</p></div>',
			is_array( $error ) || is_object( $error ) ? '<pre>' . htmlspecialchars( print_r( $error, true ) ) . '</pre>' : $error
		);
		if ( empty( $this->points['admin_notices'] ) ) {
			$this->errors[] = $error;
		} else {
			echo $error;
		}
	}

	/**
	 * Conditionally outputs a notice in WordPress admin
	 *
	 * @param	string	$notice	The text to be output
	 */
	public function submit_notice( $notice ) {
		$notice = sprintf(
			'<div class="notice notice-info"><p>%s</p></div>',
			is_array( $notice ) || is_object( $notice ) ? '<pre>' . htmlspecialchars( print_r( $notice, true ) ) . '</pre>' : $notice
		);
		if ( empty( $this->points['admin_notices'] ) ) {
			$this->notices[] = $notice;
		} else {
			echo $notice;
		}
	}

	/**
	 * Validates the field data submitted to the class
	 *
	 * @param	array	$field			Field array
	 * @param	string	$page_key		Array key of the associated page
	 * @param	string	$section_key	Array key of the associated section
	 * @param	string	$field_key		Array key of the field
	 * @param	string	$page			ID of the associated page
	 * @param	type	$section		ID of the associated section
	 *
	 * @return	array					The validated field array
	 */
	protected function validate_field( $field, $page_key, $section_key, $field_key, $page, $section ) {
		// Label
		if ( empty( $field['title'] ) ) {
			$this->submit_error( 'Field parameter "title" is required' );
		}

		// ID
		if ( empty( $field['id'] ) ) {
			$field['id'] = $this->slugify( $field['title'] );
		}

		// Callback
		$field['callback'] = empty( $field['callback'] ) ? "add_settings_field|{$page_key}|{$section_key}|{$field_key}" : $field['callback'];

		// Page
		$field['page'] = $page;

		// Section
		$field['section'] = $section;

		// Type
		$field['type'] = empty( $field['type'] ) ? 'text' : $field['type'];

		// Title attribute
		$field['title_attr'] = empty( $field['title_attr'] ) ? $field['title'] : $field['title_attr'];

		// Choices
		if ( empty( $field['choices'] ) && in_array( $field['type'], array( 'radio', 'select' ) ) ) {
			$this->submit_error( 'Field parameter "choices" is required for the "radio" and "select" type' );
		}

		// Other attributes
		if ( !empty( $field['attributes'] ) ) {
			switch ( $field['type'] ) {
				case 'select':
				case 'textarea':
					$field['attributes'] = wp_parse_args( $field['attributes'], $this->attributes[ $field['type'] ] );
					break;
				default:
					$field['attributes'] = wp_parse_args( $field['attributes'], $this->attributes['input'] );
			}
		}

		// Making sure we haven't missed anything
		switch ( $field['type'] ) {
			case 'checkbox':
				$field = wp_parse_args( $field, $this->fields['checkbox'] );
				break;
			case 'color':
			case 'radio':
			case 'range':
				break;
			case 'date':
				$field['value'] = date( 'Y-m-d', strtotime( $field['value'] ) );
				$field = wp_parse_args( $field, $this->fields['text'] );
				break;
			case 'datetime':
			case 'datetime-local':
				$field['value'] = date( 'Y-m-d\TH:i:s', strtotime( $field['value'] ) );
				$field = wp_parse_args( $field, $this->fields['text'] );
				break;
			case 'month':
				$field['value'] = date( 'Y-m', strtotime( $field['value'] ) );
				$field = wp_parse_args( $field, $this->fields['text'] );
				break;
			case 'textarea':
				$field = wp_parse_args( $field, $this->fields[ $field['type'] ] );
				break;
			case 'time':
				$field['value'] = date( 'H:i:s', strtotime( $field['value'] ) );
				$field = wp_parse_args( $field, $this->fields['text'] );
				break;
			case 'week':
				$field['value'] = date( 'Y-\WW', strtotime( $field['value'] ) );
				$field = wp_parse_args( $field, $this->fields['text'] );
				break;
			case 'wp_editor':
				$field = wp_parse_args( $field, $this->fields['wp_editor'] );
				break;
			default:
				$field = wp_parse_args( $field, $this->fields['text'] );
		}

		return $field;
	}

	/**
	 * Validates the information submitted to the class
	 *
	 * @param	string	$page_key		Array key of the page
	 * @param	array	$page			Array of page parameters
	 * @param	string	$parent_slug	Menu slug of the parent page if there is one
	 *
	 * @return	array					Validated array of page parameters
	 */
	protected function validate_page( $page_key, $page_params, $parent_slug = false ) {
		// Page title
		if ( empty( $page_params['page_title'] ) ) {
			$this->submit_error( 'Page parameter "page_title" is required' );
		}

		// Menu title
		if ( empty( $page_params['menu_title'] ) ) {
			$page_params['menu_title'] = $page_params['page_title'];
		}

		// Menu slug
		if ( empty( $page_params['menu_slug'] ) ) {
			// Basing it off the page title cause it's likely to be more unique than the menu title
			$page_params['menu_slug'] = $this->slugify( $page_params['page_title'] );
		}

		// Menu or submenu item?
		if ( empty( $page_params['parent_slug'] ) && !$parent_slug ) {
			$page_params['function'] = 'add_menu_page';
		} else {
			$page_params['function'] = 'add_submenu_page';
			$page_params['parent_slug'] = $parent_slug ? $parent_slug : $page_params['parent_slug'];
		}

		// Callback
		$page_params['callback'] = "{$page_params['function']}|{$page_key}";

		// Sanitize
		$page_params['sanitize'] = empty( $page_params['sanitize'] ) ? "register_setting|{$page_key}" : $page_params['sanitize'];

		// Make sure we haven't missed anything
		$page_params = wp_parse_args( $page_params, $this->defaults[ $page_params['function'] ] );

		// Subpages?
		if ( !empty( $page_params['subpages'] ) ) {
			foreach ( $page_params['subpages'] as $subpage_key => $subpage ) {
				$this->subpages[ $subpage_key ] = $this->validate_page( $subpage_key, $subpage, $page_params['menu_slug'] );
			}
			unset( $page_params['subpages'] );
		}

		// Sections?
		if ( !empty( $page_params['sections'] ) ) {
			foreach ( $page_params['sections'] as $section_key => $section_params ) {
				$page_params['sections'][ $section_key ] = $this->validate_section( $section_params, $page_key, $section_key, $page_params['menu_slug'] );
			}
		}

		return $page_params;
	}

	/**
	 * Validates the section data submitted to the class
	 *
	 * @param	array	$section		Section array
	 * @param	string	$page_key		Array key of the associated page
	 * @param	string	$section_key	Array key of the associated page
	 * @param	string	$page			ID of the associated page
	 *
	 * @return	array					Validated section array
	 */
	protected function validate_section( $section, $page_key, $section_key, $page ) {
		// Title
		if ( empty( $section['title'] ) ) {
			$this->submit_error( 'Section parameter "title" is required' );
		}

		// ID
		if ( empty( $section['id'] ) ) {
			$section['id'] = $this->slugify( $section['title'] );
		}

		// Callback
		$section['callback'] = empty( $section['callback'] ) ? "add_settings_section|{$page_key}|{$section_key}" : $section['callback'];

		// Page
		$section['page'] = $page;

		// Fields?
		if ( !empty( $section['fields'] ) ) {
			foreach ( $section['fields'] as $field_key => $field_params ) {
				$section['fields'][ $field_key ] = $this->validate_field( $field_params, $page_key, $section_key, $field_key, $page, $section['id'] );
			}
		}

		return $section;
	}
}
