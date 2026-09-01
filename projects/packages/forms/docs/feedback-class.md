# Feedback Class Reference

**[→ User Guide](feedback.md)** | **[← Back to Index](README.md)**

Technical reference for `Automattic\Jetpack\Forms\ContactForm\Feedback`

**Source:** [`class-feedback.php`](../src/contact-form/class-feedback.php)

## Constants

### `POST_TYPE`
```php
const POST_TYPE = 'feedback'
```
Custom post type name for feedback entries.

### `STATUS_UNREAD`
```php
public const STATUS_UNREAD = 'open'
```
Comment status for unread feedback.

### `STATUS_READ`
```php
public const STATUS_READ = 'closed'
```
Comment status for read feedback.

## Static Methods

### `get()`
[📍 Source](../src/contact-form/class-feedback.php#L184)

Create a response object from a feedback post ID.

```php
public static function get( int $feedback_post_id ): ?Feedback
```

**Parameters:**
- `$feedback_post_id` (int) - The ID of the feedback post

**Returns:** `Feedback|null` - Feedback instance or null if invalid

---

### `clear_cache()`
[📍 Source](../src/contact-form/class-feedback.php#L207)

Clear the internal cache of feedback objects.

```php
public static function clear_cache(): void
```

Useful for testing or when feedback data needs to be reloaded fresh.

**Since:** 6.10.0

---

### `from_submission()`
[📍 Source](../src/contact-form/class-feedback.php#L268)

Create a response object from a form submission.

```php
public static function from_submission(
    array $post_data,
    Contact_Form $form,
    ?WP_Post $current_post = null,
    int $current_page_number = 1
): Feedback
```

**Parameters:**
- `$post_data` (array) - Typically $_POST
- `$form` (Contact_Form) - The form object
- `$current_post` (WP_Post|null) - The current post object, if available
- `$current_page_number` (int) - The current page number

**Returns:** `Feedback` - New feedback instance

---

### `get_unread_count()`
[📍 Source](../src/contact-form/class-feedback.php#L1091)

Get the count of unread feedback entries.

```php
public static function get_unread_count(): int
```

**Returns:** `int` - Number of unread feedback posts

---

### `process_file_field_value()`
[📍 Source](../src/contact-form/class-feedback.php#L356)

Process the file field value.

```php
public static function process_file_field_value( array $raw_data ): array
```

**Parameters:**
- `$raw_data` (array) - The raw post data from the file field

**Returns:** `array` - Processed file data with structure: `['files' => [...]]`

---

### `process_image_select_field_value()`
[📍 Source](../src/contact-form/class-feedback.php#L389)

Process the image select field value.

```php
public static function process_image_select_field_value( array $raw_data ): array
```

**Parameters:**
- `$raw_data` (array) - The raw post data from the image select field

**Returns:** `array` - Processed image select data with structure: `['type' => 'image-select', 'choices' => [...]]`

---

### `fix_malformed_json()`
[📍 Source](../src/contact-form/class-feedback.php#L1393)

Attempt to fix malformed JSON by escaping unescaped quotes in string values.

```php
public static function fix_malformed_json( string $json ): string
```

**Parameters:**
- `$json` (string) - Malformed JSON string

**Returns:** `string` - The JSON string with escaped quotes

---

## Instance Methods

### Field Access

#### `get_fields()`
[📍 Source](../src/contact-form/class-feedback.php#L458)

Get all the fields of the response.

```php
public function get_fields(): array
```

**Returns:** `array` - Array of Feedback_Field objects

---

#### `get_field_value_by_label()`
[📍 Source](../src/contact-form/class-feedback.php#L418)

Get the computed fields from the post data.

```php
public function get_field_value_by_label( string $label, string $context = 'default' ): string
```

**Parameters:**
- `$label` (string) - The label of the field to look for
- `$context` (string) - The context in which the value is being rendered

**Returns:** `string` - The value of the field

---

#### `has_field_type()`
[📍 Source](../src/contact-form/class-feedback.php#L468)

Check whether this feedback contains at least one field of a given type.

```php
public function has_field_type( string $type ): bool
```

**Parameters:**
- `$type` (string) - Field type to check for (e.g. 'consent', 'email', 'textarea')

**Returns:** `bool` - True if a field of the given type exists

---

#### `get_field_by_form_field_id()`
[📍 Source](../src/contact-form/class-feedback.php#L1891)

Get a field by its original form ID.

```php
public function get_field_by_form_field_id( string $id ): ?Feedback_Field
```

**Parameters:**
- `$id` (string) - Original form field ID

**Returns:** `Feedback_Field|null` - Field object or null if not found

**Since:** 5.5.0

---

#### `get_field_value_by_form_field_id()`
[📍 Source](../src/contact-form/class-feedback.php#L1912)

Get a field render value by its original form ID.

```php
public function get_field_value_by_form_field_id( string $id, string $context = 'default' ): string
```

**Parameters:**
- `$id` (string) - Original form field ID
- `$context` (string) - Render context

**Returns:** `string` - Rendered value or empty string if not found

**Since:** 5.5.0

---

#### `get_compiled_fields()`
[📍 Source](../src/contact-form/class-feedback.php#L579)

Return the compiled fields for the given context.

```php
public function get_compiled_fields( string $context = 'default', string $array_shape = 'all' ): array
```

**Parameters:**
- `$context` (string) - The context in which the fields are compiled
- `$array_shape` (string) - The shape of the array to return: 'all', 'value', 'label', 'key-value', 'label-value', 'label|value'

**Returns:** `array` - Compiled fields with labels and values

---

#### `get_all_values()`
[📍 Source](../src/contact-form/class-feedback.php#L504)

Get all values of the response.

```php
public function get_all_values( string $context = 'default' ): array
```

**Parameters:**
- `$context` (string) - The context in which the values are being retrieved

**Returns:** `array` - Array of all values, including fields and entry values

---

#### `get_legacy_extra_values()`
[📍 Source](../src/contact-form/class-feedback.php#L517)

Get extra values (legacy method).

```php
public function get_legacy_extra_values( string $context = 'default' ): array
```

**Parameters:**
- `$context` (string) - The context in which the values are being retrieved

**Returns:** `array` - Array of extra values, including entry values

---

#### `get_all_legacy_values()`
[📍 Source](../src/contact-form/class-feedback.php#L561)

Get all values of the response in legacy format.

```php
public function get_all_legacy_values(): array
```

**Returns:** `array` - Array with keys: `_feedback_author`, `_feedback_author_email`, `_feedback_author_url`, `_feedback_subject`, `_feedback_ip`, `_feedback_all_fields`

---

### Author Information

#### `get_author()`
[📍 Source](../src/contact-form/class-feedback.php#L721)

Get the author name of the feedback entry. If the author is not provided, returns the email instead.

```php
public function get_author(): string
```

**Returns:** `string` - Display name or email

---

#### `get_author_name()`
[📍 Source](../src/contact-form/class-feedback.php#L730)

Get the author name of a feedback entry.

```php
public function get_author_name(): string
```

**Returns:** `string` - Author name

---

#### `get_author_first_name()`
[📍 Source](../src/contact-form/class-feedback.php#L739)

Get the author's first name of a feedback entry.

```php
public function get_author_first_name(): string
```

**Returns:** `string` - First name

---

#### `get_author_last_name()`
[📍 Source](../src/contact-form/class-feedback.php#L748)

Get the author's last name of a feedback entry.

```php
public function get_author_last_name(): string
```

**Returns:** `string` - Last name

---

#### `get_author_email()`
[📍 Source](../src/contact-form/class-feedback.php#L757)

Get the author email of a feedback entry.

```php
public function get_author_email(): string
```

**Returns:** `string` - Email address

---

#### `get_author_avatar()`
[📍 Source](../src/contact-form/class-feedback.php#L768)

Get the author's gravatar URL.

```php
public function get_author_avatar(): string
```

**Returns:** `string` - Gravatar URL

---

#### `get_author_url()`
[📍 Source](../src/contact-form/class-feedback.php#L777)

Get the author url of a feedback entry.

```php
public function get_author_url(): string
```

**Returns:** `string` - URL

---

### Submission Details

#### `get_subject()`
[📍 Source](../src/contact-form/class-feedback.php#L996)

Get the email subject.

```php
public function get_subject(): string
```

**Returns:** `string` - Subject line

---

#### `get_comment_content()`
[📍 Source](../src/contact-form/class-feedback.php#L786)

Get the comment content of a feedback entry.

```php
public function get_comment_content(): string
```

**Returns:** `string` - Message content

---

#### `get_ip_address()`
[📍 Source](../src/contact-form/class-feedback.php#L795)

Get the IP address of the submitted feedback request.

```php
public function get_ip_address(): ?string
```

**Returns:** `string|null` - IP address or null

---

#### `get_user_agent()`
[📍 Source](../src/contact-form/class-feedback.php#L804)

Get the user agent of the submitted feedback request.

```php
public function get_user_agent(): ?string
```

**Returns:** `string|null` - User agent string or null

---

#### `get_country_code()`
[📍 Source](../src/contact-form/class-feedback.php#L813)

Get the country code derived from the IP address.

```php
public function get_country_code(): ?string
```

**Returns:** `string|null` - Two-letter country code or null

---

#### `get_country_flag()`
[📍 Source](../src/contact-form/class-feedback.php#L822)

Get the emoji flag for the country.

```php
public function get_country_flag(): string
```

**Returns:** `string` - Emoji flag or empty string if unavailable

---

#### `get_browser()`
[📍 Source](../src/contact-form/class-feedback.php#L964)

Get the browser information from the user agent.

```php
public function get_browser(): ?string
```

**Returns:** `string|null` - Browser information like "Chrome (Desktop)" or null

---

#### `has_consent()`
[📍 Source](../src/contact-form/class-feedback.php#L1014)

Gets the value of the consent field.

```php
public function has_consent(): bool
```

**Returns:** `bool` - True if user gave consent

---

#### `has_file()`
[📍 Source](../src/contact-form/class-feedback.php#L1023)

Check if feedback has files attached.

```php
public function has_file(): bool
```

**Returns:** `bool` - True if has files

---

#### `get_files()`
[📍 Source](../src/contact-form/class-feedback.php#L1109)

Get the uploaded files from the feedback entry.

```php
public function get_files(): array
```

**Returns:** `array` - Array of file data

---

#### `get_notification_recipients()`
[📍 Source](../src/contact-form/class-feedback.php#L1005)

Gets the notification recipients of the feedback entry.

```php
public function get_notification_recipients(): array
```

**Returns:** `array` - Array of user IDs

---

### Entry/Source Information

#### `get_entry_id()`
[📍 Source](../src/contact-form/class-feedback.php#L1167)

Get the entry ID of the post that the feedback was submitted from.

```php
public function get_entry_id(): int|string
```

**Returns:** `int|string` - Post/page ID or source identifier

---

#### `get_entry_title()`
[📍 Source](../src/contact-form/class-feedback.php#L1178)

Get the entry title of the post that the feedback was submitted from.

```php
public function get_entry_title(): string
```

**Returns:** `string` - Post/page title

---

#### `get_entry_permalink()`
[📍 Source](../src/contact-form/class-feedback.php#L1188)

Get the permalink of the post or page that the feedback was submitted from.

```php
public function get_entry_permalink(): string
```

**Returns:** `string` - Full permalink (includes page number if paginated)

---

#### `get_entry_short_permalink()`
[📍 Source](../src/contact-form/class-feedback.php#L1205)

Get the short permalink of a post.

```php
public function get_entry_short_permalink(): string
```

**Returns:** `string` - Relative permalink

---

#### `get_edit_form_url()`
[📍 Source](../src/contact-form/class-feedback.php#L1197)

Get the editor URL where the user can edit the form.

```php
public function get_edit_form_url(): string
```

**Returns:** `string` - Edit URL or empty string if not permitted

---

#### `get_entry_values()`
[📍 Source](../src/contact-form/class-feedback.php#L482)

Get the values related to where the form was submitted from.

```php
public function get_entry_values(): array
```

**Returns:** `array` - Array with `email_marketing_consent`, `entry_title`, `entry_permalink`, `feedback_id`, optionally `entry_page`

---

#### `set_source()`
[📍 Source](../src/contact-form/class-feedback.php#L279)

Set the source of the feedback entry.

```php
public function set_source( Feedback_Source $source ): void
```

**Parameters:**
- `$source` (Feedback_Source) - The source object

---

### Status Management

#### `get_status()`
[📍 Source](../src/contact-form/class-feedback.php#L1146)

Get the feedback status (e.g. 'publish', 'spam', 'trash').

```php
public function get_status(): string
```

**Returns:** `string` - Post status

---

#### `set_status()`
[📍 Source](../src/contact-form/class-feedback.php#L1156)

Sets the status of the feedback.

```php
public function set_status( string $status ): void
```

**Parameters:**
- `$status` (string) - The status to set for the feedback entry

---

#### `is_unread()`
[📍 Source](../src/contact-form/class-feedback.php#L1032)

Check if the feedback is unread.

```php
public function is_unread(): bool
```

**Returns:** `bool` - True if unread

---

#### `mark_as_read()`
[📍 Source](../src/contact-form/class-feedback.php#L1041)

Mark the feedback as read.

```php
public function mark_as_read(): bool
```

**Returns:** `bool` - True on success, false on failure

---

#### `mark_as_unread()`
[📍 Source](../src/contact-form/class-feedback.php#L1066)

Mark the feedback as unread.

```php
public function mark_as_unread(): bool
```

**Returns:** `bool` - True on success, false on failure

---

### Metadata

#### `get_feedback_id()`
[📍 Source](../src/contact-form/class-feedback.php#L643)

Get the feedback ID of the response (MD5 hash, not the post ID).

```php
public function get_feedback_id(): string
```

**Returns:** `string` - Unique feedback identifier

---

#### `get_title()`
[📍 Source](../src/contact-form/class-feedback.php#L654)

Get the feedback title of the response (legacy).

```php
public function get_title(): string
```

**Returns:** `string` - Title like "Author - Date"

---

#### `get_time()`
[📍 Source](../src/contact-form/class-feedback.php#L663)

Get the time of the feedback entry.

```php
public function get_time(): string
```

**Returns:** `string` - MySQL datetime format

---

#### `get_akismet_vars()`
[📍 Source](../src/contact-form/class-feedback.php#L674)

Get the Akismet vars that are used to check for spam.

```php
public function get_akismet_vars(): array
```

**Returns:** `array` - Array of variables for Akismet

---

### Storage

#### `save()`
[📍 Source](../src/contact-form/class-feedback.php#L1213)

Save the feedback entry to the database.

```php
public function save(): WP_Post|int
```

**Returns:** `WP_Post|int` - The feedback post object or 0 on failure

---

#### `serialize()`
[📍 Source](../src/contact-form/class-feedback.php#L1237)

Serialize the fields to JSON format.

```php
public function serialize(): string
```

**Returns:** `string` - JSON-encoded feedback data (with addslashes)

---

## See Also

- [Feedback User Guide](feedback.md) - Usage examples and patterns
- [Feedback_Field Class Reference](feedback-field-class.md)
- [Feedback_Author Class Reference](feedback-author-class.md)
- [Feedback_Source Class Reference](feedback-source-class.md)
