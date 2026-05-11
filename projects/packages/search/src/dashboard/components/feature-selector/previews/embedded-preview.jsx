import { Icon, search, chevronDown } from '@wordpress/icons';
import './embedded-preview.scss';

/**
 * Static visual preview rendered in the Embedded panel: a stylised search
 * results page mirroring what the embedded experience actually looks like —
 * a full-width search input, a sort-by control on the right, a results
 * column with title / breadcrumb / thumbnail rows on the left, and a
 * narrower filter sidebar with multiple facet groups on the right.
 *
 * Decorative — `aria-hidden` so AT users get the description above instead
 * of an element-by-element read. Strings are intentionally not translated;
 * they're placeholder copy in a mockup, not real content.
 *
 * @return {import('react').Element} - The preview illustration.
 */
export default function EmbeddedPreview() {
	return (
		<div className="jp-search-feature-selector__embedded-preview" aria-hidden="true">
			<div className="jp-search-feature-selector__embedded-preview-search">
				<Icon
					className="jp-search-feature-selector__embedded-preview-search-icon"
					icon={ search }
					size={ 14 }
				/>
				block
			</div>
			<div className="jp-search-feature-selector__embedded-preview-sort">
				Sort by
				<span className="jp-search-feature-selector__embedded-preview-sort-control">
					Relevance
					<Icon icon={ chevronDown } size={ 12 } />
				</span>
			</div>
			<div className="jp-search-feature-selector__embedded-preview-body">
				<div className="jp-search-feature-selector__embedded-preview-results">
					<div className="jp-search-feature-selector__embedded-preview-result">
						<div className="jp-search-feature-selector__embedded-preview-result-content">
							<div className="jp-search-feature-selector__embedded-preview-result-title">
								Building a search <mark>block</mark>
							</div>
							<div className="jp-search-feature-selector__embedded-preview-result-meta">
								2026 › 04 › 20
							</div>
						</div>
						<span className="jp-search-feature-selector__embedded-preview-result-thumb" />
					</div>
					<div className="jp-search-feature-selector__embedded-preview-result">
						<div className="jp-search-feature-selector__embedded-preview-result-content">
							<div className="jp-search-feature-selector__embedded-preview-result-title">
								Jetpack Search 3.0 is coming
							</div>
							<div className="jp-search-feature-selector__embedded-preview-result-meta">
								2026 › 04 › 21
							</div>
						</div>
						<span className="jp-search-feature-selector__embedded-preview-result-thumb" />
					</div>
				</div>
				<div className="jp-search-feature-selector__embedded-preview-filters">
					<FilterGroup title="Category" items={ [ 'Development', 'News', 'Tutorials' ] } />
					<FilterGroup title="Tag" items={ [ 'wordpress', 'blocks', 'css' ] } />
					<FilterGroup title="Post type" items={ [ 'Post' ] } />
				</div>
			</div>
		</div>
	);
}

const FilterGroup = ( { title, items } ) => (
	<div className="jp-search-feature-selector__embedded-preview-filter-group">
		<div className="jp-search-feature-selector__embedded-preview-filter-title">{ title }</div>
		<ul className="jp-search-feature-selector__embedded-preview-filter-list">
			{ items.map( ( item, index ) => (
				<li key={ item } className={ index === 0 ? 'is-checked' : undefined }>
					<span className="jp-search-feature-selector__embedded-preview-checkbox" />
					{ item }
				</li>
			) ) }
		</ul>
	</div>
);
