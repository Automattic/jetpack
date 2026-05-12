import { Icon, search, chevronDown } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';
import './embedded-preview.scss';

/**
 * Decorative Embedded mockup — `aria-hidden`, strings intentionally not translated.
 *
 * @return {import('react').Element} - The preview.
 */
export default function EmbeddedPreview() {
	return (
		<Stack
			direction="column"
			gap="sm"
			className="jp-search-feature-selector__embedded-preview"
			aria-hidden="true"
		>
			<Stack
				direction="row"
				gap="sm"
				align="center"
				className="jp-search-feature-selector__embedded-preview-search"
			>
				<Icon
					className="jp-search-feature-selector__embedded-preview-search-icon"
					icon={ search }
					size={ 14 }
				/>
				pasta
			</Stack>
			<Stack direction="row" gap="md" className="jp-search-feature-selector__embedded-preview-body">
				<Stack
					direction="column"
					gap="sm"
					className="jp-search-feature-selector__embedded-preview-results"
				>
					<Stack
						direction="row"
						gap="xs"
						align="center"
						justify="end"
						className="jp-search-feature-selector__embedded-preview-sort"
					>
						Sort by
						<Stack
							direction="row"
							gap="xs"
							align="center"
							className="jp-search-feature-selector__embedded-preview-sort-control"
						>
							Relevance
							<Icon icon={ chevronDown } size={ 12 } />
						</Stack>
					</Stack>
					<Stack
						direction="row"
						gap="sm"
						align="start"
						className="jp-search-feature-selector__embedded-preview-result"
					>
						<div className="jp-search-feature-selector__embedded-preview-result-content">
							<div className="jp-search-feature-selector__embedded-preview-result-title">
								10 Easy <mark>Pasta</mark> Recipes
							</div>
							<div className="jp-search-feature-selector__embedded-preview-result-meta">
								Recipes · Jan 2026
							</div>
						</div>
						<span className="jp-search-feature-selector__embedded-preview-result-thumb" />
					</Stack>
					<Stack
						direction="row"
						gap="sm"
						align="start"
						className="jp-search-feature-selector__embedded-preview-result"
					>
						<div className="jp-search-feature-selector__embedded-preview-result-content">
							<div className="jp-search-feature-selector__embedded-preview-result-title">
								Best <mark>Pasta</mark> Sauces
							</div>
							<div className="jp-search-feature-selector__embedded-preview-result-meta">
								Reviews · Mar 2026
							</div>
						</div>
						<span className="jp-search-feature-selector__embedded-preview-result-thumb" />
					</Stack>
				</Stack>
				<Stack
					direction="column"
					gap="sm"
					className="jp-search-feature-selector__embedded-preview-filters"
				>
					<FilterGroup title="Category" items={ [ 'Recipes', 'Travel' ] } />
					<FilterGroup title="Tag" items={ [ 'pasta', 'italian' ] } />
				</Stack>
			</Stack>
		</Stack>
	);
}

const FilterGroup = ( { title, items } ) => (
	<Stack
		direction="column"
		gap="xs"
		className="jp-search-feature-selector__embedded-preview-filter-group"
	>
		<div className="jp-search-feature-selector__embedded-preview-filter-title">{ title }</div>
		<ul className="jp-search-feature-selector__embedded-preview-filter-list">
			{ items.map( ( item, index ) => (
				<li key={ item } className={ index === 0 ? 'is-checked' : undefined }>
					<span className="jp-search-feature-selector__embedded-preview-checkbox" />
					{ item }
				</li>
			) ) }
		</ul>
	</Stack>
);
