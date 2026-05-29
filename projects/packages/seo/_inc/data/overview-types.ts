import { z } from 'zod';

// Zod schema for the `overview` data-sync entry. `useDataSync` validates the
// server payload against this and `OverviewResponse` is inferred from it, so
// the schema is the single source of truth for the shape. Mirrors the
// server-side `Initializer::overview_schema()` registration.
export const OverviewSchema = z.object( {
	site_visibility: z.object( {
		search_engines_visible: z.boolean(),
		sitemap_active: z.boolean(),
		sitemap_url: z.string(),
		seo_tools_active: z.boolean(),
		front_page_description: z.string(),
	} ),
	plan: z.object( {
		seo_enabled_for_site: z.boolean(),
	} ),
} );

export type OverviewResponse = z.infer< typeof OverviewSchema >;
