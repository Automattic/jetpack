# Feedback Class

**[→ Class Reference](feedback-class.md)** | **[← Back to Index](README.md)**

The `Feedback` class represents a complete form submission stored as a WordPress custom post (post type: `feedback`). It provides comprehensive methods for creating, retrieving, and managing form responses.

## Overview

Feedback posts store all submission data including:
- Form field values
- Author information (name, email, URL)
- Submission metadata (IP, user agent, country)
- Source context (where the form was submitted)
- Read/unread status
- Spam status

## Creating Feedback

### From Form Submission

Create a new feedback object from POST data:

```php
$feedback = Feedback::from_submission( $_POST, $form, $current_post, $page_number );
$post_id = $feedback->save();
```

**Parameters:**
- `$_POST` - Form submission data
- `$form` - Contact_Form object
- `$current_post` - WP_Post object where form was submitted (optional)
- `$page_number` - Page number if paginated (default: 1)

### Retrieving Existing Feedback

Retrieve feedback by post ID:

```php
$feedback = Feedback::get( $post_id );
if ( $feedback ) {
    echo $feedback->get_author();
}
```

Returns `null` if post doesn't exist or isn't a feedback post.

### Cache Management

Clear the internal feedback cache:

```php
Feedback::clear_cache();
```

Useful for testing or when feedback data needs to be reloaded fresh.

## Author Information

### Get Display Name

```php
$name = $feedback->get_author();
```

Returns the author's name, or email if no name is provided.

### Get Specific Author Details

```php
$email      = $feedback->get_author_email();
$url        = $feedback->get_author_url();
$first_name = $feedback->get_author_first_name();
$last_name  = $feedback->get_author_last_name();
$avatar_url = $feedback->get_author_avatar();
```

**Example:**
```php
echo '<img src="' . esc_url( $feedback->get_author_avatar() ) . '" />';
echo '<p>' . esc_html( $feedback->get_author() ) . '</p>';
echo '<a href="mailto:' . esc_attr( $feedback->get_author_email() ) . '">Email</a>';
```

## Field Access

### Get All Fields

```php
$fields = $feedback->get_fields();
foreach ( $fields as $field ) {
    echo $field->get_label() . ': ' . $field->get_render_value();
}
```

Returns an array of `Feedback_Field` objects keyed by field key (e.g., "1_Name").

### Get Field by Label

```php
$value = $feedback->get_field_value_by_label( 'Email' );
```

Returns the rendered value of the first field matching the label, or empty string if not found.

### Get Field by Form Field ID

```php
$field = $feedback->get_field_by_form_field_id( 'contact-email' );
if ( $field ) {
    echo $field->get_render_value();
}
```

Returns the `Feedback_Field` object or `null` if not found.

### Check for Field Type

```php
if ( $feedback->has_field_type( 'consent' ) ) {
    // Handle consent field
}

if ( $feedback->has_field_type( 'email' ) ) {
    // Handle email field
}
```

Returns `true` if at least one field of the specified type exists.

## Compiled Fields

Get fields in various formats for different use cases:

### All Formats

```php
// Default: ['field_key' => ['label' => '...', 'value' => '...']]
$fields = $feedback->get_compiled_fields( 'default', 'all' );

// Key-value pairs: ['field_key' => 'value']
$fields = $feedback->get_compiled_fields( 'default', 'key-value' );

// Label-value pairs: ['Label' => 'value']
$fields = $feedback->get_compiled_fields( 'default', 'label-value' );

// Array of objects: [['label' => '...', 'value' => '...']]
$fields = $feedback->get_compiled_fields( 'default', 'label|value' );

// Values only: ['value1', 'value2']
$fields = $feedback->get_compiled_fields( 'default', 'value' );

// Labels only: ['Label1', 'Label2']
$fields = $feedback->get_compiled_fields( 'default', 'label' );
```

### Contexts

Different contexts affect how fields are rendered:

- `default` - Standard display
- `web` - Post-submission page (hides hidden fields)
- `email` - Email notifications (formatted for plain text)
- `csv` - CSV export (flattened values)
- `api` - REST API responses (includes file URLs)
- `ajax` - AJAX responses (same as web)

