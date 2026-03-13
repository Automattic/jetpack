# Feedback_Author Class

**[→ Class Reference](feedback-author-class.md)** | **[← Back to Index](README.md)**

The `Feedback_Author` class manages submitter information for form submissions. It handles name, email, URL, and avatar data with automatic integration into WordPress comment filters.

## Overview

The `Feedback_Author` class:
- Stores author name, email, and URL
- Supports separate first/last name fields
- Provides display name fallback logic
- Integrates with WordPress comment filters
- Generates Gravatar URLs

## Creating Author Objects

### From Form Submission

```php
$author = Feedback_Author::from_submission( $_POST, $form );
```

This method:
- Extracts name, email, and URL from form data
- Applies WordPress comment filters
- Handles first-name and last-name fields if present

### Manual Creation

```php
$author = new Feedback_Author(
    'John Doe',                // name
    'john@example.com',        // email
    'https://johndoe.com',     // url
    'John',                    // first_name (optional)
    'Doe'                      // last_name (optional)
);
```

All parameters are optional and default to empty strings.

## Getting Author Information

### Display Name

Get the best available name for display:

```php
$name = $author->get_display_name();
```

**Behavior:**
- Returns the full name if available
- Falls back to email if name is empty
- Never returns empty string (unless both name and email are empty)

**Examples:**
```php
// With name
$author = new Feedback_Author( 'John Doe', 'john@example.com' );
echo $author->get_display_name(); // "John Doe"

// Without name
$author = new Feedback_Author( '', 'john@example.com' );
echo $author->get_display_name(); // "john@example.com"
```

### Name

Get the author's full name:

```php
$name = $author->get_name();
```

**Behavior:**
- If first_name and last_name are both set, combines them with `pre_comment_author_name` filter
- Otherwise returns the stored name value
- Name is filtered through WordPress comment filters during construction

**Example:**
```php
$author = new Feedback_Author( '', '', '', 'John', 'Doe' );
echo $author->get_name(); // "John Doe" (filtered through pre_comment_author_name)
```

### Email

```php
$email = $author->get_email();
```

Returns the author's email address.

### URL

```php
$url = $author->get_url();
```

Returns the author's website URL.

### First and Last Name

```php
$first_name = $author->get_first_name();
$last_name  = $author->get_last_name();
```

Returns individual name components if provided separately in the form.

### Avatar

Get the Gravatar URL:

```php
$avatar_url = $author->get_avatar_url();
```

Returns empty string if no email is set.

**Example:**
```php
if ( $author->get_avatar_url() ) {
    echo '<img src="' . esc_url( $author->get_avatar_url() ) . '" />';
    echo '<span>' . esc_html( $author->get_display_name() ) . '</span>';
}
```

## WordPress Filter Integration

The class automatically applies WordPress comment filters during creation:

### Applied Filters

- `pre_comment_author_name` - Applied to name field
- `pre_comment_author_email` - Applied to email field
- `pre_comment_author_url` - Applied to URL field

### Customizing Author Data

```php
// Capitalize names
add_filter( 'pre_comment_author_name', function( $name ) {
    return ucwords( strtolower( $name ) );
} );

// Normalize emails to lowercase
add_filter( 'pre_comment_author_email', function( $email ) {
    return strtolower( $email );
} );

// Ensure URLs have protocol
add_filter( 'pre_comment_author_url', function( $url ) {
    if ( ! empty( $url ) && ! preg_match( '~^https?://~i', $url ) ) {
        return 'https://' . $url;
    }
    return $url;
} );
```

## Complete Examples

### Display Author Card

```php
$author = $feedback->get_author_data();

echo '<div class="author-card">';

// Avatar
if ( $author->get_avatar_url() ) {
    echo '<img src="' . esc_url( $author->get_avatar_url() ) . '" ';
    echo 'alt="' . esc_attr( $author->get_display_name() ) . '" />';
}

// Name
echo '<h3>' . esc_html( $author->get_display_name() ) . '</h3>';

// Email (linked)
if ( $author->get_email() ) {
    echo '<a href="mailto:' . esc_attr( $author->get_email() ) . '">';
    echo esc_html( $author->get_email() ) . '</a>';
}

// Website (linked)
if ( $author->get_url() ) {
    echo '<a href="' . esc_url( $author->get_url() ) . '" ';
    echo 'target="_blank" rel="nofollow">';
    echo esc_html( $author->get_url() ) . '</a>';
}

echo '</div>';
```

