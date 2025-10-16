# Jetpack Forms CPT Implementation Status

## Completed ✅

### 1. Custom Post Type Infrastructure
- **File**: `src/contact-form/class-jetpack-form.php`
- Created `jetpack_form` custom post type
- Registered meta fields for REST API:
  - `_jetpack_form_settings` - Form configuration (subject, recipients, notifications)
  - `_jetpack_form_integrations` - Third-party integrations
  - `_jetpack_form_version` - Schema version
  - `_jetpack_form_response_count` - Cached response count
- Implemented helper methods:
  - `get_form()` - Retrieve form by ID
  - `get_form_settings()` / `update_form_settings()`
  - `get_form_integrations()` / `update_form_integrations()`
  - `get_response_count()` / `increment_response_count()`
  - `get_forms()` - Query multiple forms
  - `delete_form()` - Delete with optional response cleanup
  - `duplicate_form()` - Clone forms

### 2. REST API Endpoints
- **File**: `src/contact-form/class-jetpack-form-endpoint.php`
- Created REST API routes under `jetpack-forms/v1`:
  - `POST /forms/create-from-block` - Create form from block editor
  - `PUT /forms/{id}/blocks` - Update form block content
  - `PUT /forms/{id}/sync` - Sync settings and integrations
- Permission callbacks for proper capability checking

### 3. Block Attributes
- **File**: `src/blocks/contact-form/attributes.ts`
- Added `formRef` attribute to store jetpack_form post ID

### 4. Plugin Integration
- **File**: `src/contact-form/class-contact-form-plugin.php`
- Initialized `Jetpack_Form::init()` and `Jetpack_Form_Endpoint::init()`

---

## Remaining Work 🚧

### Phase 1: JavaScript Integration (Required for Basic Functionality)

#### A. Create Form on Block Insert
**New File**: `src/blocks/contact-form/hooks/use-form-ref.ts`

```typescript
/**
 * Hook to create and manage jetpack_form CPT reference
 *
 * Responsibilities:
 * - Detect when formRef is 0 (new block)
 * - Call REST API to create jetpack_form post
 * - Update formRef attribute with new post ID
 * - Handle errors gracefully
 */
```

**Implementation Steps**:
1. Create `useFormRef` hook
2. Call `POST /wp-json/jetpack-forms/v1/forms/create-from-block` on mount if `formRef === 0`
3. Extract form title from post/page title or block attributes
4. Update `formRef` attribute with response `form_id`

#### B. Sync Inner Blocks to CPT
**New File**: `src/blocks/contact-form/hooks/use-form-sync.ts`

```typescript
/**
 * Hook to sync block inner blocks to jetpack_form post content
 *
 * Responsibilities:
 * - Watch for changes to inner blocks
 * - Debounce sync calls (e.g., 2 seconds)
 * - Serialize inner blocks to HTML
 * - Call REST API to update form content
 * - Sync form settings (subject, to, etc.)
 * - Sync integrations (CRM, Mailpoet, etc.)
 */
```

**Implementation Steps**:
1. Use `useSelect` to watch inner blocks changes
2. Use `serialize()` from `@wordpress/blocks` to get HTML
3. Debounce with `useDebouncedCallback` or similar
4. Call `PUT /wp-json/jetpack-forms/v1/forms/{id}/blocks`
5. Call `PUT /wp-json/jetpack-forms/v1/forms/{id}/sync` for settings

#### C. Update Edit Component
**File**: `src/blocks/contact-form/edit.tsx`

**Changes Needed**:
1. Import and use `useFormRef` hook
2. Import and use `useFormSync` hook
3. Add `formRef` to `JetpackContactFormAttributes` type
4. Pass `formRef` through to hooks

Example:
```typescript
function JetpackContactFormEdit( { attributes, setAttributes, clientId } ) {
    const { formRef } = attributes;

    // Create form ref if needed
    useFormRef( formRef, setAttributes, attributes );

    // Sync blocks and settings to CPT
    useFormSync( formRef, clientId, attributes );

    // ... rest of component
}
```

---

### Phase 2: Block Save/Render Update

#### D. Modify Block Save Function
**File**: `src/blocks/contact-form/index.js`

**Current**:
```javascript
save: () => {
    const blockProps = useBlockProps.save();
    return (
        <div { ...blockProps }>
            <InnerBlocks.Content />
        </div>
    );
},
```

**New Approach** (store only reference):
```javascript
save: ( { attributes } ) => {
    const blockProps = useBlockProps.save();
    const { formRef } = attributes;

    return (
        <div { ...blockProps } data-form-ref={ formRef }>
            {/* Inner blocks are stored in CPT, not here */}
        </div>
    );
},
```

#### E. Update PHP Block Renderer
**File**: `src/blocks/contact-form/class-contact-form-block.php`