**Example:**
```php
// For email notification
$fields = $feedback->get_compiled_fields( 'email', 'label|value' );
foreach ( $fields as $field ) {
    echo $field['label'] . ": " . $field['value'] . "\n";
}
```

## Submission Details

### Subject and Content

```php
$subject = $feedback->get_subject();
$message = $feedback->get_comment_content();
```

Subject comes from form's subject attribute or subject field. Message comes from the first textarea field.

### Metadata

```php
$ip      = $feedback->get_ip_address();      // '192.168.1.1'
$country = $feedback->get_country_code();    // 'US'
$flag    = $feedback->get_country_flag();    // '🇺🇸'
$browser = $feedback->get_browser();         // 'Chrome (Desktop)'
$agent   = $feedback->get_user_agent();      // Full user agent string
```

**Example:**
```php
echo '<p>Submitted from: ';
if ( $feedback->get_country_flag() ) {
    echo $feedback->get_country_flag() . ' ';
}
echo esc_html( $feedback->get_country_code() ) . '</p>';

if ( $feedback->get_browser() ) {
    echo '<p>Browser: ' . esc_html( $feedback->get_browser() ) . '</p>';
}
```

### Consent and Files

```php
$has_consent = $feedback->has_consent();
$has_files   = $feedback->has_file();
$files       = $feedback->get_files();
```

**Files Example:**
```php
if ( $feedback->has_file() ) {
    echo '<h3>Attachments:</h3>';
    foreach ( $feedback->get_files() as $file ) {
        echo '<p>' . esc_html( $file['name'] ) . ' ';
        echo '(' . esc_html( $file['size'] ) . ')</p>';
    }
}
```

### Timestamps

```php
$time  = $feedback->get_time();        // MySQL datetime
$title = $feedback->get_title();       // 'Author - 2024-01-01 12:00:00'
$id    = $feedback->get_feedback_id(); // MD5 hash
```

## Source Information

Get information about where the form was submitted:

```php
$entry_id    = $feedback->get_entry_id();        // Post/page ID
$entry_title = $feedback->get_entry_title();     // Post title
$permalink   = $feedback->get_entry_permalink(); // Full URL
$short_link  = $feedback->get_entry_short_permalink(); // Relative URL
$edit_url    = $feedback->get_edit_form_url();   // Edit link (if permitted)
```

**Example:**
```php
echo '<p>Submitted from: ';
echo '<a href="' . esc_url( $feedback->get_entry_permalink() ) . '">';
echo esc_html( $feedback->get_entry_title() ) . '</a></p>';

if ( $feedback->get_edit_form_url() ) {
    echo '<p><a href="' . esc_url( $feedback->get_edit_form_url() ) . '">';
    echo 'Edit Form</a></p>';
}
```

### Set Custom Source

```php
$source = new Feedback_Source( $post_id, $title, $page_number, $type, $url );
$feedback->set_source( $source );
```

## Status Management

### Get and Set Status

```php
$status = $feedback->get_status(); // 'publish', 'spam', 'trash'
$feedback->set_status( 'spam' );
$post_id = $feedback->save();
```

### Read/Unread Status

```php
if ( $feedback->is_unread() ) {
    $feedback->mark_as_read();
}

// Or mark as unread
$feedback->mark_as_unread();
```

Both methods return `true` on success, `false` on failure.

### Get Unread Count

```php
$count = Feedback::get_unread_count();
echo "You have {$count} unread submissions";
```

## Akismet Integration

Get variables formatted for Akismet spam checking:

```php
$akismet_vars = $feedback->get_akismet_vars();
```

**Returns:**
```php
[
    'comment_author'       => 'John Doe',
    'comment_author_email' => 'john@example.com',
    'comment_author_url'   => 'https://johndoe.com',
    'contact_form_subject' => 'Contact Request',
    'comment_author_ip'    => '192.168.1.1',
    'comment_content'      => 'Message text',
    'contact_form_field_phone' => '555-1234',
    // ... other text fields
]
```

Excludes select, checkbox, radio, file, and image-select fields.

## Notification Recipients

Get list of users who should receive notification:

```php
$recipients = $feedback->get_notification_recipients();
foreach ( $recipients as $user_id ) {
    $user = get_userdata( $user_id );
    wp_mail( $user->user_email, $subject, $message );
}
```

