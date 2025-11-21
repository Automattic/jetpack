# Feedback_Author Class Reference

**[→ User Guide](feedback-author.md)** | **[← Back to Index](README.md)**

Technical reference for `Automattic\Jetpack\Forms\ContactForm\Feedback_Author`

**Source:** [`class-feedback-author.php`](../src/contact-form/class-feedback-author.php)

## Constructor

### `__construct()`
[📍 Source](../src/contact-form/class-feedback-author.php#L61)

```php
public function __construct(
    string $name = '',
    string $email = '',
    string $url = '',
    string $first_name = '',
    string $last_name = ''
)
```

**Parameters:**
- `$name` (string) - The name of the author
- `$email` (string) - The email of the author
- `$url` (string) - The URL of the author
- `$first_name` (string) - The first name of the author
- `$last_name` (string) - The last name of the author

All parameters are optional and default to empty strings.

---

## Static Methods

### `from_submission()`
[📍 Source](../src/contact-form/class-feedback-author.php#L76)

Create a Feedback_Author instance from the submission data.

```php
public static function from_submission(
    array $post_data,
    Contact_Form $form
): Feedback_Author
```

**Parameters:**
- `$post_data` (array) - The post data from the form submission
- `$form` (Contact_Form) - The form object

**Returns:** `Feedback_Author` - New author instance with filtered data

**Note:** Automatically applies WordPress comment filters (`pre_comment_author_name`, `pre_comment_author_email`, `pre_comment_author_url`).

---

## Instance Methods

### `get_display_name()`
[📍 Source](../src/contact-form/class-feedback-author.php#L129)

Get the display name of the author.

```php
public function get_display_name(): string
```

**Returns:** `string` - The author's name, or email if name is empty

**Behavior:** Falls back to email if name is not set, ensuring a non-empty display value.

---

### `get_name()`
[📍 Source](../src/contact-form/class-feedback-author.php#L150)

Get the name of the author.

```php
public function get_name(): string
```

**Returns:** `string` - The author's name

**Behavior:**
- If both `first_name` and `last_name` are set, combines them with space and applies `pre_comment_author_name` filter
- Otherwise returns the stored `name` value (already filtered during construction)

---

### `get_email()`
[📍 Source](../src/contact-form/class-feedback-author.php#L169)

Get the email of the author.

```php
public function get_email(): string
```

**Returns:** `string` - The author's email address

---

### `get_url()`
[📍 Source](../src/contact-form/class-feedback-author.php#L178)

Get the URL of the author.

```php
public function get_url(): string
```

**Returns:** `string` - The author's website URL

---

### `get_first_name()`
[📍 Source](../src/contact-form/class-feedback-author.php#L187)

Get the first name of the author (if provided separately).

```php
public function get_first_name(): string
```

**Returns:** `string` - The author's first name

---

### `get_last_name()`
[📍 Source](../src/contact-form/class-feedback-author.php#L196)

Get the last name of the author (if provided separately).

```php
public function get_last_name(): string
```

**Returns:** `string` - The author's last name

---

### `get_avatar_url()`
[📍 Source](../src/contact-form/class-feedback-author.php#L141)

Get the avatar URL of the author.

```php
public function get_avatar_url(): string
```

**Returns:** `string` - The Gravatar URL, or empty string if email is not set

**Note:** Uses WordPress `get_avatar_url()` function.

---

## Private Static Methods

### `get_computed_author_info()`
[📍 Source](../src/contact-form/class-feedback-author.php#L98)

Gets the computed author information with filter application.

```php
private static function get_computed_author_info(
    array $post_data,
    string $type,
    string $filter,
    Contact_Form $form
): string
```

**Parameters:**
- `$post_data` (array) - The post data from the form submission
- `$type` (string) - The type of author information to retrieve ('name', 'email', 'url')
- `$filter` (string) - Filter to apply to the value
- `$form` (Contact_Form) - The form object

**Returns:** `string` - Filtered value for the author information

**Applied Filters:**
- `pre_comment_author_name`
- `pre_comment_author_email`
- `pre_comment_author_url`

---

## WordPress Filter Integration

The class integrates with WordPress comment filters during construction and when combining first/last names:

### Applied Filters

| Filter | Applied To | Purpose |
|--------|-----------|---------|
| `pre_comment_author_name` | Name field | Sanitize and validate author name |
| `pre_comment_author_email` | Email field | Sanitize and validate email |
| `pre_comment_author_url` | URL field | Sanitize and validate URL |

### Filter Pattern

Filters are applied using this pattern:
```php
Contact_Form_Plugin::strip_tags(
    stripslashes(
        apply_filters( $filter, addslashes( $value ) )
    )
);
```

This ensures compatibility with WordPress comment handling while preventing XSS.

---

## Usage Examples

### Basic Usage
```php
$author = new Feedback_Author(
    'John Doe',
    'john@example.com',
    'https://johndoe.com'
);

echo $author->get_display_name(); // "John Doe"
echo $author->get_email();        // "john@example.com"
```

### With First/Last Name
```php
$author = new Feedback_Author(
    '',  // name
    'john@example.com',
    'https://johndoe.com',
    'John',  // first_name
    'Doe'    // last_name
);

echo $author->get_name(); // "John Doe" (combined and filtered)
```

### Display Name Fallback
```php
// No name provided
$author = new Feedback_Author( '', 'john@example.com' );
echo $author->get_display_name(); // "john@example.com"

// With name
$author = new Feedback_Author( 'John Doe', 'john@example.com' );
echo $author->get_display_name(); // "John Doe"
```

---

## See Also

- [Feedback_Author User Guide](feedback-author.md) - Usage examples and patterns
- [Feedback Class Reference](feedback-class.md)
- [Contact_Form Class](#) - Provides field IDs for author extraction
