# Form Rendering

<!-- verified: 2026-02-17, commit: 8225b1ff -->

## When this happens

When WordPress renders a page containing a `jetpack/contact-form` block (or the `[contact-form]` shortcode).

## Entry point

`Contact_Form_Block::gutenblock_render_form()` (class-contact-form-block.php) — the block render callback.

## Sequence

1. **Block render callback** — `Contact_Form_Block::gutenblock_render_form()`
   - Checks module is active, skips non-frontend contexts (feeds, API) unless submitting
   - Calls `load_view_scripts()` to enqueue frontend JS
   - If block has `ref` attribute (synced form), loads form from `jetpack_form` CPT via `render_synced_form()`
   - Otherwise calls `Contact_Form::parse($atts, do_blocks($content))`

2. **Form parsing** — `Contact_Form::parse()`
   - If `Settings::is_syncing()`, returns empty (skip during Jetpack Sync)
   - Creates `Contact_Form` instance via constructor
   - Resets form step counter via `Contact_Form_Plugin::reset_step()`

3. **Constructor processes fields** — `Contact_Form::__construct()`
   - Parses `$content` through `do_shortcode()` to process child `[contact-field]` shortcodes
   - Each child becomes a `Contact_Form_Field` object stored in `$this->fields`
   - Computes form hash from attributes for identification via `compute_id()`
   - Stores form in `self::$forms[$hash]` for later retrieval during submission

4. **Asset enqueuing** — inside `Contact_Form::parse()`
   - Enqueues `grunion.css` if `self::$style` is true
   - Enqueues `accessible-form` script
   - Sets up WordPress Interactivity API config with error messages and AJAX URL
   - Enqueues `jp-forms-view` script module (uses `@wordpress/interactivity`)

5. **HTML output assembly** — inside `Contact_Form::parse()`
   - Determines layout classes (flex, horizontal, single-input)
   - Checks for reload-after-success state via URL parameters
   - Generates JWT token via `Contact_Form::get_jwt()` (embedded as hidden field for secure submission)
   - Renders each field via `Contact_Form_Field::render()` (called during shortcode processing)
   - Adds hidden fields: `action`, `contact-form-id`, `contact-form-hash`, JWT token, nonce
   - Wraps in `<form>` tag with interactivity API directives (`wp-interactive`, `wp-on--submit`)
   - Renders success/error wrappers for AJAX responses

6. **Field rendering** — `Contact_Form_Field::render()`
   - Delegates to `render_field()` which switches on field type to call the appropriate renderer
   - Each renderer (e.g., `render_email_field()`, `render_textarea_field()`) produces HTML
   - Style variations (outlined, animated, below) controlled by `get_form_style()`

## Key decisions

- **JWT embedding**: The form's full attributes are encrypted into a JWT token in a hidden field. This allows stateless submission — the server doesn't need to re-parse the page to know what form was submitted. See `flows/jwt-encryption.md`.
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
- **Shortcode within blocks**: Block render callbacks in `Contact_Form_Plugin` (e.g., `gutenblock_render_field_text()`) convert block attributes to shortcode attributes via `block_attributes_to_shortcode_attributes()`, then call `Contact_Form::parse_contact_field()`. Blocks and shortcodes share the same rendering pipeline.
- **do_blocks() before parse()**: The block content is processed through `do_blocks()` before `parse()`, so inner field blocks are already rendered to their shortcode equivalents by the time parse runs.
- **Form hash stability**: The form hash (`sha1` of attributes) must be stable between render and submit. If attributes change between page load and submission (e.g., dynamic content), the form won't be found by hash in the legacy submission path.
