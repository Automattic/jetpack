# Feedback_Field Class Reference

**[→ User Guide](feedback-field.md)** | **[← Back to Index](README.md)**

Technical reference for `Automattic\Jetpack\Forms\ContactForm\Feedback_Field`

**Source:** [`class-feedback-field.php`](../src/contact-form/class-feedback-field.php)

## Constructor

### `__construct()`
[📍 Source](../src/contact-form/class-feedback-field.php#L71)

```php
public function __construct(
    string $key,
    mixed $label,
    mixed $value,
    string $type = 'basic',
    array $meta = array(),
    ?string $form_field_id = null
)
```

**Parameters:**
- `$key` (string) - The key of the field
- `$label` (mixed) - The label of the field (non-string values converted to empty string)
- `$value` (mixed) - The value of the field
- `$type` (string) - The type of the field (default: 'basic')
- `$meta` (array) - Additional metadata for the field (default: empty array)
- `$form_field_id` (string|null) - The original form field ID (default: null)

---

## Static Methods

### `from_serialized()`
[📍 Source](../src/contact-form/class-feedback-field.php#L399)

Create a Feedback_Field object from serialized data.

```php
public static function from_serialized( array $data ): ?Feedback_Field
```

**Parameters:**
- `$data` (array) - The serialized data

**Returns:** `Feedback_Field|null` - Field object or null if data is invalid

---

### `from_serialized_v2()`
[📍 Source](../src/contact-form/class-feedback-field.php#L463)

Create a Feedback_Field object from serialized data (v2 format with Unicode normalization).

```php
public static function from_serialized_v2( array $data ): ?Feedback_Field
```

**Parameters:**
- `$data` (array) - The serialized data

**Returns:** `Feedback_Field|null` - Field object or null if data is invalid

---

### `normalize_unicode()`
[📍 Source](../src/contact-form/class-feedback-field.php#L423)

Normalize Unicode characters in a string (for V2 format).

```php
public static function normalize_unicode( string $string ): string
```

**Parameters:**
- `$string` (string) - The string to normalize

**Returns:** `string` - Normalized string

**Note:** Handles JSON-style escapes (e.g., `\u003cstrong\u003e`) and raw surrogate dumps.

---

## Instance Methods

### Basic Getters

#### `get_key()`
[📍 Source](../src/contact-form/class-feedback-field.php#L85)

Get the key of the field.

```php
public function get_key(): string
```

**Returns:** `string` - Field key (e.g., "1_Name")

---

#### `get_label()`
[📍 Source](../src/contact-form/class-feedback-field.php#L97)

Get the label of the field.

```php
public function get_label( string $context = 'default', int $count = 1 ): string
```

**Parameters:**
- `$context` (string) - The context in which the label is being rendered (default: 'default')
- `$count` (int) - The count of the label occurrences (default: 1)

**Returns:** `string` - Field label (adds "(count)" suffix if count > 1, "Field" if empty in 'api'/'csv' context)

---

#### `get_value()`
[📍 Source](../src/contact-form/class-feedback-field.php#L117)

Get the raw value of the field.

```php
public function get_value(): mixed
```

**Returns:** `mixed` - Raw field value

---

#### `get_type()`
[📍 Source](../src/contact-form/class-feedback-field.php#L350)

Get the type of the field.

```php
public function get_type(): string
```

**Returns:** `string` - Field type (e.g., 'text', 'email', 'file')

---

#### `get_form_field_id()`
[📍 Source](../src/contact-form/class-feedback-field.php#L128)

Get the original form field ID.

```php
public function get_form_field_id(): string
```

**Returns:** `string` - Form field ID

**Since:** 5.5.0

---

#### `get_meta()`
[📍 Source](../src/contact-form/class-feedback-field.php#L359)

Get the meta array of the field.

```php
public function get_meta(): array
```

**Returns:** `array` - Metadata array

---

#### `get_meta_key_value()`
[📍 Source](../src/contact-form/class-feedback-field.php#L370)

Get a specific meta value by key.

```php
public function get_meta_key_value( string $meta_key ): mixed
```

**Parameters:**
- `$meta_key` (string) - The key of the meta to retrieve

**Returns:** `mixed|null` - Value of the meta key if it exists, null otherwise

---

### Rendering

#### `get_render_value()`
[📍 Source](../src/contact-form/class-feedback-field.php#L139)

Get the value of the field for rendering.

```php
public function get_render_value( string $context = 'default' ): mixed
```

**Parameters:**
- `$context` (string) - The context in which the value is being rendered

**Contexts:**
- `'default'` - Standard rendering
- `'submit'` - Submission format
- `'api'` - API format (includes file URLs)
- `'web'` - Web display
- `'email'` - Email notifications
- `'ajax'` - AJAX responses (same as web)
- `'csv'` - CSV export

**Returns:** `mixed` - Rendered value (format depends on context and field type)

---

### Type Checking

#### `is_of_type()`
[📍 Source](../src/contact-form/class-feedback-field.php#L332)

Check if the field is of a specific type.

```php
public function is_of_type( string $type ): bool
```

**Parameters:**
- `$type` (string) - The type to check against

**Returns:** `bool` - True if the field matches the specified type

---

#### `has_file()`
[📍 Source](../src/contact-form/class-feedback-field.php#L491)

Check if the field has a file.

```php
public function has_file(): bool
```

**Returns:** `bool` - True if field is of type 'file' and has files

---

#### `compile_field()`
[📍 Source](../src/contact-form/class-feedback-field.php#L341)

Check if the field should be compiled (rendered).

```php
public function compile_field(): bool
```

**Returns:** `bool` - True if field should NOT be rendered (has `'render' => false` in meta)

---

### Serialization

#### `serialize()`
[📍 Source](../src/contact-form/class-feedback-field.php#L382)

Get the serialized representation of the field.

```php
public function serialize(): array
```

**Returns:** `array` - Array with keys: `key`, `label`, `value`, `type`, `meta`, `form_field_id`

---

## Private Methods

### `get_render_default_value()`
[📍 Source](../src/contact-form/class-feedback-field.php#L230)

Get the default value of the field for rendering.

```php
private function get_render_default_value(): mixed
```

Handles:
- File fields: Returns formatted file names with sizes
- Image-select fields: Returns array as-is
- Array values: Returns comma-separated string
- Other values: Returns as-is

---

### `get_render_api_value()`
[📍 Source](../src/contact-form/class-feedback-field.php#L262)

Get the value of the field for the API.

```php
private function get_render_api_value(): mixed
```

Enhances file fields with URLs and preview information.

---

### `get_render_submit_value()`
[📍 Source](../src/contact-form/class-feedback-field.php#L300)

Get the value of the field for rendering when submitting.

```php
private function get_render_submit_value(): mixed
```

Prepares structured data for submission processing.

---

### `get_render_web_value()`
[📍 Source](../src/contact-form/class-feedback-field.php#L191)

Get the value of the field for rendering the post-submission page.

```php
private function get_render_web_value(): mixed
```

---

### `get_render_email_value()`
[📍 Source](../src/contact-form/class-feedback-field.php#L204)

Get the value of the field for rendering the email.

```php
private function get_render_email_value(): string
```

Formats image-select choices for plain text email.

---

### `get_render_csv_value()`
[📍 Source](../src/contact-form/class-feedback-field.php#L164)

Get the value of the field for rendering the CSV.

```php
private function get_render_csv_value(): string
```

Flattens image-select choices for CSV export.

---

### `is_previewable_file()`
[📍 Source](../src/contact-form/class-feedback-field.php#L508)

Checks if the file is previewable based on its type or extension.

```php
private function is_previewable_file( array $file ): bool
```

**Parameters:**
- `$file` (array) - File data

**Returns:** `bool` - True if file is an image type (jpg, jpeg, png, gif, webp)

---

### `is_valid_json_decode()`
[📍 Source](../src/contact-form/class-feedback-field.php#L452)

Check if the decoded JSON is valid.

```php
private static function is_valid_json_decode( mixed $decoded ): bool
```

**Parameters:**
- `$decoded` (mixed) - The decoded JSON data

**Returns:** `bool` - True if there are no errors

---

## Field Value Structures

### File Field
```php
[
    'files' => [
        [
            'file_id' => 12345,
            'name'    => 'document.pdf',
            'size'    => 1024000,
            'type'    => 'application/pdf'
        ]
    ]
]
```

### Image Select Field
```php
[
    'type'    => 'image-select',
    'choices' => [
        [
            'perceived'  => 'A',
            'selected'   => 'B',
            'label'      => 'Option B',
            'showLabels' => true,
            'image'      => [
                'id'  => 123,
                'src' => 'https://...'
            ]
        ]
    ]
]
```

## Common Field Types

| Type | Description |
|------|-------------|
| `basic` | Generic field type |
| `text` | Plain text input |
| `name` | Name field |
| `email` | Email address |
| `url` | Website URL |
| `textarea` | Multi-line text |
| `select` | Dropdown selection |
| `radio` | Radio button |
| `checkbox` | Single checkbox |
| `checkbox-multiple` | Multiple checkboxes |
| `file` | File upload |
| `image-select` | Image selection |
| `consent` | Consent checkbox |
| `hidden` | Hidden field |
| `subject` | Email subject |
| `ip` | IP address |

## See Also

- [Feedback_Field User Guide](feedback-field.md) - Usage examples and patterns
- [Feedback Class Reference](feedback-class.md)
