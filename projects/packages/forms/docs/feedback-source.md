# Feedback_Source Class

**[→ Class Reference](feedback-source-class.md)** | **[← Back to Index](README.md)**

The `Feedback_Source` class tracks where a form submission originated. It stores information about the post, page, widget, or template where the form was displayed and provides context-aware permalinks and edit URLs.

## Overview

The `Feedback_Source` class:
- Identifies the source context (post, page, widget, template)
- Stores source ID, title, and URL
- Handles pagination for multi-page forms
- Provides edit URLs respecting user permissions
- Handles special cases (deleted posts, trashed posts)

## Source Types

| Type | Description | Example |
|------|-------------|---------|
| `single` | Regular post or page | Blog post, contact page |
| `widget` | Widget area | Sidebar form widget |
| `block_template` | Block theme template | Full site editing template |
| `block_template_part` | Block theme template part | Header/footer with form |

## Creating Source Objects

### From Form Submission

Create source from current post context:

```php
$source = Feedback_Source::from_submission( $current_post, $page_number );
```

**Parameters:**
- `$current_post` - WP_Post object or null
- `$page_number` - Page number if form is paginated (default: 1)

**Examples:**
```php
// Standard post submission
$source = Feedback_Source::from_submission( get_post(), 1 );

// Homepage submission (no post context)
$source = Feedback_Source::from_submission( null, 1 );
```

### Get Current Source

Automatically detect source from form attributes:

```php
$source = Feedback_Source::get_current( $form_attributes );
```

Detects source type based on attributes:
- `widget` - Widget area form
- `block_template` - Block theme template
- `block_template_part` - Template part
- Otherwise - Current post/page

**Example:**
```php
// In a widget
$attributes = [ 'widget' => 'sidebar-widget-2' ];
$source = Feedback_Source::get_current( $attributes );
// Source type: 'widget', ID: 'sidebar-widget-2'

// In a post
$source = Feedback_Source::get_current( [] );
// Source type: 'single', ID: post ID
```

### Manual Creation

```php
$source = new Feedback_Source(
    123,                           // id (post ID, widget ID, etc.)
    'Contact Page',                // title
    2,                             // page_number
    'single',                      // source_type
    'https://example.com/contact'  // request_url
);
```

All parameters are optional:
- `id` - Default: 0 (homepage)
- `title` - Default: empty string
- `page_number` - Default: 1
- `source_type` - Default: 'single'
- `request_url` - Default: empty string

### From Serialized Data

```php
$data = [
    'source_id'   => 123,
    'entry_title' => 'Contact Page',
    'entry_page'  => 1,
    'source_type' => 'single',
    'request_url' => 'https://...',
];

$source = Feedback_Source::from_serialized( $data );
```

## Getting Source Information

### Basic Information

```php
$id    = $source->get_id();           // Post/widget/template ID
$title = $source->get_title();        // Display title
$page  = $source->get_page_number();  // Page number (pagination)
```

**Example:**
```php
echo 'Submitted from: ' . esc_html( $source->get_title() );
if ( $source->get_page_number() > 1 ) {
    echo ' (Page ' . $source->get_page_number() . ')';
}
```

### Permalinks

```php
// Full permalink (includes pagination)
$permalink = $source->get_permalink();

// Relative permalink
$relative = $source->get_relative_permalink();
```

**Behavior:**
- Returns full URL for published posts
- Adds `?page=N` parameter for paginated forms
- Returns empty string for deleted/trashed posts
- Returns home URL for homepage submissions

**Examples:**
```php
// Published post, page 1
$source = new Feedback_Source( 123, 'Contact' );
echo $source->get_permalink(); // "https://example.com/contact"

// Published post, page 2
$source = new Feedback_Source( 123, 'Contact', 2 );
echo $source->get_permalink(); // "https://example.com/contact?page=2"

// Deleted post
// (Post 999 doesn't exist)
$source = new Feedback_Source( 999, 'Old Page' );
echo $source->get_permalink(); // ""
echo $source->get_title();     // "(deleted) Old Page"
```

### Edit URLs

