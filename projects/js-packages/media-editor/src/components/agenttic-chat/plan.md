# Plan: Media Editor AI Replacement Flow

## Context

We now support Big Sky + media-editor integration, but edits still fail when the
server cannot read the original asset and the UI lacks an acceptance workflow
for generated variants. This document tracks the remaining server/agent and
client tasks required to make AI replacements reliable.

## ✅ Completed

- Added media-editor context plumbing in `AgentticChatProvider` and
  `useMediaEditingContext` so Big Sky knows the current attachment.
- Registered an `update_media_editor` tool handler that feeds the canvas with
  the agent’s provisional result.

## 🔄 TODO — Client Integration

1. **Context Payload** – Ensure `useMediaEditingContext` always sends
   `client.media_editor.is_active` and a complete `current_item` (id, url, title,
   alt text, dimensions, metadata).
2. **Tool Handler Enhancements** – In `tools.tsx`, expand the
   `update_media_editor` handler to refresh core-data (via
   `invalidateResolution` / `receiveEntityRecords`), track pending/accepted
   variants, and expose accept/decline helpers from the media editor state
   provider.
3. **UI Surface** – Add an “AI edits” surface (sidebar panel or chat footer)
   that lists generated variants with actions for preview, accept, or discard.
4. **Save Flow** – When a variant is accepted, persist the change through
   core-data (either replace the existing attachment or navigate to the new
   ID) and schedule cleanup for orphaned variants via REST.

## 🔧 TODO — Server / Agent Integration

1. **Source Image Fallbacks** – Update `handle_media_editor_mode()` so it tries
   `get_attached_file()`, `wp_get_original_image_path()`, and finally
   `wp_safe_remote_get( wp_get_attachment_url() )` before returning
   `image_source_unavailable`, logging which path succeeded.
2. **Argument Normalisation** – When `attachmentId` is present, populate missing
   `url` and `orientation` fields from the attachment record so the tool call is
   resilient even if the agent omits them.
3. **Input Guard** – If an edit arrives without either `attachmentId` or `url`,
   return an `Input_Required_Result` requesting the data instead of failing.
4. **Agent Prompting** – Tighten the media-editor examples in
   `class.big-sky-agent.php` to explicitly require `isEdit: true`,
   `attachmentId`, and `url` whenever editing the existing asset.

## Testing Scenarios

1. **Edit Existing Image** – “Add a hat to the cat” should succeed even when the
   file lives off-box.
2. **Replace Image** – “Replace with a sunset” should overwrite the attachment
   and clean up temporary files.
3. **Generate New Variant** – “Create a logo” should surface a selectable new
   attachment without affecting the original.
4. **Missing Data Guard** – Trigger an edit without `url` to confirm the tool
   returns an input-required response instead of a fatal error.
5. **Block Mode Regression** – Run a Gutenberg block edit to confirm
   non–media-editor behaviour stays intact.

## Implementation Order

1. Harden server fallbacks in `class.generate-image.php`.
2. Adjust prompts / guards in `class.big-sky-agent.php`.
3. Build accept/decline workflow and core-data refresh on the client.
4. Add the AI-variant UI surface and hook into the media editor save flow.
5. Run regression tests across block editor and media editor modes.

## Success Criteria

- ✅ Agent reliably identifies media editor context with required fields.
- ✅ `generate_image` can always read the source image via local or remote
  fallback.
- ✅ Media editor UI presents variants with accept/decline controls.
- ✅ Accepting a variant updates the canonical attachment and cleans up extras.
- ✅ Block editor features remain unchanged.
