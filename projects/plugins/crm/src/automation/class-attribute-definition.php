<?php
/**
 * Attribute Definition
 *
 * @package automattic/jetpack-crm
 * @since 6.2.0
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Attribute Definition.
 *
 * An attribute represents how a step is configured. For example, a step that
 * sends an email to a contact may have an attribute that represents the email
 * subject, another attribute that represents the email body, and so on.
 *
 * @since 6.2.0
 */
class Attribute_Definition {

	/**
	 * Represents a dropdown selection input.
	 *
	 * @since 6.2.0
	 * @var string
	 */
	const SELECT = 'select';

	/**
	 * Represents a checkbox input.
	 *
	 * @since 6.2.0
	 * @var string
	 */
	const CHECKBOX = 'checkbox';

	/**
	 * Represents a textarea input.
	 *
	 * @since 6.2.0
	 * @var string
	 */
	const TEXTAREA = 'textarea';

	/**
	 * Represents a text input.
	 *
	 * @since 6.2.0
	 * @var string
	 */
	const TEXT = 'text';

	/**
	 * Represents a date input.
	 *
	 * @since 6.2.0
	 * @var string
	 */
	const DATE = 'date';

	/**
	 * Represents a numerical input.
	 *
	 * @since 6.2.0
	 * @var string
	 */
	const NUMBER = 'number';

	/**
	 * The slug (key) that identifies this attribute.
	 *
	 * @since 6.2.0
	 * @var string
	 */
	protected $slug;

	/**
	 * The title (label) for this attribute.
	 *
	 * @since 6.2.0
	 * @var string
	 */
	protected $title;

	/**
	 * The description for this attribute.
	 *
	 * @since 6.2.0
	 * @var string
	 */
	protected $description;

	/**
	 * Attribute type.
	 *
	 * This is a string that represents the type of the attribute.
	 * E.g.: 'text', 'number', 'select', etc.
	 *
	 * @since 6.2.0
	 * @var string
	 */
	protected $type;

	/**
	 * Data needed by this attribute (e.g. a map of "key -> description" in the case of a select).
	 *
	 * @since 6.2.0
	 * @var array|null
	 */
	protected $data;

	/**
	 * Constructor.
	 *
	 * @since 6.2.0
	 *
	 * @param string     $slug The slug (key) that identifies this attribute.
	 * @param string     $title The title (label) for this attribute.
	 * @param string     $description The description for this attribute.
	 * @param string     $type Attribute type.
	 * @param array|null $data Data needed by this attribute.
	 */
	public function __construct( string $slug, string $title, string $description, string $type, ?array $data = null ) {
		$this->slug        = $slug;
		$this->title       = $title;
		$this->description = $description;
		$this->type        = $type;
		$this->data        = $data;
	}

	/**
	 * Get the slug.
	 *
	 * @since 6.2.0
	 *
	 * @return string
	 */
	public function get_slug(): string {
		return $this->slug;
	}

	/**
	 * Set the slug.
	 *
	 * @since 6.2.0
	 *
	 * @param string $slug The slug (key) that identifies this attribute.
	 */
	public function set_slug( string $slug ): void {
		$this->slug = $slug;
	}

	/**
	 * Get the title.
	 *
	 * @since 6.2.0
	 *
	 * @return string
	 */
	public function get_title(): string {
		return $this->title;
	}

	/**
	 * Set the title.
	 *
	 * @since 6.2.0
	 *
	 * @param string $title The title (label) for this attribute.
	 */
	public function set_title( string $title ): void {
		$this->title = $title;
	}

	/**
	 * Get the description.
	 *
	 * @since 6.2.0
	 *
	 * @return string
	 */
	public function get_description(): string {
		return $this->description;
	}

	/**
	 * Set the description.
	 *
	 * @since 6.2.0
	 *
	 * @param string $description The description for this attribute.
	 */
	public function set_description( string $description ): void {
		$this->description = $description;
	}

	/**
	 * Get the type.
	 *
	 * @since 6.2.0
	 *
	 * @return string
	 */
	public function get_type(): string {
		return $this->type;
	}

	/**
	 * Set the type.
	 *
	 * @since 6.2.0
	 *
	 * @param string $type The attribute type.
	 */
	public function set_type( string $type ): void {
		$this->type = $type;
	}

	/**
	 * Get the data.
	 *
	 * @since 6.2.0
	 *
	 * @return array|null
	 */
	public function get_data(): ?array {
		return $this->data;
	}

	/**
	 * Set the data.
	 *
	 * @since 6.2.0
	 *
	 * @param array|null $data The data needed by this attribute.
	 */
	public function set_data( ?array $data ): void {
		$this->data = $data;
	}

	/**
	 * Get the attribute definition as an array.
	 *
	 * The main use-case to get the attribute as an array is,
	 * so we can easily share it via API.
	 *
	 * @since 6.2.0
	 *
	 * @return array
	 */
	public function to_array(): array {
		return array(
			'slug'        => $this->get_slug(),
			'title'       => $this->get_title(),
			'description' => $this->get_description(),
			'type'        => $this->get_type(),
			'data'        => $this->get_data(),
		);
	}
}