### Email Notification Header

```php
$author = $feedback->get_author_data();

$email_header = "From: {$author->get_display_name()}";

if ( $author->get_email() ) {
    $email_header .= " <{$author->get_email()}>";
}

if ( $author->get_url() ) {
    $email_header .= "\nWebsite: {$author->get_url()}";
}

// Use in wp_mail headers
$headers = [
    'Reply-To: ' . $author->get_email(),
];
```

### Structured Data for API

```php
$author = $feedback->get_author_data();

$author_data = [
    'name'       => $author->get_name(),
    'first_name' => $author->get_first_name(),
    'last_name'  => $author->get_last_name(),
    'email'      => $author->get_email(),
    'url'        => $author->get_url(),
    'avatar'     => $author->get_avatar_url(),
];

// Remove empty values
$author_data = array_filter( $author_data );

wp_send_json( [
    'feedback' => [...],
    'author'   => $author_data,
] );
```

### Contact Directory Listing

```php
$feedbacks = get_posts( [
    'post_type'      => 'feedback',
    'posts_per_page' => 50,
] );

$contacts = [];

foreach ( $feedbacks as $feedback_post ) {
    $feedback = Feedback::get( $feedback_post->ID );
    $author   = $feedback->get_author_data();

    // Skip if no email
    if ( ! $author->get_email() ) {
        continue;
    }

    $email = $author->get_email();

    // Deduplicate by email
    if ( ! isset( $contacts[ $email ] ) ) {
        $contacts[ $email ] = [
            'name'   => $author->get_display_name(),
            'email'  => $email,
            'url'    => $author->get_url(),
            'avatar' => $author->get_avatar_url(),
            'count'  => 0,
        ];
    }

    $contacts[ $email ]['count']++;
}

// Sort by submission count
usort( $contacts, function( $a, $b ) {
    return $b['count'] - $a['count'];
} );
```

## Internal Behavior

### Name Construction

When getting the name via `get_name()`:

1. If both `first_name` and `last_name` are set:
   - Concatenates with space
   - Applies `pre_comment_author_name` filter
   - Strips tags and slashes

2. Otherwise:
   - Returns the stored `name` value
   - Already filtered during construction

### Filter Application

Filters are applied during construction using this pattern:

```php
Contact_Form_Plugin::strip_tags(
    stripslashes(
        apply_filters( 'pre_comment_author_name', addslashes( $value ) )
    )
);
```

This ensures compatibility with WordPress comment handling while preventing XSS.

## Testing

See `Feedback_Test.php` for examples:
- Author name handling with and without name field
- Email fallback for display name
- First/last name combination
- Filter application
- Legacy format migration

**Test Example:**
```php
public function test_author_name_with_email() {
    $_post_data = [ 'email' => 'email@email.com' ];
    $form = new Contact_Form( [...] );
    $response = Feedback::from_submission( $_post_data, $form );

    // No name provided, should use email
    $this->assertEquals( 'email@email.com', $response->get_author() );
}
```

## Related Classes

- **[Feedback](feedback.md)** - Uses Feedback_Author via `get_author_data()`
- **Contact_Form** - Provides field IDs for extracting author info
- **Contact_Form_Plugin** - Provides `strip_tags()` utility

## Common Use Cases

### 1. Display author info on submission page
Use `get_display_name()` and `get_avatar_url()` for user-facing display.

### 2. Email notifications
Use `get_email()` for recipient, `get_display_name()` for "From" name.

### 3. CRM integration
Export all fields (`get_name()`, `get_first_name()`, `get_last_name()`, `get_email()`, `get_url()`) for complete contact data.

### 4. Comment synchronization
Author data is compatible with WordPress comment system through shared filters.
