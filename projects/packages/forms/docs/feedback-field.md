# Feedback_Field Class

**[→ Class Reference](feedback-field-class.md)** | **[← Back to Index](README.md)**

The `Feedback_Field` class represents an individual form field submission. It stores the field's label, value, type, and metadata, and handles context-specific rendering for different output formats.

## Overview

A `Feedback_Field` represents the submitted data for a single form field. The class handles:
- Storing field label, value, and type
- Rendering values differently based on context (email, CSV, web, API)
- Special handling for complex field types (files, image-select)
- Serialization for storage and retrieval

## Properties

- **key** - Unique field identifier (e.g., "1_Email")
- **label** - Display label (e.g., "Email Address")
- **value** - Submitted value (string, array, or structured data)
- **type** - Field type (text, email, file, consent, etc.)
- **meta** - Additional metadata (e.g., `['render' => false]`)
- **form_field_id** - Original form field ID from form schema

## Creating Fields

### Basic Constructor

```php
$field = new Feedback_Field(
    '1_Name',           // key
    'Full Name',        // label
    'John Doe',         // value
    'name',             // type
    [],                 // meta (optional)
    'contact-name'      // form_field_id (optional)
);
```

### From Serialized Data

```php
$data = [
    'key'           => '1_Email',
    'label'         => 'Email',
    'value'         => 'john@example.com',
    'type'          => 'email',
    'meta'          => [],
    'form_field_id' => 'contact-email',
];

$field = Feedback_Field::from_serialized( $data );
```

### From V2 Format (Legacy)

```php
$field = Feedback_Field::from_serialized_v2( $data );
```

Handles Unicode normalization for legacy data with escaped characters.

## Getting Field Information

### Basic Getters

```php
$key           = $field->get_key();           // '1_Name'
$label         = $field->get_label();         // 'Full Name'
$value         = $field->get_value();         // Raw value
$type          = $field->get_type();          // 'name'
$form_field_id = $field->get_form_field_id(); // 'contact-name'
```

### Label with Context

```php
// Default label
echo $field->get_label(); // "Email"

// With count suffix (for duplicate labels)
echo $field->get_label( 'default', 1 ); // "Email"
echo $field->get_label( 'default', 2 ); // "Email (2)"

// API/CSV context (adds "Field" prefix if empty)
$empty_label_field = new Feedback_Field( '1_', '', 'value', 'text' );
echo $empty_label_field->get_label( 'csv' ); // "Field"
```

### Metadata

```php
$meta = $field->get_meta();                    // All metadata
$render = $field->get_meta_key_value( 'render' ); // Specific key

// Check if field should be compiled
if ( $field->compile_field() ) {
    // Field has render => false
}
```

## Rendering Values

### Context-Specific Rendering

The `get_render_value()` method renders values differently based on context:

```php
// Default rendering
echo $field->get_render_value();

// Email rendering (formatted for plain text emails)
echo $field->get_render_value( 'email' );

// CSV rendering (flattened for export)
echo $field->get_render_value( 'csv' );

// Web rendering (for post-submission page)
echo $field->get_render_value( 'web' );

// API rendering (includes file URLs, structured data)
$api_value = $field->get_render_value( 'api' );

// Submission format (structured data for processing)
$submit_data = $field->get_render_value( 'submit' );
```

### Available Contexts

| Context | Description | Use Case |
|---------|-------------|----------|
| `default` | Standard text rendering | General display |
| `web` | Same as default | Post-submission page |
| `ajax` | Same as web | AJAX responses |
| `email` | Plain text format | Email notifications |
| `csv` | Comma-separated format | CSV exports |
| `api` | Structured with URLs | REST API responses |
| `submit` | Structured for processing | Form submission handling |

## Field Types

### Text Fields

Simple string values:

```php
$field = new Feedback_Field( '1_Name', 'Name', 'John Doe', 'text' );
echo $field->get_render_value(); // "John Doe"
```

### Array Fields (Checkbox Multiple)

```php
$field = new Feedback_Field(
    '1_Colors',
    'Favorite Colors',
    ['Red', 'Blue', 'Green'],
    'checkbox-multiple'
);

echo $field->get_render_value(); // "Red, Blue, Green"
```

### File Fields

File uploads have structured values:

```php
$value = [
    'files' => [
        [
            'file_id' => 12345,
            'name'    => 'document.pdf',
            'size'    => 1024000,
            'type'    => 'application/pdf'
        ],
        [
            'file_id' => 12346,
            'name'    => 'image.jpg',
            'size'    => 512000,
            'type'    => 'image/jpeg'
        ]
    ]
];

$field = new Feedback_Field( '1_Upload', 'Document', $value, 'file' );

// Default rendering
echo $field->get_render_value(); // "document.pdf (1 MB), image.jpg (500 KB)"

// Check for files
if ( $field->has_file() ) {
    // Handle files
}

// API rendering (includes URLs)
$api_value = $field->get_render_value( 'api' );
// [
//     'files' => [
//         [
//             'file_id' => 12345,
//             'name' => 'document.pdf',
//             'size' => '1 MB',
//             'url' => 'https://...',
//             'is_previewable' => false
//         ]
//     ]
// ]

// Submission format
$submit_value = $field->get_render_value( 'submit' );
// [
//     'field_id' => 'contact-upload',
//     'files' => [...]
// ]
```