Returns validated user IDs with `edit_posts` or `edit_pages` capability.

## Legacy Support

### Get All Values

```php
$all_values = $feedback->get_all_values();
```

Returns array merging field values with entry metadata:
```php
[
    '1_Name'  => 'John Doe',
    '2_Email' => 'john@example.com',
    // ... other fields
    'email_marketing_consent' => 'yes',
    'entry_title'             => 'Contact Page',
    'entry_permalink'         => 'https://...',
    'feedback_id'             => 'abc123...',
    'entry_page'              => 1, // Only if page > 1
]
```

### Get Legacy Format

```php
$legacy_values = $feedback->get_all_legacy_values();
```

Returns:
```php
[
    '_feedback_author'       => 'John Doe',
    '_feedback_author_email' => 'john@example.com',
    '_feedback_author_url'   => 'https://...',
    '_feedback_subject'      => 'Subject',
    '_feedback_ip'           => '192.168.1.1',
    '_feedback_all_fields'   => [...], // Result of get_all_values()
]
```

### Extra Values

```php
$extra = $feedback->get_legacy_extra_values();
```

Returns fields that aren't standard author/email/url/subject/message fields.

## Complete Example

### Processing a Submission

```php
// Create feedback
$form = new Contact_Form( $attributes, $content );
$feedback = Feedback::from_submission( $_POST, $form, get_post(), 1 );

// Check for spam
$akismet_vars = $feedback->get_akismet_vars();
if ( is_spam( $akismet_vars ) ) {
    $feedback->set_status( 'spam' );
}

// Save
$post_id = $feedback->save();

// Send notifications
if ( $post_id ) {
    $recipients = $feedback->get_notification_recipients();
    $subject    = $feedback->get_subject();

    foreach ( $recipients as $user_id ) {
        $user = get_userdata( $user_id );
        wp_mail( $user->user_email, $subject, build_message( $feedback ) );
    }
}
```

### Displaying Feedback

```php
$feedback = Feedback::get( $post_id );

// Header
echo '<h2>' . esc_html( $feedback->get_author() ) . '</h2>';
echo '<p>' . esc_html( $feedback->get_author_email() ) . '</p>';
echo '<p>' . esc_html( $feedback->get_time() ) . '</p>';

// Location
echo '<p>From: <a href="' . esc_url( $feedback->get_entry_permalink() ) . '">';
echo esc_html( $feedback->get_entry_title() ) . '</a></p>';

// Fields
$fields = $feedback->get_compiled_fields( 'web' );
foreach ( $fields as $field ) {
    echo '<p><strong>' . esc_html( $field['label'] ) . ':</strong> ';
    echo esc_html( $field['value'] ) . '</p>';
}

// Mark as read
$feedback->mark_as_read();
```

## Available Filters

### IP Address Storage

```php
// Disable IP address storage
add_filter( 'jetpack_contact_form_forget_ip_address', '__return_true' );
```

### Country Code Lookup

```php
add_filter( 'jetpack_get_country_from_ip', function( $country, $ip, $context ) {
    if ( $context === 'form-response' ) {
        return my_custom_geoip_lookup( $ip );
    }
    return $country;
}, 10, 3 );
```

### Subject Line

```php
add_filter( 'contact_form_subject', function( $subject, $all_values ) {
    return '[Contact Form] ' . $subject;
}, 10, 2 );
```

## Storage Format

Feedback is stored as WordPress custom posts:

- **Post Type:** `feedback`
- **Post Status:** `publish`, `spam`, or `trash`
- **Post Title:** `{author} - {date}`
- **Post Name:** MD5 hash (feedback ID)
- **Post Content:** JSON-encoded field data
- **Post MIME Type:** `v3` (format version)
- **Post Parent:** Source post/page ID
- **Comment Status:** `open` (unread) or `closed` (read)

**Content Structure:**
```json
{
  "subject": "...",
  "ip": "192.168.1.1",
  "country_code": "US",
  "user_agent": "Mozilla/5.0...",
  "notification_recipients": [1, 2],
  "source_id": 123,
  "source_type": "single",
  "entry_title": "Contact Page",
  "entry_page": 1,
  "request_url": "https://...",
  "fields": [...]
}
```

See [Feedback_Field documentation](feedback-field.md) for field structure.
