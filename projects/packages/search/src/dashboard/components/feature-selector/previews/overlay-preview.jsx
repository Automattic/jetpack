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
		<Stack className="jp-search-feature-selector__overlay-preview" aria-hidden="true">
			<div className="jp-search-feature-selector__overlay-preview-page">
				<div className="jp-search-feature-selector__overlay-preview-page-bar" />
				<div className="jp-search-feature-selector__overlay-preview-page-bar is-short" />
				<div className="jp-search-feature-selector__overlay-preview-popup">
					<Stack
						direction="row"
						gap="sm"
						align="center"
						className="jp-search-feature-selector__overlay-preview-search"
					>
						<Icon
							className="jp-search-feature-selector__overlay-preview-search-icon"
							icon={ search }
							size={ 16 }
						/>
						pasta
					</Stack>
					<Stack
						direction="row"
						gap="sm"
						align="center"
						className="jp-search-feature-selector__overlay-preview-result"
					>
						<span className="jp-search-feature-selector__overlay-preview-thumb" />
						<div>
							<div className="jp-search-feature-selector__overlay-preview-result-title">
								10 Easy Pasta Recipes
							</div>
							<div className="jp-search-feature-selector__overlay-preview-result-meta">Recipes</div>
						</div>
					</Stack>
					<Stack
						direction="row"
						gap="sm"
						align="center"
						className="jp-search-feature-selector__overlay-preview-result"
					>
						<span className="jp-search-feature-selector__overlay-preview-thumb" />
						<div>
							<div className="jp-search-feature-selector__overlay-preview-result-title">
								Best Pasta Sauces
							</div>
							<div className="jp-search-feature-selector__overlay-preview-result-meta">Reviews</div>
						</div>
					</Stack>
				</div>
			</div>
		</Stack>
	);
}
