import './inline-preview.scss';

/**
 * Static visual preview rendered in the Theme search (inline) panel: a
 * stylised search box with a few faint result lines below it and a small
 * "24 ms" timing indicator in the corner, hinting at the speed-improvement
 * pitch of this experience. Decorative — `aria-hidden` so AT users get the
 * description above instead of an element-by-element read.
 *
 * @return {import('react').Element} - The preview illustration.
 */
export default function InlinePreview() {
	return (
		<div className="jp-search-feature-selector__inline-preview" aria-hidden="true">
			<div className="jp-search-feature-selector__inline-preview-search">
				<span className="jp-search-feature-selector__inline-preview-search-icon" />
				pasta
			</div>
			<div className="jp-search-feature-selector__inline-preview-lines">
				<span className="jp-search-feature-selector__inline-preview-line" />
				<span className="jp-search-feature-selector__inline-preview-line is-short" />
				<span className="jp-search-feature-selector__inline-preview-line" />
			</div>
			<div className="jp-search-feature-selector__inline-preview-timing">
				<svg
					className="jp-search-feature-selector__inline-preview-bolt"
					viewBox="0 0 24 24"
					width="14"
					height="14"
					aria-hidden="true"
				>
					<path fill="currentColor" d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
				</svg>
				24 ms
			</div>
		</div>
	);
}