Get the edit link for the source:

```php
$edit_url = $source->get_edit_form_url();
```

**Behavior:**
- Respects user permissions
- Returns empty string if user can't edit
- Returns empty string for trashed posts
- Handles different source types appropriately

**Examples:**
```php
// Regular post (user has edit_post capability)
$edit_url = $source->get_edit_form_url();
// Returns: "https://example.com/wp-admin/post.php?post=123&action=edit"

// Widget (user has edit_theme_options capability)
$edit_url = $source->get_edit_form_url();
// Returns: "https://example.com/wp-admin/widgets.php"

// Block template (block theme + edit_theme_options)
$edit_url = $source->get_edit_form_url();
// Returns: "https://example.com/wp-admin/site-editor.php?p=/wp_template/..."

// No permission or trashed post
$edit_url = $source->get_edit_form_url();
// Returns: ""
```

## Special Cases

### Homepage Submission

```php
// ID: 0, uses site title
$source = new Feedback_Source( 0 );
echo $source->get_title(); // Site name from get_bloginfo('name')
echo $source->get_permalink(); // Home URL
```

### Deleted Post

```php
$source = new Feedback_Source( 999, 'Old Page' );

echo $source->get_title();     // "(deleted) Old Page"
echo $source->get_permalink(); // ""
echo $source->get_edit_form_url(); // ""
```

### Trashed Post

```php
// Post exists but is trashed
$source = new Feedback_Source( 123, 'Contact Page' );

echo $source->get_title();     // "(trashed) Contact Page"
echo $source->get_permalink(); // ""
echo $source->get_edit_form_url(); // "" (can't edit trashed posts)
```

### Unpublished Post

```php
// Post exists but is draft/private
$source = new Feedback_Source( 123, 'Draft Page' );

echo $source->get_permalink(); // "" (not publicly accessible)
echo $source->get_title();     // "Draft Page" (unchanged)
```

### Archive Pages

```php
// Submission from archive page (no specific post ID)
if ( is_archive() ) {
    $source = Feedback_Source::get_current( [] );
    echo $source->get_title(); // Archive title (e.g., "Category: News")
}
```

### Search Results

```php
if ( is_search() ) {
    $source = Feedback_Source::get_current( [] );
    echo $source->get_title(); // "Search results for: [query]"
}
```

## Serialization

### Serialize for Storage

```php
$data = $source->serialize();
```

Returns:
```php
[
    'entry_title' => 'Contact Page',
    'entry_page'  => 1,
    'source_id'   => 123,
    'source_type' => 'single',
    'request_url' => 'https://example.com/contact',
]
```

### Deserialize from Storage

```php
$source = Feedback_Source::from_serialized( $data );
```

## Complete Examples

### Display Source Information

```php
$feedback = Feedback::get( $post_id );
$source   = $feedback->get_source_object(); // Internal method

echo '<div class="feedback-source">';

// Title with link
if ( $source->get_permalink() ) {
    echo '<a href="' . esc_url( $source->get_permalink() ) . '">';
    echo esc_html( $source->get_title() );
    echo '</a>';
} else {
    echo esc_html( $source->get_title() );
}

// Page number
if ( $source->get_page_number() > 1 ) {
    echo ' <span class="page-num">';
    echo '(Page ' . $source->get_page_number() . ')';
    echo '</span>';
}

// Edit link
if ( $source->get_edit_form_url() ) {
    echo ' <a href="' . esc_url( $source->get_edit_form_url() ) . '">';
    echo 'Edit Form</a>';
}

echo '</div>';
```

### Create Breadcrumb

```php
$source = Feedback_Source::get_current( $attributes );

$breadcrumb = [ 'Home' ];

if ( $source->get_id() && $source->get_permalink() ) {
    $breadcrumb[] = sprintf(
        '<a href="%s">%s</a>',
        esc_url( $source->get_permalink() ),
        esc_html( $source->get_title() )
    );
}

if ( $source->get_page_number() > 1 ) {
    $breadcrumb[] = 'Page ' . $source->get_page_number();
}

echo implode( ' &raquo; ', $breadcrumb );
```

