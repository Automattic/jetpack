# Jetpack Forms Hooks Implementation

## Overview

Two custom React hooks have been created to manage the integration between the Jetpack Forms block editor and the `jetpack_form` custom post type:

1. **`useFormRef`** - Creates a CPT when a new form block is inserted
2. **`useFormSync`** - Syncs block content and settings to the CPT

---

## 1. useFormRef Hook

**File**: `src/blocks/contact-form/hooks/use-form-ref.ts`

### Purpose
Automatically creates a `jetpack_form` custom post type when a new form block is inserted into the editor.

### How It Works

```typescript
const { isCreating, error } = useFormRef({
    formRef,        // Current formRef attribute value
    setAttributes,  // Function to update block attributes
    attributes      // All block attributes
});
```

### Workflow

1. **Detection**: Checks if `formRef === 0` (indicates new form)
2. **One-time execution**: Uses `useRef` to prevent duplicate creation attempts
3. **Data preparation**:
   - Extracts form settings (subject, recipients, confirmation type, etc.)
   - Extracts integrations (CRM, Mailpoet, Salesforce, etc.)
   - Generates form title from post title or defaults to "New Form"
4. **API call**: `POST /jetpack-forms/v1/forms/create-from-block`
5. **Update attribute**: Sets `formRef` to the new CPT post ID
6. **Error handling**: Returns error state if creation fails

### Key Features

- **Idempotent**: Only creates once, even if component re-renders
- **Non-blocking**: Async operation doesn't freeze the UI
- **Error recovery**: Allows retry if creation fails
- **Integration-aware**: Captures all form settings and integrations on creation

### Return Values

- `isCreating` (boolean): True while CPT is being created
- `error` (string|null): Error message if creation failed

---

## 2. useFormSync Hook

**File**: `src/blocks/contact-form/hooks/use-form-sync.ts`

### Purpose
Keeps the `jetpack_form` CPT in sync with changes made in the block editor.

### How It Works

```typescript
useFormSync({
    formRef,    // CPT post ID
    clientId,   // Block client ID
    attributes  // All block attributes
});
```

### Workflow

#### A. Block Content Sync

1. **Watch inner blocks**: Uses `useSelect` to monitor changes to child blocks
2. **Serialize blocks**: Converts blocks to HTML using `serialize()`
3. **Debounce**: Waits 2 seconds after last change before syncing
4. **Compare**: Only syncs if content has actually changed
5. **API call**: `PUT /jetpack-forms/v1/forms/{id}/blocks`

#### B. Settings Sync

1. **Watch attributes**: Monitors all form settings and integrations
2. **Extract data**: Separates settings from integrations
3. **Serialize**: Converts to JSON for comparison
4. **Debounce**: 2-second delay to avoid excessive API calls
5. **Compare**: Only syncs if settings have changed
6. **API call**: `PUT /jetpack-forms/v1/forms/{id}/sync`

### Key Features

- **Debounced**: Prevents API spam during rapid edits
- **Smart diffing**: Only syncs when actual changes detected
- **Dual-channel**: Syncs blocks and settings separately
- **Non-blocking**: Background sync doesn't interrupt editing
- **Error handling**: Logs errors without disrupting user experience

### Synced Data

**Settings**:
- `subject`, `to`
- `customThankyouHeading`, `customThankyouMessage`, `customThankyouRedirect`
- `confirmationType`
- `saveResponses`, `emailNotifications`, `formNotifications`
- `disableGoBack`, `disableSummary`
- `notificationRecipients`

**Integrations**:
- `jetpackCRM`
- `salesforceData`
- `mailpoet`
- `hostingerReach`

---

## Integration in Edit Component

**File**: `src/blocks/contact-form/edit.tsx`

### Changes Made

1. **Imports added**:
```typescript
import useFormRef from './hooks/use-form-ref';
import useFormSync from './hooks/use-form-sync';
```

2. **Type definition updated**:
```typescript
type JetpackContactFormAttributes = {
    formRef: number;  // Added
    // ... existing attributes
    jetpackCRM?: boolean;
    salesforceData?: Record<string, unknown>;
    mailpoet?: Record<string, unknown>;
    hostingerReach?: Record<string, unknown>;
    saveResponses?: boolean;
    formNotifications?: boolean;
};
```

