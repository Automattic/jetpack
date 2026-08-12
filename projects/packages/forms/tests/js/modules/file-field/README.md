# File Field View Testing

Tests for the file upload field's `view.js` module, which implements the file field on the WordPress Interactivity API: drag-and-drop, the file picker, per-file upload with progress, and removal.

## Testing Strategy

The module registers into the **shared** `jetpack/form` store — not a store of its own — and keeps `jetpack/field-file` only as a `wp_interactivity_config()` namespace for the upload endpoint, icon path and per-file error strings. That split is the thing these tests exist to protect, so `getConfig` is mocked **namespace-aware**: it throws on any namespace other than `jetpack/field-file`. A namespace-agnostic mock would let the split silently collapse without a single test failing.

Because the field lives in the shared store, `updateField` and `trackFirstInteraction` are contributed by `modules/form/view.js` rather than by this module. The `store` mock merges jest spies for those two into the returned `actions` object, which is how the real module reaches them at runtime.

### What's Tested

**Store registration**
- Registers into `jetpack/form`, not its own namespace
- Contributes `state.validators.file` alongside the other field validators

**Validation (`validators.file`)**
- Required/optional handling for an empty value (array or empty string)
- Files that errored, uploads still in flight, and the precedence between them

**Field configuration**
- `maxFiles` and `allowedMimeTypes` are read from the standard `fieldExtra` context entry, with a single-file fallback when it is absent
- `state.hasFileFieldFiles` and `state.isFileFieldFull`

**Adding files**
- MIME type, max upload size and max file count rejection, each with its own message
- Object-URL previews for image types (see the jsdom note below)
- The value reaches the shared `updateField` action

**Drag and drop**
- Dropping starts the form fill timer, since a drop fires no focus event
- Directories are skipped without discarding the rest of a mixed drop or stranding `isDropping`

**Removal and upload lifecycle**
- Object URLs are revoked; an emptied field reports `[]` rather than `''`
- A settled request drops its abort controller, so a later removal cannot abort a finished upload
- Concurrent uploads share a single upload-token request

**Focus**
- `focusFilePreview` focuses the preview and returns nothing. The return value matters: the `data-wp-init` directive *invokes* a returned function immediately rather than treating it as effect cleanup, which is what used to move focus onto the (hidden) dropzone.

### Limitations

- **jsdom has no `URL.createObjectURL`.** It is stubbed in `beforeEach`. Without the stub, `addFileToContext` falls back to the icon path for every file, and an image-preview assertion would pass for the wrong reason.
- **`XMLHttpRequest` is a hand-rolled double.** Upload progress and readystatechange are driven manually, so real network behaviour, aborts and partial transfers are not covered here.
- **The Interactivity API is mocked wholesale.** These tests verify module logic, not directive binding, reactivity or hydration — nothing here proves the `data-wp-*` attributes in `class-contact-form-field.php` resolve to the names the module registers. That pairing is only exercised end to end.
