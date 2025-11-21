# Feedback_Source Class Reference

**[→ User Guide](feedback-source.md)** | **[← Back to Index](README.md)**

Technical reference for `Automattic\Jetpack\Forms\ContactForm\Feedback_Source`

**Source:** [`class-feedback-source.php`](../src/contact-form/class-feedback-source.php)

## Constructor

### `__construct()`
[📍 Source](../src/contact-form/class-feedback-source.php#L70)

```php
public function __construct(
    int|string $id = 0,
    string $title = '',
    int $page_number = 1,
    string $source_type = 'single',
    string $request_url = ''
)
```

**Parameters:**
- `$id` (int|string) - The source ID (post ID, widget ID, block template ID, or 0 for homepage)
- `$title` (string) - The title of the feedback entry
- `$page_number` (int) - The page number of the feedback entry (default: 1)
- `$source_type` (string) - The source type (default: 'single')
- `$request_url` (string) - The request URL of the feedback entry

**Source Types:**
- `'single'` - Regular post or page
- `'widget'` - Widget area
- `'block_template'` - Block theme template
- `'block_template_part'` - Block theme template part

**Behavior:**
- Automatically fetches post data if ID is numeric and > 0
- Updates title to "(deleted) [title]" if post doesn't exist
- Updates title to "(trashed) [title]" if post is trashed
- Sets permalink to empty string for non-published posts

---

## Static Methods

### `from_submission()`
[📍 Source](../src/contact-form/class-feedback-source.php#L112)

Creates a Feedback_Source instance from a submission.

```php
public static function from_submission(
    ?WP_Post $current_post,
    int $current_page_number = 1
): Feedback_Source
```

**Parameters:**
- `$current_post` (WP_Post|null) - The current post object
- `$current_page_number` (int) - The current page number (default: 1)

**Returns:** `Feedback_Source` - New source instance

**Note:** Returns source with ID 0 if post is null or invalid.

---

### `get_current()`
[📍 Source](../src/contact-form/class-feedback-source.php#L159)

Creates a Feedback_Source instance for the current context.

```php
public static function get_current( array $attributes ): Feedback_Source
```

**Parameters:**
- `$attributes` (array) - Form shortcode attributes

**Returns:** `Feedback_Source` - Source based on current context

**Detects Source Type Based on Attributes:**
- `$attributes['widget']` → widget source
- `$attributes['block_template']` → block template source
- `$attributes['block_template_part']` → template part source
- Otherwise → single post/page source

**Uses Globals:**
- `$wp` - For building current URL
- `$page` - For page number
- `$_wp_current_template_id` - For block template ID

---

### `from_serialized()`
[📍 Source](../src/contact-form/class-feedback-source.php#L184)

Creates a Feedback_Source instance from serialized data.

```php
public static function from_serialized( array $data ): Feedback_Source
```

**Parameters:**
- `$data` (array) - The serialized data

**Returns:** `Feedback_Source` - Reconstructed source instance

**Expected Data Keys:**
- `source_id` - Source ID (default: 0)
- `entry_title` - Title (default: '')
- `entry_page` - Page number (default: 1)
- `source_type` - Type (default: 'single')
- `request_url` - URL (default: '')

---

## Instance Methods

### Basic Information

#### `get_id()`
[📍 Source](../src/contact-form/class-feedback-source.php#L271)

Get the post ID of the feedback entry.

```php
public function get_id(): int|string
```

**Returns:** `int|string` - The ID of the feedback entry (numeric for posts, string for widgets/templates)

---

#### `get_title()`
[📍 Source](../src/contact-form/class-feedback-source.php#L263)

Get the title of the feedback entry.

```php
public function get_title(): string
```

**Returns:** `string` - The title (may include "(deleted)" or "(trashed)" prefix)

---

#### `get_page_number()`
[📍 Source](../src/contact-form/class-feedback-source.php#L255)

Get the page number of the feedback entry.

```php
public function get_page_number(): int
```

**Returns:** `int` - The page number (for paginated forms)

---

### Permalinks

#### `get_permalink()`
[📍 Source](../src/contact-form/class-feedback-source.php#L199)

Get the permalink of the feedback entry.

```php
public function get_permalink(): string
```

**Returns:** `string` - The full permalink (includes `?page=N` parameter if page_number > 1)

**Behavior:**
- Returns validated redirect URL for published posts
- Returns empty string for deleted/trashed/unpublished posts
- Falls back to home URL if permalink is invalid

---

#### `get_relative_permalink()`
[📍 Source](../src/contact-form/class-feedback-source.php#L243)

Get the relative permalink of the feedback entry.

```php
public function get_relative_permalink(): string
```

**Returns:** `string` - The relative permalink (e.g., "/contact?page=2")

---

### Edit URLs

#### `get_edit_form_url()`
[📍 Source](../src/contact-form/class-feedback-source.php#L211)

Get the edit URL of the form or page where the feedback was submitted from.

```php
public function get_edit_form_url(): string
```

**Returns:** `string` - The edit URL, or empty string if not permitted or not available

**Behavior by Source Type:**

| Source Type | Required Capability | Returns |
|-------------|-------------------|---------|
| `block_template` | `edit_theme_options` + block theme | Site editor URL |
| `block_template_part` | `edit_theme_options` + block theme | Site editor URL |
| `widget` | `edit_theme_options` + widget support | Widgets admin URL |
| `single` | `edit_post` for specific post | Post edit URL |

**Special Cases:**
- Returns empty string for trashed posts (must be restored first)
- Returns empty string if user lacks required capabilities
- Returns empty string if source type doesn't support editing

---

### Serialization

#### `serialize()`
[📍 Source](../src/contact-form/class-feedback-source.php#L280)

Get the serialized representation of the source.

```php
public function serialize(): array
```

**Returns:** `array` - Array with keys: `entry_title`, `entry_page`, `source_id`, `source_type`, `request_url`

---

## Private Static Methods

### `get_source_title()`
[📍 Source](../src/contact-form/class-feedback-source.php#L129)

Get the title of the current page for display.

```php
private static function get_source_title(): string
```

**Returns:** `string` - The appropriate title based on context

**Title Detection Logic:**

| Context | Returns |
|---------|---------|
| `is_front_page()` | Site name (`get_bloginfo('name')`) |
| `is_home()` | Blog page title |
| `is_singular()` | Post/page title |
| `is_archive()` | Archive title |
| `is_search()` | "Search results for: [query]" |
| `is_404()` | "404 Not Found" |
| Default | Site name |

---

## Edit URL Construction

### Block Template
```php
// Format: /wp-admin/site-editor.php?p=/wp_template/{template_id}&canvas=edit
admin_url( 'site-editor.php?p=' . esc_attr( '/wp_template/' . addslashes( $id ) ) . '&canvas=edit' )
```

### Block Template Part
```php
// Format: /wp-admin/site-editor.php?p=/wp_template_part/{template_id}&canvas=edit
admin_url( 'site-editor.php?p=' . esc_attr( '/wp_template_part/' . addslashes( $id ) ) . '&canvas=edit' )
```

### Widget
```php
// Format: /wp-admin/widgets.php
admin_url( 'widgets.php' )
```

### Single Post/Page
```php
// Format: /wp-admin/post.php?post={id}&action=edit
get_edit_post_link( (int) $id, 'url' )
```

---

## Usage Examples

### From Current Context
```php
$source = Feedback_Source::get_current( $form_attributes );
echo $source->get_title();
echo $source->get_permalink();
```

### Manual Creation
```php
$source = new Feedback_Source(
    123,                    // post ID
    'Contact Page',         // title
    2,                      // page number
    'single',              // source type
    'https://example.com'  // request URL
);
```

### Check Source Type
```php
$source = $feedback->get_source_object();

switch ( $source->get_source_type() ) {
    case 'widget':
        // Handle widget source
        break;
    case 'block_template':
        // Handle template source
        break;
    case 'single':
    default:
        // Handle post/page source
        break;
}
```

### Display with Edit Link
```php
echo '<a href="' . esc_url( $source->get_permalink() ) . '">';
echo esc_html( $source->get_title() ) . '</a>';

if ( $edit_url = $source->get_edit_form_url() ) {
    echo ' <a href="' . esc_url( $edit_url ) . '">Edit</a>';
}
```

---

## Special Cases

### Deleted Post
```php
// Post 999 doesn't exist
$source = new Feedback_Source( 999, 'Old Page' );
echo $source->get_title();     // "(deleted) Old Page"
echo $source->get_permalink(); // ""
```

### Trashed Post
```php
// Post exists but is in trash
$source = new Feedback_Source( 123, 'Contact' );
echo $source->get_title();         // "(trashed) Contact"
echo $source->get_edit_form_url(); // "" (can't edit trashed)
```

### Homepage
```php
$source = new Feedback_Source( 0 );
echo $source->get_title();     // Site name
echo $source->get_permalink(); // Home URL
```

### Paginated Form
```php
$source = new Feedback_Source( 123, 'Long Form', 3 );
echo $source->get_permalink(); // "https://example.com/long-form?page=3"
```

---

## See Also

- [Feedback_Source User Guide](feedback-source.md) - Usage examples and patterns
- [Feedback Class Reference](feedback-class.md)
