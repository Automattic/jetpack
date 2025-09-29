# Agenttic Chat Integration for Media Editor

## Quick Setup

The agenttic chat integration has been simplified with hardcoded configuration values. To use it, you only need to update two files with your actual agent credentials:

1. **`provider.tsx`** – Replace the placeholder `AGENT_ID` and `AGENT_URL`. This module also prepends `[Media Editor]` to every outbound prompt while stripping it from the UI transcript.
2. **`auth.tsx`** – Replace the hardcoded token/API key pair with credentials that can reach the WP.com agent API.

## How to setup locally

- Sandbox https://public-api.wordpress.com
- Enable writes
- Pull WPCom PR in your sandbox
- Build and start your local env -- follow README instructions
- Run JT `JT_DOMAIN=kat3samsin WPCOM_USERNAME=kat3samsin npm run jt`
- Navigate to your JT site
- Deactivate jetpack-next, ciab
- Activate jetpack and connect account
- Navigate to the next-admins media editor and selecte an image

## Feature overview

- Floating chat UI powered by `@automattic/agenttic-ui`.
- Automatic prompt prefixing so Big Sky always receives `[Media Editor]` context (hidden from the user transcript).
- `update_media_editor` tool integration that records AI variants and invalidates `core-data` for updated attachments.
- AI variants surfaced through the **AI Edits** panel (Details tab) with Preview / Accept / Discard actions.
- Accepting a variant navigates to the returned attachment (if different) and clears the temporary preview; discarding removes it from state/history.

## Architecture

TODO: Add architecture diagram

### Chat flow

- `context.tsx` supplies media metadata (attachment ID, URL, dimensions) expected by the server prompt.
- `tools.tsx` registers `update_media_editor`, bridging server tool results into local state.

### Image replacement flow

- Big Sky returns `update_media_editor` with `attachmentId`, `url`, and summary text.
- `tools.tsx` stores the variant via `addAiVariant`, adds it to history, and invalidates `core-data` so the attachment is refreshed.
- `with-media-editor-state-provider.tsx` manages pending/accepted variants and exposes accept/discard helpers.
- `sidebar/ai-edits.tsx` renders the **AI Edits** panel, letting users preview, accept, or discard generated variants.

## File Structure

```
components/agenttic-chat/
├── index.tsx                 # Main exports
├── provider.tsx              # Main provider (handles session, prompt prefixing, and AGENT_ID/AGENT_URL)
├── auth.tsx                  # Authentication (update tokens here)
├── context.tsx               # Media context provider
├── tools.tsx                 # Image editing tools (includes update_media_editor handler + core-data refresh)
├── floating-chat.tsx         # Floating chat UI
├── message-actions.tsx       # Custom message actions
├── image-processor.tsx       # AI image processing service
├── media-uploader.tsx        # Media library upload utility
├── styles.scss               # WordPress admin styling
└── ai-styles.scss           # AI-specific UI styles
```
