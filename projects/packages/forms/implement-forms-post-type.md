# Plan: Jetpack Forms Management System with Custom Post Type

Based on analysis of the codebase, here's a comprehensive plan to migrate Jetpack Forms from block-embedded storage to a custom post type architecture:

## Current Architecture Analysis

**Current State:**
- Forms are stored as `jetpack/contact-form` blocks directly in post/page content
- Form responses use the `feedback` custom post type (already exists)
- Forms have 35+ child blocks (fields, layout, navigation)
- Block attributes store form settings (subject, recipients, integrations, etc.)
- No centralized form management - forms are embedded in pages/posts

**Key Files:**
- `/projects/packages/forms/src/blocks/contact-form/` - Main form block
- `/projects/packages/forms/src/contact-form/class-feedback.php` - Response handling
- `/projects/packages/forms/src/dashboard/` - Existing response dashboard

---

## Proposed Architecture

### Phase 1: Custom Post Type for Forms

**1. Create `jetpack_form` Custom Post Type**

**Location:** `/projects/packages/forms/src/form-library/`

```
jetpack_form (CPT)
├── post_title: Form name
├── post_content: Serialized block content (InnerBlocks)
├── post_status: publish, draft, trash
└── post_meta:
    ├── _form_settings: JSON (subject, to, notifications, etc.)
    ├── _form_integrations: JSON (CRM, Mailpoet, Salesforce, etc.)
    ├── _form_version: Schema version for migrations
    └── _response_count: Cached response count
```

**Features:**
- Support for revisions (form history)
- Draft/publish workflow
- Trash/restore capability
- Form templates/patterns
- Import/export capability

---

### Phase 2: Reference Block System

**2. Create `jetpack/form-reference` Block**

This block replaces the full form block in post content and references the CPT:

```javascript
{
  "name": "jetpack/form-reference",
  "attributes": {
    "formId": number,           // Reference to jetpack_form post ID
    "formTitle": string,        // Cached for display
    "overrideSettings": object, // Optional per-instance overrides
    "displayMode": string       // "inline" | "modal" | "slide-in"
  }
}
```

**Implementation:**
- Block saves only the reference ID
- Editor loads form definition from CPT on edit
- Frontend renders form by fetching CPT data
- Allows same form to appear on multiple pages
- Changes to form automatically reflect everywhere

---

### Phase 3: Form Editor Integration

**3. Dual Editing Experience**

**Option A: Block Editor for Forms (Recommended)**
- Reuse existing form blocks in standalone editor
- Forms edited at `/wp-admin/post.php?post={id}&post_type=jetpack_form`
- Use `@wordpress/block-editor` for full block experience
- Inherit all existing block functionality
- No need to rebuild form builder UI

**Option B: Custom Form Builder**
- Build dedicated React form builder
- Drag-and-drop field management
- Visual form designer
- More overhead but potentially simpler UX

**Recommendation: Option A** - Leverage existing block infrastructure

---

### Phase 4: Form Library Dashboard

**4. Forms Management UI**

**Location:** `/wp-admin/edit.php?post_type=jetpack_form`

**Features:**
- List all forms with metadata:
  - Form name
  - Response count
  - Last modified
  - Used on X pages/posts
- Quick actions: Edit, Duplicate, Export, Trash
- Bulk operations
- Search and filter
- Form templates library

**Integration with existing dashboard:**
- Enhance `/projects/packages/forms/src/dashboard/`
- Add "Forms Library" section
- Link responses to parent form
- Show form usage analytics

---

### Phase 5: Migration Strategy

**5. Backward Compatibility & Migration**

**Migration Path:**

```
Existing Block → Detect on Save → Create CPT → Replace with Reference
```

**Implementation:**

1. **Automatic Migration Hook:**
   - Hook into `save_post` for posts containing `jetpack/contact-form`
   - Extract form block and attributes
   - Create new `jetpack_form` CPT
   - Replace original block with `jetpack/form-reference`
   - Preserve all form settings and fields

2. **Batch Migration Tool:**
   - WP-CLI command: `wp jetpack-forms migrate`
   - Admin UI tool: "Migrate Forms to Library"
   - Progress tracking and rollback support

3. **Fallback Rendering:**
   - If `jetpack/contact-form` still exists, render normally
   - Gradual migration - both systems work simultaneously
   - No breaking changes during transition

---

## Detailed Implementation Plan

