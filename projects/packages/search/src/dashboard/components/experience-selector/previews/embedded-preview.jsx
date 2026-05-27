import { Icon, search, chevronDown } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';
import TextRowPlaceHolder from '../../mocked-search/placeholder';
import './embedded-preview.scss';

/**
 * Decorative Embedded mockup — `aria-hidden`. Text content is rendered with
 * the dashboard's existing `TextRowPlaceHolder` so the layout reads as a
 * skeleton, matching the Overview mocked-search interface.
 *
 * @return {import('react').Element} - The preview.
 */
export default function EmbeddedPreview() {
	return (
		<Stack direction="column" gap="sm" className="jp-search-embedded-preview" aria-hidden="true">
			<Stack direction="row" gap="sm" align="center" className="jp-search-embedded-preview__search">
				<Icon className="jp-search-embedded-preview__search-icon" icon={ search } size={ 14 } />
				<TextRowPlaceHolder style={ { height: '8px', width: '64px' } } />
			</Stack>
			<Stack direction="row" gap="md" className="jp-search-embedded-preview__body">
				<Stack direction="column" gap="sm" className="jp-search-embedded-preview__results">
					<Stack
						direction="row"
						gap="xs"
						align="center"
						justify="end"
						className="jp-search-embedded-preview__sort"
					>
						<TextRowPlaceHolder style={ { height: '6px', width: '28px' } } />
						<Stack
							direction="row"
							gap="xs"
							align="center"
							className="jp-search-embedded-preview__sort-control"
						>
							<TextRowPlaceHolder style={ { height: '6px', width: '36px' } } />
							<Icon icon={ chevronDown } size={ 12 } />
						</Stack>
					</Stack>
					<Result />
					<Result />
				</Stack>
				<Stack direction="column" gap="sm" className="jp-search-embedded-preview__filters">
					<FilterGroup itemCount={ 2 } />
					<FilterGroup itemCount={ 2 } />
				</Stack>
			</Stack>
		</Stack>
	);
}

const Result = () => (
	<Stack direction="row" gap="sm" align="start" className="jp-search-embedded-preview__result">
		<div className="jp-search-embedded-preview__result-content">
			<TextRowPlaceHolder style={ { height: '8px', width: '80%' } } />
			<TextRowPlaceHolder style={ { height: '6px', width: '50%', marginTop: '4px' } } />
		</div>
		<span className="jp-search-embedded-preview__result-thumb" />
	</Stack>
);

const FilterGroup = ( { itemCount } ) => (
	<Stack direction="column" gap="xs" className="jp-search-embedded-preview__filter-group">
		<TextRowPlaceHolder style={ { height: '6px', width: '40%' } } />
		<ul className="jp-search-embedded-preview__filter-list">
			{ Array.from( { length: itemCount } ).map( ( _, index ) => (
				<li key={ index } className={ index === 0 ? 'is-checked' : undefined }>
					<span className="jp-search-embedded-preview__checkbox" />
					<TextRowPlaceHolder style={ { height: '6px', width: '70%' } } />
				</li>
			) ) }
		</ul>
	</Stack>
);
