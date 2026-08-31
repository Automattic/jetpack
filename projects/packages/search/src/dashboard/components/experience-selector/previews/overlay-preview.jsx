import { Icon, search } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';
import TextRowPlaceHolder from '../../mocked-search/placeholder';
import './overlay-preview.scss';

/**
 * Decorative Overlay mockup — `aria-hidden`. Text content is rendered with
 * the dashboard's existing `TextRowPlaceHolder` so the layout reads as a
 * skeleton, matching the Overview mocked-search interface.
 *
 * @return {import('react').Element} - The preview.
 */
export default function OverlayPreview() {
	return (
		<Stack className="jp-search-overlay-preview" aria-hidden="true">
			<div className="jp-search-overlay-preview__page">
				<div className="jp-search-overlay-preview__page-bar" />
				<div className="jp-search-overlay-preview__page-bar is-short" />
				<div className="jp-search-overlay-preview__popup">
					<Stack
						direction="row"
						gap="sm"
						align="center"
						className="jp-search-overlay-preview__search"
					>
						<Icon className="jp-search-overlay-preview__search-icon" icon={ search } size={ 16 } />
						<TextRowPlaceHolder style={ { height: '8px', width: '60px' } } />
					</Stack>
					<Result />
					<Result />
				</div>
			</div>
		</Stack>
	);
}

const Result = () => (
	<Stack direction="row" gap="sm" align="center" className="jp-search-overlay-preview__result">
		<span className="jp-search-overlay-preview__thumb" />
		<div className="jp-search-overlay-preview__result-content">
			<TextRowPlaceHolder style={ { height: '8px', width: '80%' } } />
			<TextRowPlaceHolder style={ { height: '6px', width: '40%', marginTop: '4px' } } />
		</div>
	</Stack>
);
