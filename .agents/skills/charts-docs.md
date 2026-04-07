---
description: Create or update @automattic/charts docs using the standard docs and API templates
---

Create or update chart feature documentation in `projects/js-packages/charts` following the established Storybook docs patterns.

Instructions:
1. Identify the chart feature being documented and locate its stories directory under `projects/js-packages/charts/src/**/stories/`.
2. Read these references before writing docs:
   - `projects/js-packages/charts/docs/ai-documentation-guide.md`
   - `projects/js-packages/charts/docs/feature-documentation.mdx.template`
   - `projects/js-packages/charts/docs/feature-api-documentation.mdx.template`
3. Ensure the docs set contains three coordinated files for the feature:
   - `[feature-name].stories.tsx`
   - `[feature-name].docs.mdx` (usage docs)
   - `[feature-name].api.mdx` (API reference only)
4. Keep responsibilities separated:
   - `.docs.mdx` includes usage patterns, examples, accessibility notes, and behavioral guidance.
   - `.api.mdx` includes props tables and type definitions only (no usage examples).
5. In `.docs.mdx`, include an "API Reference" section that links to the corresponding `.api.mdx` entry in Storybook.
6. If the feature supports animation, include animation docs. If no `animation` prop exists, remove animation sections.
7. Match existing Storybook naming and organization patterns:
   - Story names should be clear and focused (`Default`, `Styled`, variation-specific names).
   - Keep section order progressive (basic to advanced).
8. Validate references and consistency:
   - Prop names/types match implementation and stories.
   - Cross-links resolve to the expected Storybook docs entries.
   - Examples reflect current API, not legacy patterns.
9. Run relevant checks from `projects/js-packages/charts`:
   - `pnpm run typecheck`
   - `pnpm run test` (if behavior or stories were updated)
10. Summarize what was documented, what API surface changed (if any), and any known limitations noted in docs.

Do not invent unsupported behaviors. When uncertain, prefer what is already implemented in chart code and stories.