### Step 1: Register Custom Post Type
**Files to create:**
- `class-form-post-type.php` - CPT registration
- `class-form-meta.php` - Meta box handlers

**Tasks:**
- Register `jetpack_form` with appropriate capabilities
- Add meta boxes for form settings
- Enable revisions and autosave
- Set up REST API endpoints

---

### Step 2: Create Reference Block
**Files to modify/create:**
- `blocks/form-reference/block.json`
- `blocks/form-reference/edit.tsx` - Editor component
- `blocks/form-reference/save.tsx` - Save handler
- `blocks/form-reference/view.tsx` - Frontend rendering

**Tasks:**
- Build form selector UI (dropdown/modal)
- Implement form preview in editor
- Handle form loading and caching
- Support SSR and dynamic rendering

---

### Step 3: Update Form Block for CPT Context
**Files to modify:**
- `blocks/contact-form/editor.ts`
- `blocks/contact-form/class-contact-form-block.php`

**Tasks:**
- Detect if editing in CPT vs. inline
- Disable certain settings in CPT mode (like subject override)
- Save to post_meta instead of block attributes
- Maintain backward compatibility

---

### Step 4: Build Form Editor
**Files to create:**
- `form-library/class-form-editor.php`
- `form-library/editor.tsx`

**Tasks:**
- Create custom edit screen for `jetpack_form`
- Initialize block editor
- Load form blocks
- Handle save to CPT

---

### Step 5: Update Response System
**Files to modify:**
- `contact-form/class-feedback.php`
- `contact-form/class-contact-form-endpoint.php`

**Tasks:**
- Link responses to `jetpack_form` ID instead of post_parent
- Add `_form_id` meta to feedback posts
- Update queries to filter by form
- Maintain backward compatibility for old responses

---

### Step 6: Build Migration System
**Files to create:**
- `migrations/class-form-migrator.php`
- `cli/class-forms-command.php`

**Tasks:**
- Scan posts for `jetpack/contact-form` blocks
- Extract block content and attributes
- Create CPT entries
- Replace blocks with references
- Add rollback mechanism

---

### Step 7: Update Dashboard
**Files to modify:**
- `dashboard/class-dashboard.php`
- `dashboard/components/` - React components

**Tasks:**
- Add "Forms Library" navigation
- Show form usage statistics
- Link responses to forms
- Add form analytics

---

## Key Considerations

### Data Integrity
- **No data loss:** All existing forms must migrate successfully
- **Validation:** Verify form structure before/after migration
- **Audit log:** Track all migrations and changes

### Performance
- **Caching:** Cache form definitions on frontend
- **Lazy loading:** Load form blocks only when needed in editor
- **Database indexes:** Add indexes on form_id for responses

### User Experience
- **Seamless transition:** Users shouldn't notice the change
- **Progressive migration:** Allow both systems to coexist
- **Clear messaging:** Notify users of benefits (reusable forms, centralized management)

### Compatibility
- **Plugins/Themes:** Ensure integrations continue working
- **REST API:** Maintain existing endpoints for responses
- **Filters/Hooks:** Preserve all existing extension points

### Rollback Plan
- **Version check:** Store schema version in database
- **Reverse migration:** Ability to convert CPT back to blocks
- **Feature flag:** Control rollout with feature flags

---

## Benefits of This Approach

1. **Centralized Management:** Single location for all forms
2. **Reusability:** Use same form across multiple pages
3. **Version Control:** Form revisions and history
4. **Better Analytics:** Track form performance across site
5. **Easier Maintenance:** Update form once, affects all instances
6. **Templates:** Create form libraries and patterns
7. **Import/Export:** Share forms between sites
8. **Better Permissions:** Control who can edit forms vs. pages
9. **Improved Performance:** Cache form definitions
10. **Future Features:** A/B testing, conditional logic, etc.

---

## Timeline Estimate

- **Phase 1 (CPT):** 1-2 weeks
- **Phase 2 (Reference Block):** 1-2 weeks
- **Phase 3 (Form Editor):** 2-3 weeks
- **Phase 4 (Dashboard):** 1-2 weeks
- **Phase 5 (Migration):** 2-3 weeks
- **Testing & Polish:** 2-3 weeks

**Total:** 9-15 weeks for full implementation

---

## Next Steps

1. Start implementing the custom post type registration
2. Create the reference block
3. Build a proof-of-concept migration script
4. Create detailed technical specifications for each phase
