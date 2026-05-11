import { Icon, search } from '@wordpress/icons';
import './overlay-preview.scss';

/**
 * Static visual preview rendered in the Overlay panel: a stylised page with
 * the search overlay popup sitting on top of it. Decorative — `aria-hidden`
 * so AT users get the description above instead of an element-by-element
 * read. Strings are hardcoded; this is a mockup, not real content.
 *
 * @return {import('react').Element} - The preview illustration.
 */
export default function OverlayPreview() {
	return (
		<div className="jp-search-feature-selector__overlay-preview" aria-hidden="true">
			<div className="jp-search-feature-selector__overlay-preview-page">
				<div className="jp-search-feature-selector__overlay-preview-page-bar" />
				<div className="jp-search-feature-selector__overlay-preview-page-bar is-short" />
				<div className="jp-search-feature-selector__overlay-preview-popup">
					<div className="jp-search-feature-selector__overlay-preview-search">
						<Icon
							className="jp-search-feature-selector__overlay-preview-search-icon"
							icon={ search }
							size={ 16 }
						/>
						pasta
					</div>
					<div className="jp-search-feature-selector__overlay-preview-result">
						<span className="jp-search-feature-selector__overlay-preview-thumb" />
						<div>
							<div className="jp-search-feature-selector__overlay-preview-result-title">
								10 Easy Pasta Recipes
							</div>
							<div className="jp-search-feature-selector__overlay-preview-result-meta">Recipes</div>
						</div>
					</div>
					<div className="jp-search-feature-selector__overlay-preview-result">
						<span className="jp-search-feature-selector__overlay-preview-thumb" />
						<div>
							<div className="jp-search-feature-selector__overlay-preview-result-title">
								Best Pasta Sauces
							</div>
							<div className="jp-search-feature-selector__overlay-preview-result-meta">Reviews</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
