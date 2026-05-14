import { Icon, search } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';
import TextRowPlaceHolder from '../../mocked-search/placeholder';
import './inline-preview.scss';

/**
 * Decorative Theme-search mockup — `aria-hidden`. Text content is rendered
 * with the dashboard's existing `TextRowPlaceHolder`; the bolt icon is the
 * only "fast" cue kept visible.
 *
 * @return {import('react').Element} - The preview.
 */
export default function InlinePreview() {
	return (
		<Stack direction="column" gap="sm" className="jp-search-inline-preview" aria-hidden="true">
			{ /* Mocks the native WordPress search form: a text input on the
			   left and a Search submit button on the right — the two are
			   the layout that the theme renders, unchanged by Jetpack. */ }
			<Stack
				direction="row"
				gap="sm"
				align="center"
				className="jp-search-inline-preview__search-row"
			>
				<Stack direction="row" gap="sm" align="center" className="jp-search-inline-preview__search">
					<Icon className="jp-search-inline-preview__search-icon" icon={ search } size={ 16 } />
					<TextRowPlaceHolder style={ { height: '8px', width: '64px' } } />
				</Stack>
				<span className="jp-search-inline-preview__submit">Search</span>
			</Stack>
			<Stack direction="column" gap="xs" className="jp-search-inline-preview__lines">
				<TextRowPlaceHolder style={ { height: '6px', width: '100%' } } />
				<TextRowPlaceHolder style={ { height: '6px', width: '70%' } } />
				<TextRowPlaceHolder style={ { height: '6px', width: '100%' } } />
			</Stack>
			<Stack direction="row" gap="xs" align="center" className="jp-search-inline-preview__timing">
				<svg
					className="jp-search-inline-preview__bolt"
					viewBox="0 0 24 24"
					width="14"
					height="14"
					aria-hidden="true"
				>
					<path fill="currentColor" d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
				</svg>
				<TextRowPlaceHolder
					style={ {
						height: '6px',
						width: '28px',
						backgroundColor: 'currentColor',
						opacity: 0.7,
					} }
				/>
			</Stack>
		</Stack>
	);
}