3. **Hooks called in component**:
```typescript
function JetpackContactFormEdit({ attributes, setAttributes, clientId }) {
    const { formRef } = attributes;

    // Create CPT if needed
    const { isCreating, error } = useFormRef({
        formRef,
        setAttributes,
        attributes,
    });

    // Sync to CPT
    useFormSync({
        formRef,
        clientId,
        attributes,
    });

    // ... rest of component
}
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  USER INSERTS FORM BLOCK                                        │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  useFormRef Hook                                                 │
│  ├─ Detects formRef === 0                                       │
│  ├─ Extracts settings & integrations                            │
│  ├─ POST /jetpack-forms/v1/forms/create-from-block              │
│  └─ Updates formRef with new CPT ID                             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  USER EDITS FORM (adds fields, changes settings)                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  useFormSync Hook                                                │
│  ├─ Watches inner blocks changes                                │
│  │  ├─ Serializes blocks to HTML                                │
│  │  ├─ Debounces for 2 seconds                                  │
│  │  ├─ PUT /jetpack-forms/v1/forms/{id}/blocks                  │
│  │  └─ Updates CPT post_content                                 │
│  │                                                               │
│  └─ Watches attribute changes                                   │
│     ├─ Extracts settings & integrations                         │
│     ├─ Debounces for 2 seconds                                  │
│     ├─ PUT /jetpack-forms/v1/forms/{id}/sync                    │
│     └─ Updates CPT post_meta                                    │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  JETPACK_FORM CPT (Database)                                    │
│  ├─ post_content: Serialized blocks HTML                        │
│  ├─ _jetpack_form_settings: Settings JSON                       │
│  └─ _jetpack_form_integrations: Integrations JSON               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Performance Optimizations

### 1. Debouncing
- Both hooks use 2-second debounce
- Prevents API spam during rapid editing
- Reduces server load significantly

### 2. Smart Diffing
- `useFormSync` compares serialized content before syncing
- Only makes API calls when actual changes detected
- Uses `useRef` to store previous state

### 3. Idempotency
- `useFormRef` only creates CPT once
- Multiple component renders don't trigger duplicate creations
- Uses `hasAttemptedCreation` ref for tracking

### 4. Non-blocking
- All API calls are async
- UI remains responsive during sync
- Errors are logged, not thrown

---

## Error Handling

### useFormRef Errors
- Network failures
- Permission issues
- Server errors

**Behavior**:
- Logs error to console
- Returns error in hook return value
- Resets attempt flag to allow retry
- User can re-trigger by re-inserting block

### useFormSync Errors
- Network failures during sync
- Invalid data

**Behavior**:
- Logs error to console
- Doesn't interrupt user experience
- Next change will retry sync
- Silent failure (doesn't show user-facing errors)

---

## Testing Checklist

### useFormRef
- [ ] CPT created when new form block inserted
- [ ] formRef attribute updated with new post ID
- [ ] Settings extracted correctly
- [ ] Integrations extracted correctly
- [ ] Form title generated properly
- [ ] Doesn't create duplicate CPTs on re-render
- [ ] Error handling works
- [ ] Retry after error works

### useFormSync
- [ ] Inner blocks synced to CPT
- [ ] Settings synced to CPT
- [ ] Integrations synced to CPT
- [ ] Debouncing works (no spam during rapid edits)
- [ ] Only syncs when changes detected
- [ ] Doesn't sync before CPT created (formRef === 0)
- [ ] Handles multi-step forms correctly
- [ ] Error logging works

### Integration
- [ ] Hooks don't interfere with existing functionality
- [ ] Multi-step form conversion still works
- [ ] All form variations work
- [ ] Settings panel still functional
- [ ] No performance degradation
- [ ] No console errors

---

## Known Limitations

1. **Initial block content**: Empty on creation, filled on first edit
2. **Race conditions**: If user saves post immediately after inserting form, formRef might still be 0
3. **No offline support**: Requires active network connection
4. **No conflict resolution**: Last write wins if multiple editors

---

## Future Enhancements

1. **Loading indicators**: Show visual feedback during creation/sync
2. **Manual sync button**: Allow user to force sync
3. **Sync status indicator**: Show "Saved" / "Saving" / "Error" state
4. **Conflict resolution**: Detect and handle concurrent edits
5. **Offline queue**: Queue sync operations when offline
6. **Optimistic updates**: Update UI before API confirms
7. **Rollback**: Undo failed syncs

---

## Files Modified/Created

### New Files
- `src/blocks/contact-form/hooks/use-form-ref.ts` ✅
- `src/blocks/contact-form/hooks/use-form-sync.ts` ✅

### Modified Files
- `src/blocks/contact-form/edit.tsx` ✅
- `src/blocks/contact-form/attributes.ts` ✅

---

## Next Steps

See `IMPLEMENTATION-STATUS.md` for remaining implementation tasks:
- Update block save function
- Update PHP block renderer
- Add migration system
- Update dashboard integration
