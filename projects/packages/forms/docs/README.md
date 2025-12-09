# Jetpack Forms Documentation

Welcome to the Jetpack Forms package documentation. This package provides WordPress form functionality including contact forms, feedback storage, and form processing.

## Core Classes

### Feedback System

The feedback system handles form submission data storage and retrieval:

- **[Feedback](feedback.md)** ([Class Reference](feedback-class.md)) - Main class representing a form submission stored as a custom WordPress post (`feedback` post type). Provides methods for creating, retrieving, and managing form responses including author info, field data, and submission metadata.

- **[Feedback_Field](feedback-field.md)** ([Class Reference](feedback-field-class.md)) - Represents an individual form field submission with its label, value, and type. Handles context-specific rendering for emails, CSV exports, API responses, and web display.

- **[Feedback_Author](feedback-author.md)** ([Class Reference](feedback-author-class.md)) - Manages submitter information including name, email, URL, and avatar. Integrates with WordPress comment filters for consistent data handling.

- **[Feedback_Source](feedback-source.md)** ([Class Reference](feedback-source-class.md)) - Tracks the source context of a form submission (post, page, widget, or block template). Provides permalinks and edit URLs based on submission origin.

### Form System

Classes that handle form rendering and processing:

- **Contact_Form** - Core form class that parses shortcodes, validates fields, and processes submissions. Handles form attributes, field definitions, and submission workflow.

- **Contact_Form_Field** - Represents a form field definition (not the submitted data). Defines field properties like type, label, validation rules, and rendering options.

- **Contact_Form_Shortcode** - Handles WordPress shortcode parsing for `[contact-form]` and `[contact-field]` shortcodes. Converts shortcode attributes into form objects.

- **Contact_Form_Plugin** - Main plugin class that initializes the forms system, registers hooks, and coordinates between components.

- **Contact_Form_Endpoint** - REST API endpoint handler for form submissions. Processes AJAX submissions and returns JSON responses.

### UI Components

Classes for admin and user-facing interfaces:

- **Admin** - Admin interface for viewing and managing form submissions. Provides list tables and detail views for feedback posts.

- **Editor_View** - Handles form display in the block editor. Provides live previews and editing capabilities.

- **Form_View** - Renders forms on the frontend. Handles HTML generation, validation display, and success messages.

### Utilities

Helper classes:

- **Util** - Utility functions for common operations like sanitization, validation, and data formatting.

- **Form_Submission_Error** - Exception class for handling form submission errors. Provides structured error information for validation failures and processing issues.

## Quick Start

### Creating a Form Submission

```php
use Automattic\Jetpack\Forms\ContactForm\Feedback;
use Automattic\Jetpack\Forms\ContactForm\Contact_Form;

$form = new Contact_Form( $attributes, $content );
$feedback = Feedback::from_submission( $_POST, $form, get_post() );
$post_id = $feedback->save();
```

### Retrieving a Submission

```php
$feedback = Feedback::get( $post_id );
echo $feedback->get_author();
echo $feedback->get_author_email();

foreach ( $feedback->get_fields() as $field ) {
    echo $field->get_label() . ': ' . $field->get_render_value();
}
```

## Testing

Tests are located in `tests/php/contact-form/`:
- `Feedback_Test.php` - Comprehensive feedback system tests
- `Feedback_Field_Test.php` - Field handling tests
- `Contact_Form_Test.php` - Form processing tests

Run tests:
```bash
jetpack docker phpunit projects/packages/forms
```

## File Structure

```
src/contact-form/
├── class-feedback.php           # Main feedback class
├── class-feedback-field.php     # Field data class
├── class-feedback-author.php    # Author info class
├── class-feedback-source.php    # Source context class
├── class-contact-form.php       # Form definition class
├── class-contact-form-field.php # Field definition class
└── ...

tests/php/contact-form/
├── Feedback_Test.php
├── Feedback_Field_Test.php
└── ...

docs/
├── README.md                    # This file
├── feedback.md                  # Feedback class docs
├── feedback-field.md            # Field class docs
├── feedback-author.md           # Author class docs
└── feedback-source.md           # Source class docs
```

## Additional Resources

- [Jetpack Forms Block Editor Integration](../README.md)
- [Form Submission Workflow](#) (TBD)
- [Security and Validation](#) (TBD)
