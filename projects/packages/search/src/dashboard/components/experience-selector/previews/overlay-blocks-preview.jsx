import { Icon, search } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';
import TextRowPlaceHolder from '../../mocked-search/placeholder';
import './overlay-blocks-preview.scss';

/**
 * Decorative blocks-powered Overlay mockup — `aria-hidden`. Differs from
 * the legacy OverlayPreview by adding a filter column inside the modal
 * card, communicating that the new overlay renders the same Search
 * blocks template (results + filters + sort) the Embedded experience
 * uses, just inside a modal.
 *
 * @return {import('react').Element} - The preview.
 */
export default function OverlayBlocksPreview() {
	return (
		<Stack className="jp-search-overlay-blocks-preview" aria-hidden="true">
			<div className="jp-search-overlay-blocks-preview__page">
				<div className="jp-search-overlay-blocks-preview__page-bar" />
				<div className="jp-search-overlay-blocks-preview__page-bar is-short" />
				<div className="jp-search-overlay-blocks-preview__popup">
					<Stack
						direction="row"
						gap="sm"
						align="center"
						className="jp-search-overlay-blocks-preview__search"
					>
						<Icon
							className="jp-search-overlay-blocks-preview__search-icon"
							icon={ search }
							size={ 16 }
						/>
						<TextRowPlaceHolder style={ { height: '8px', width: '60px' } } />
					</Stack>
					<Stack direction="row" gap="sm" className="jp-search-overlay-blocks-preview__body">
						<Stack
							direction="column"
							gap="xs"
							className="jp-search-overlay-blocks-preview__results"
						>
							<Result />
							<Result />
						</Stack>
						<Stack
							direction="column"
							gap="xs"
							className="jp-search-overlay-blocks-preview__filters"
						>
							<FilterGroup itemCount={ 2 } />
						</Stack>
					</Stack>
				</div>
			</div>
		</Stack>
	);
}

const Result = () => (
	<Stack
		direction="row"
		gap="sm"
		align="center"
		className="jp-search-overlay-blocks-preview__result"
	>
		<span className="jp-search-overlay-blocks-preview__thumb" />
		<div className="jp-search-overlay-blocks-preview__result-content">
			<TextRowPlaceHolder style={ { height: '8px', width: '80%' } } />
			<TextRowPlaceHolder style={ { height: '6px', width: '40%', marginTop: '4px' } } />
		</div>
	</Stack>
);

const FilterGroup = ( { itemCount } ) => (
	<Stack direction="column" gap="xs" className="jp-search-overlay-blocks-preview__filter-group">
		<TextRowPlaceHolder style={ { height: '6px', width: '60%' } } />
		<ul className="jp-search-overlay-blocks-preview__filter-list">
			{ Array.from( { length: itemCount } ).map( ( _, index ) => (
				<li key={ index } className={ index === 0 ? 'is-checked' : undefined }>
					<span className="jp-search-overlay-blocks-preview__checkbox" />
					<TextRowPlaceHolder style={ { height: '6px', width: '70%' } } />
				</li>
			) ) }
		</ul>
	</Stack>
);