### Image Select Fields

Image selection with structured choice data:

```php
$value = [
    'type'    => 'image-select',
    'choices' => [
        [
            'perceived'  => 'A',
            'selected'   => 'B',  // Actual selected value
            'label'      => 'Option B',
            'showLabels' => true,
            'image'      => [
                'id'  => 123,
                'src' => 'https://example.com/image.jpg'
            ]
        ]
    ]
];

$field = new Feedback_Field( '1_Choice', 'Pick One', $value, 'image-select' );

// Email rendering (shows selected values with labels)
echo $field->get_render_value( 'email' ); // "B - Option B"

// CSV rendering
echo $field->get_render_value( 'csv' ); // "B - Option B"

// Web/API rendering (returns structured array)
$web_value = $field->get_render_value( 'web' ); // Full structured array
```

**Note:** The `perceived` value is the letter shown to the user (can be shuffled), while `selected` is the actual option identifier.

### Consent Fields

```php
$field = new Feedback_Field( '1_Consent', 'Email consent', 'Yes', 'consent' );
echo $field->get_render_value(); // "Yes"

if ( $field->is_of_type( 'consent' ) ) {
    // Handle consent
}
```

## Type Checking

```php
if ( $field->is_of_type( 'email' ) ) {
    // Validate email format
}

if ( $field->is_of_type( 'file' ) ) {
    // Handle file upload
}

if ( $field->has_file() ) {
    // Field has files attached
}
```

## Serialization

### Serialize for Storage

```php
$data = $field->serialize();
```

Returns:
```php
[
    'key'           => '1_Email',
    'label'         => 'Email Address',
    'value'         => 'john@example.com',
    'type'          => 'email',
    'meta'          => [],
    'form_field_id' => 'contact-email',
]
```

### Deserialize from Storage

```php
$field = Feedback_Field::from_serialized( $data );
```

Returns `null` if data is invalid (missing required keys).

## Common Field Types

| Type | Description | Example Value |
|------|-------------|---------------|
| `text` | Plain text input | `"Hello"` |
| `name` | Name field | `"John Doe"` |
| `email` | Email address | `"john@example.com"` |
| `url` | Website URL | `"https://example.com"` |
| `textarea` | Multi-line text | `"Long message..."` |
| `select` | Dropdown selection | `"Option A"` |
| `radio` | Radio button | `"Choice 1"` |
| `checkbox` | Single checkbox | `"Yes"` |
| `checkbox-multiple` | Multiple checkboxes | `["A", "B", "C"]` |
| `file` | File upload | `['files' => [...]]` |
| `image-select` | Image selection | `['type' => '...', 'choices' => [...]]` |
| `consent` | Consent checkbox | `"Yes"` or `""` |
| `hidden` | Hidden field | `"hidden_value"` |
| `subject` | Email subject | `"Contact Request"` |
| `ip` | IP address | `"192.168.1.1"` |
| `basic` | Generic field | Any value |

## Complete Examples

### Email Notification

```php
$fields = $feedback->get_fields();
$email_body = '';

foreach ( $fields as $field ) {
    if ( $field->compile_field() ) {
        continue; // Skip non-rendered fields
    }

    $label = $field->get_label( 'email' );
    $value = $field->get_render_value( 'email' );

    $email_body .= "{$label}: {$value}\n";
}

wp_mail( $to, $subject, $email_body );
```

### CSV Export

```php
$csv_rows = [];
$labels = [];
$values = [];

foreach ( $feedback->get_fields() as $field ) {
    $labels[] = $field->get_label( 'csv' );
    $values[] = $field->get_render_value( 'csv' );
}

$csv_rows[] = $labels;
$csv_rows[] = $values;

// Write to CSV file...
```

### API Response

```php
$response = [
    'id'     => $feedback->get_feedback_id(),
    'author' => $feedback->get_author(),
    'fields' => [],
];

foreach ( $feedback->get_fields() as $field ) {
    $response['fields'][] = [
        'label' => $field->get_label( 'api' ),
        'value' => $field->get_render_value( 'api' ),
        'type'  => $field->get_type(),
    ];
}

wp_send_json( $response );
```

### File Download Links

```php
foreach ( $feedback->get_fields() as $field ) {
    if ( ! $field->is_of_type( 'file' ) ) {
        continue;
    }

    $value = $field->get_render_value( 'api' );

    foreach ( $value['files'] as $file ) {
        echo '<a href="' . esc_url( $file['url'] ) . '">';
        echo esc_html( $file['name'] ) . ' (' . esc_html( $file['size'] ) . ')';
        echo '</a><br>';
    }
}
```

## Filters

### File Download URL

Customize file download URLs:

```php
add_filter( 'jetpack_unauth_file_download_url', function( $url, $file_id ) {
    return home_url( '/download/?file=' . $file_id . '&token=' . generate_token() );
}, 10, 2 );
```

## Testing

See `Feedback_Field_Test.php` for comprehensive examples of:
- Field creation and serialization
- Context-specific rendering
- File and image-select handling
- Type checking
- Legacy format migration