### Source Type Handling

```php
$source = $feedback->get_source_object();

switch ( $source->get_source_type() ) {
    case 'widget':
        echo '<span class="dashicons dashicons-admin-generic"></span> ';
        echo 'Widget: ' . esc_html( $source->get_title() );
        break;

    case 'block_template':
        echo '<span class="dashicons dashicons-layout"></span> ';
        echo 'Template: ' . esc_html( $source->get_title() );
        break;

    case 'block_template_part':
        echo '<span class="dashicons dashicons-layout"></span> ';
        echo 'Template Part: ' . esc_html( $source->get_title() );
        break;

    case 'single':
    default:
        if ( $source->get_id() ) {
            echo '<span class="dashicons dashicons-admin-page"></span> ';
            echo esc_html( $source->get_title() );
        } else {
            echo '<span class="dashicons dashicons-admin-home"></span> ';
            echo 'Homepage';
        }
        break;
}
```

### Analytics Tracking

```php
$sources = [];

$feedbacks = get_posts( [
    'post_type'      => 'feedback',
    'posts_per_page' => -1,
] );

foreach ( $feedbacks as $feedback_post ) {
    $feedback = Feedback::get( $feedback_post->ID );
    $source   = $feedback->get_source_object();

    $key = $source->get_id() . ':' . $source->get_source_type();

    if ( ! isset( $sources[ $key ] ) ) {
        $sources[ $key ] = [
            'id'    => $source->get_id(),
            'title' => $source->get_title(),
            'type'  => $source->get_source_type(),
            'url'   => $source->get_permalink(),
            'count' => 0,
        ];
    }

    $sources[ $key ]['count']++;
}

// Sort by submission count
usort( $sources, function( $a, $b ) {
    return $b['count'] - $a['count'];
} );

// Display top sources
foreach ( array_slice( $sources, 0, 10 ) as $source ) {
    echo '<tr>';
    echo '<td>' . esc_html( $source['title'] ) . '</td>';
    echo '<td>' . esc_html( $source['type'] ) . '</td>';
    echo '<td>' . $source['count'] . '</td>';
    echo '</tr>';
}
```

## Internal Source Title Detection

The class automatically detects appropriate titles:

```php
// Front page
if ( is_front_page() ) {
    return get_bloginfo( 'name' );
}

// Blog page
if ( is_home() ) {
    return get_the_title( get_option( 'page_for_posts' ) );
}

// Single post/page
if ( is_singular() ) {
    return get_the_title();
}

// Archive
if ( is_archive() ) {
    return get_the_archive_title();
}

// Search
if ( is_search() ) {
    return sprintf( 'Search results for: %s', get_search_query() );
}

// 404
if ( is_404() ) {
    return '404 Not Found';
}

// Default
return get_bloginfo( 'name' );
```

## Testing

See `Feedback_Test.php` for examples:
- Source creation and serialization
- Permalink generation with pagination
- Title handling for deleted/trashed posts
- Edit URL generation
- Different source types

**Test Example:**
```php
public function test_compute_entry_title_deleted() {
    $feedback = Feedback::from_submission( $_post_data, $form, $current_post );
    $post_id  = $feedback->save();

    // Delete the source post
    wp_delete_post( $current_post->ID, true );

    $saved_response = Feedback::get( $post_id );

    $this->assertEquals(
        '(deleted) ' . $current_post->post_title,
        $saved_response->get_entry_title()
    );
}
```

## Related Classes

- **[Feedback](feedback.md)** - Uses Feedback_Source to store submission context
- **Contact_Form** - Provides source attributes during submission

## Common Use Cases

### 1. Display submission location
Use `get_title()` and `get_permalink()` to show where form was submitted.

### 2. Analytics and reporting
Group submissions by source ID and type to identify high-traffic forms.

### 3. Conditional form behavior
Check source type to customize form handling for widgets vs. pages.

### 4. Edit form link
Provide `get_edit_form_url()` to admins for quick form editing.

### 5. Breadcrumb navigation
Build navigation trails using source hierarchy and titles.