**Changes Needed**:
1. Extract `formRef` from block attributes in render callback
2. If `formRef` exists, fetch form from `Jetpack_Form::get_form( $formRef )`
3. Parse and render blocks from CPT `post_content`
4. Load settings from CPT meta instead of block attributes
5. Maintain backward compatibility for forms without `formRef`

---

### Phase 3: Migration & Backward Compatibility

#### F. Detect Legacy Forms
**New File**: `src/blocks/contact-form/hooks/use-legacy-migration.ts`

**Responsibilities**:
- Detect forms where `formRef === 0` AND has inner blocks (legacy form)
- Prompt user to migrate or auto-migrate
- Create CPT from existing inner blocks
- Update `formRef`

#### G. Render Fallback
**In Block Renderer**:
- If `formRef === 0` and no inner blocks → show error/placeholder
- If `formRef === 0` but has inner blocks → render as before (legacy mode)
- If `formRef > 0` → render from CPT

---

### Phase 4: Dashboard Integration

#### H. Link Responses to Forms
**File**: `src/contact-form/class-feedback.php`

**Changes**:
1. When saving feedback, add `_jetpack_form_id` meta
2. Extract `formRef` from submitted form data
3. Link response to form CPT instead of just post_parent

#### I. Update Dashboard
**File**: `src/dashboard/`

**Changes**:
1. Add "Forms" tab to show all jetpack_form posts
2. Show response count per form
3. Link to edit form in block editor
4. Show which pages/posts use each form

---

## Testing Checklist

- [ ] Create new form block → CPT created automatically
- [ ] Edit form fields → synced to CPT
- [ ] Save post → formRef persisted in block
- [ ] View frontend → form rendered from CPT
- [ ] Submit form → response linked to form CPT
- [ ] Duplicate form → new CPT created
- [ ] Delete form → CPT deleted (with option for responses)
- [ ] Legacy forms still work (backward compatibility)
- [ ] Multi-step forms work with CPT
- [ ] All integrations (CRM, Mailpoet, etc.) work
- [ ] Form settings sync properly
- [ ] REST API permissions work correctly

---

## File Structure

```
projects/packages/forms/src/
├── contact-form/
│   ├── class-jetpack-form.php ✅
│   ├── class-jetpack-form-endpoint.php ✅
│   ├── class-contact-form-plugin.php ✅ (updated)
│   └── class-contact-form-block.php 🚧 (needs update)
├── blocks/contact-form/
│   ├── attributes.ts ✅ (updated)
│   ├── edit.tsx 🚧 (needs update)
│   ├── index.js 🚧 (needs update)
│   └── hooks/
│       ├── use-form-ref.ts ⏳ (new)
│       ├── use-form-sync.ts ⏳ (new)
│       └── use-legacy-migration.ts ⏳ (new)
└── dashboard/ 🚧 (needs updates)
```

**Legend**:
- ✅ Complete
- 🚧 Needs modification
- ⏳ Needs creation

---

## Next Immediate Steps

1. **Create `use-form-ref.ts` hook** - This is critical for creating CPT on block insert
2. **Create `use-form-sync.ts` hook** - Keeps CPT in sync with block changes
3. **Update `edit.tsx`** - Integrate the hooks
4. **Test in development environment**
5. **Update block save function** to store only reference
6. **Update PHP renderer** to load from CPT

---

## Notes & Considerations

### Data Flow
```
Block Editor (React)
    ↓ [useFormRef]
Creates jetpack_form CPT via REST API
    ↓
Block gets formRef attribute
    ↓ [useFormSync - debounced]
Inner blocks → serialized → PUT /forms/{id}/blocks
Settings → PUT /forms/{id}/sync
    ↓
CPT stores:
    - post_content: serialized blocks
    - post_meta: settings, integrations
    ↓ [On Frontend]
PHP Block Renderer
    ↓
Fetches from CPT using formRef
    ↓
Renders form from CPT data
```

### Backward Compatibility Strategy
- Forms without `formRef` continue to work as before
- Migration can be opt-in initially
- Future versions can auto-migrate on first edit
- Keep both rendering paths during transition

### Performance Considerations
- Debounce sync calls to avoid excessive API requests
- Cache CPT form data on frontend
- Consider using WordPress object cache
- Batch setting updates when possible

---

## Questions to Resolve

1. **Auto-create vs Manual**: Should CPT be created automatically on block insert, or require user action?
   - **Recommendation**: Auto-create for seamless UX

2. **Migration Prompt**: How to handle existing forms?
   - **Recommendation**: Auto-migrate on first save, keep legacy render path

3. **Title Generation**: How to name auto-created forms?
   - **Recommendation**: Use page/post title + "Form" or "Form - [timestamp]"

4. **Deletion Behavior**: What happens when post containing form is deleted?
   - **Recommendation**: Keep CPT (forms are reusable), add admin UI to clean orphans

5. **Multi-instance**: Can same formRef appear in multiple posts?
   - **Recommendation**: Yes! That's the point - reusable forms
