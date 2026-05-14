import { Icon, search } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';
import './overlay-preview.scss';

/**
 * Decorative Overlay mockup — `aria-hidden`, strings intentionally not translated.
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
						pasta
					</Stack>
					<Stack
						direction="row"
						gap="sm"
						align="center"
						className="jp-search-overlay-preview__result"
					>
						<span className="jp-search-overlay-preview__thumb" />
						<div>
							<div className="jp-search-overlay-preview__result-title">10 Easy Pasta Recipes</div>
							<div className="jp-search-overlay-preview__result-meta">Recipes</div>
						</div>
					</Stack>
					<Stack
						direction="row"
						gap="sm"
						align="center"
						className="jp-search-overlay-preview__result"
					>
						<span className="jp-search-overlay-preview__thumb" />
						<div>
							<div className="jp-search-overlay-preview__result-title">Best Pasta Sauces</div>
							<div className="jp-search-overlay-preview__result-meta">Reviews</div>
						</div>
					</Stack>
				</div>
			</div>
		</Stack>
	);
}
