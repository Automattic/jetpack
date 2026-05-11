import { Icon, search } from '@wordpress/icons';
import './embedded-preview.scss';

/**
 * Static visual preview rendered in the Embedded panel: a stylised
 * search-results card showing a category filter list and two highlighted
 * results. Decorative — `aria-hidden` so AT users get the description above
 * instead of an element-by-element read. Strings are intentionally not
 * translated; they're placeholder copy in a mockup, not real content.
 *
 * @return {import('react').Element} - The preview illustration.
 */
export default function EmbeddedPreview() {
	return (
		<div className="jp-search-feature-selector__embedded-preview" aria-hidden="true">
			<div className="jp-search-feature-selector__embedded-preview-results">
				<div className="jp-search-feature-selector__embedded-preview-search">
					<Icon
						className="jp-search-feature-selector__embedded-preview-search-icon"
						icon={ search }
						size={ 16 }
					/>
					pasta
				</div>
				<div className="jp-search-feature-selector__embedded-preview-result">
					<div className="jp-search-feature-selector__embedded-preview-result-title">
						10 Easy <mark>Pasta</mark> Recipes
					</div>
					<div className="jp-search-feature-selector__embedded-preview-result-meta">
						Recipes · Jan 2026
					</div>
				</div>
				<div className="jp-search-feature-selector__embedded-preview-result">
					<div className="jp-search-feature-selector__embedded-preview-result-title">
						Best <mark>Pasta</mark> Sauces
					</div>
					<div className="jp-search-feature-selector__embedded-preview-result-meta">
						Reviews · Mar 2026
					</div>
				</div>
			</div>
			<div className="jp-search-feature-selector__embedded-preview-filters">
				<div className="jp-search-feature-selector__embedded-preview-filter-title">Category</div>
				<ul className="jp-search-feature-selector__embedded-preview-filter-list">
					<li className="is-checked">
						<span className="jp-search-feature-selector__embedded-preview-checkbox" />
						Recipes
					</li>
					<li>
						<span className="jp-search-feature-selector__embedded-preview-checkbox" />
						Travel
					</li>
					<li>
						<span className="jp-search-feature-selector__embedded-preview-checkbox" />
						Reviews
					</li>
				</ul>
			</div>
		</div>
	);
}
