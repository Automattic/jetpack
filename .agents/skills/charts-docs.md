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
9. Author `<Source>` example blocks so the rendered snippet is indented correctly (see "Authoring `<Source>` example blocks" below).
10. Run relevant checks from `projects/js-packages/charts`:
    - `pnpm run typecheck`
    - `pnpm run test` (if behavior or stories were updated)
11. Summarize what was documented, what API surface changed (if any), and any known limitations noted in docs.

## Authoring `<Source>` example blocks

Storybook's `<Source code={ \`...\` } />` blocks run their template-literal contents through a **dedent** that strips one leading indentation level before rendering. Author blocks by hand and match the convention already used across the chart docs — otherwise the rendered example ends up with every prop flush against the component tag (looks broken), or with a mixed tab/space indent.

Convention for the string inside `` code={ `...` } ``:

- Keep the **leading imports / setup paragraph** (everything before the first blank line inside the template literal) flush at column 0.
- Indent the **JSX body** one level: opening tag (`<Tag`) at one tab, its props at two tabs, self-closing `/>` (or closing `</Tag>`) back at one tab. Nested children go one tab deeper as usual.
- **Use tabs only.** Do not mix tabs and spaces inside the template literal.
- **Do not run Prettier over `.mdx` files.** Prettier will rewrite the block with mixed tabs/spaces and break the dedent. The repo's pre-commit hook only formats JS/TS/JSON, so leaving `.mdx` alone is the intended workflow.

Example (matches `bar-chart/stories/index.docs.mdx`):

```mdx
<Source
	language="jsx"
	code={ `import { BarChart } from '@automattic/charts';
import '@automattic/charts/style.css';

	<BarChart
		data={ data }
		withTooltips={ true }
	/>` }
/>
```

Quick self-check before committing new or edited chart docs:

- Open the story in Storybook (or the built docs) and confirm props render on their own indented lines rather than flat against the component tag.
- If props render flat, the JSX body inside the template literal is under-indented by one level — add one tab to `<Tag>`, two tabs to each prop, and one tab to the closing tag.
- If indentation looks ragged, check for a tab/space mix (often the result of an editor auto-format or a Prettier pass) and re-tab the block.

Do not invent unsupported behaviors. When uncertain, prefer what is already implemented in chart code and stories.
