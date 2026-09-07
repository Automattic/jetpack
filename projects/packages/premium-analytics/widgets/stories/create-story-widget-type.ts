/**
 * WordPress dependencies
 */
import type { WidgetType } from '@wordpress/widget-primitives';

/**
 * Identity and declarative metadata a widget authors in `widget.json` — the
 * fields the dashboard reads from the REST manifest rather than from the
 * lazily-imported module.
 */
export interface StoryWidgetManifest {
	name: string;
	title: string;
	description?: string;
	help?: WidgetType[ 'help' ];
	category?: string;
	presentation?: string;
	keywords?: string[];
}

/**
 * Runtime-only fields a widget declares in `widget.ts` (its default export):
 * the ones that cannot live in JSON because they hold a React element or
 * component references. Typed loosely so any widget module is accepted without
 * a per-call-site cast.
 */
interface StoryWidgetModule {
	icon?: unknown;
	attributes?: unknown;
	example?: unknown;
}

/**
 * The widget type a story hands to `<WidgetDashboardWithWidget>`: identity plus
 * any authoring metadata, with the module's runtime-only fields.
 */
export type StoryWidgetType = {
	name: string;
	title: string;
} & Partial< Omit< WidgetType, 'apiVersion' | 'name' | 'renderModule' | 'title' > >;

/**
 * Combine a widget's `widget.json` manifest (identity + declarative metadata)
 * with its `widget.ts` module export (icon, attributes, example) into the
 * widget type a Storybook story hands to the dashboard helper.
 *
 * This mirrors what the dashboard does at runtime — merge the REST manifest
 * over the lazily-imported module — which Storybook has no REST layer to
 * perform. `name`/`title`/`help` and the other declarative fields come from the
 * manifest; `icon`, `attributes`, and `example` come from the module. The
 * attribute list is typed against the widget's own `Item`, so it is widened
 * here once instead of at every call site.
 */
export function createStoryWidgetType(
	manifest: StoryWidgetManifest,
	moduleDefinition: StoryWidgetModule
): StoryWidgetType {
	return {
		name: manifest.name,
		title: manifest.title,
		icon: moduleDefinition.icon as WidgetType[ 'icon' ],
		attributes: moduleDefinition.attributes as WidgetType[ 'attributes' ],
		example: moduleDefinition.example as WidgetType[ 'example' ],
		...( manifest.description ? { description: manifest.description } : {} ),
		...( manifest.category ? { category: manifest.category } : {} ),
		...( manifest.keywords ? { keywords: manifest.keywords } : {} ),
		...( manifest.help ? { help: manifest.help } : {} ),
		...( manifest.presentation
			? {
					presentation: manifest.presentation as WidgetType[ 'presentation' ],
			  }
			: {} ),
	};
}
