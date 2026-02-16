# Form Rendering

## When this happens

When WordPress renders a page containing a `jetpack/contact-form` block (or the `[contact-form]` shortcode).

## Entry point

`src/blocks/contact-form/class-contact-form-block.php:778` -- `Contact_Form_Block::gutenblock_render_form()` is the block render callback registered at line 46.

## Sequence

1. **Block render callback** (`class-contact-form-block.php:778`)
   - Checks module is active, skips non-frontend contexts (feeds, API) unless submitting
   - Calls `load_view_scripts()` to enqueue frontend JS
   - If block has `ref` attribute (synced form), loads form from `jetpack_form` CPT via `render_synced_form()` (line 811)
   - Otherwise calls `Contact_Form::parse($atts, do_blocks($content))`

2. **Form parsing** (`class-contact-form.php:1050`)
   - `Contact_Form::parse()` is the main render method
   - If `Settings::is_syncing()`, returns empty (skip during Jetpack Sync)
   - Creates `Contact_Form` instance via `new Contact_Form($attributes, $content)` (line 1072)
   - Resets form step counter via `Contact_Form_Plugin::reset_step()` (line 1073)

3. **Constructor processes fields** (`class-contact-form.php:215`)
   - Parses `$content` through `do_shortcode()` to process child `[contact-field]` shortcodes
   - Each child becomes a `Contact_Form_Field` object stored in `$this->fields`
   - Computes form hash from attributes for identification
   - Generates form ID from attributes + post context via `compute_id()` (line 635)
   - Stores form in `self::$forms[$hash]` for later retrieval during submission

4. **Asset enqueuing** (`class-contact-form.php:1088-1122`)
   - Enqueues `grunion.css` if `self::$style` is true
   - Enqueues `accessible-form` script
   - Sets up WordPress Interactivity API config with error messages and AJAX URL
   - Enqueues `jp-forms-view` script module (uses `@wordpress/interactivity`)

5. **HTML output assembly** (`class-contact-form.php:1124-1410`)
   - Determines layout classes (flex, horizontal, single-input)
   - Checks for reload-after-success state via URL parameters
   - Generates JWT token via `$form->get_jwt()` (embedded as hidden field for secure submission)
   - Renders each field via `Contact_Form_Field::render()` (called during shortcode processing)
   - Adds hidden fields: `action`, `contact-form-id`, `contact-form-hash`, JWT token, nonce
   - Wraps in `<form>` tag with interactivity API directives (`wp-interactive`, `wp-on--submit`)
   - Renders success/error wrappers for AJAX responses

6. **Field rendering** (`class-contact-form-field.php:526`)
   - `Contact_Form_Field::render()` dispatches to type-specific renderers
   - Calls `render_field()` (line 2497) which routes to `render_email_field()`, `render_textarea_field()`, etc.
   - Each renderer produces HTML with appropriate attributes, labels, and style variations
   - Style variations (outlined, animated, below) controlled by `get_form_style()` (line 2738)

## Key decisions

- **JWT embedding**: The form's full attributes are encrypted into a JWT token in a hidden field. This allows stateless submission -- the server doesn't need to re-parse the page to know what form was submitted. See `flows/jwt-encryption.md`.
- **Synced forms**: If the block has a `ref` attribute, the form content comes from a `jetpack_form` CPT instead of the block's inner content. Circular reference prevention via `Contact_Form::has_seen()`.
- **Style system**: Form style (outlined/animated/below) is determined by CSS class on the form block, parsed in `get_form_style()`. Each field renderer has variants for each style.
- **Interactivity API**: Frontend behavior (AJAX submission, validation) uses `@wordpress/interactivity` via `wp-interactive="jetpack/form"` directive.

## Files involved

| File | Role |
|------|------|
| `src/blocks/contact-form/class-contact-form-block.php` | Block render callback, synced form loading, asset registration |
| `src/contact-form/class-contact-form.php` | `parse()` method, form HTML assembly, JWT generation |
| `src/contact-form/class-contact-form-field.php` | Field HTML rendering for all 20+ field types |
| `src/contact-form/class-contact-form-shortcode.php` | Base class providing attribute parsing |
| `src/contact-form/class-contact-form-plugin.php` | Block and shortcode registration, style variations |
| `src/contact-form/class-feedback-source.php` | Captures form source context for JWT |

## Gotchas

- **Static state**: `Contact_Form::$last`, `$current_form`, `$forms`, and `$style` are all static. Multiple forms on a page interact through shared state. `$forms` is indexed by hash for submission retrieval.
- **Shortcode within blocks**: The block render callbacks in `Contact_Form_Plugin` (e.g., `gutenblock_render_field_text` at line 1148) convert block attributes to shortcode attributes via `block_attributes_to_shortcode_attributes()`, then call `Contact_Form::parse_contact_field()`. Blocks and shortcodes share the same rendering pipeline.
- **do_blocks() before parse()**: The block content is processed through `do_blocks()` before `parse()`, so inner field blocks are already rendered to their shortcode equivalents by the time parse runs.
- **Form hash stability**: The form hash (`sha1` of attributes) must be stable between render and submit. If attributes change between page load and submission (e.g., dynamic content), the form won't be found by hash in the legacy submission path.
