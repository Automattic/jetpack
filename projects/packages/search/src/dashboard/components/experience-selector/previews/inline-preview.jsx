import { Icon, search } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';
import './inline-preview.scss';

/**
 * Decorative Theme-search mockup — `aria-hidden`, strings intentionally not translated.
 *
 * @return {import('react').Element} - The preview.
 */
export default function InlinePreview() {
	return (
		<Stack direction="column" gap="sm" className="jp-search-inline-preview" aria-hidden="true">
			<Stack direction="row" gap="sm" align="center" className="jp-search-inline-preview__search">
				<Icon className="jp-search-inline-preview__search-icon" icon={ search } size={ 16 } />
				pasta
			</Stack>
			<Stack direction="column" gap="xs" className="jp-search-inline-preview__lines">
				<span className="jp-search-inline-preview__line" />
				<span className="jp-search-inline-preview__line is-short" />
				<span className="jp-search-inline-preview__line" />
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
				24 ms
			</Stack>
		</Stack>
	);
}
