/**
 * Editor preview for jetpack-search/active-filters.
 *
 * The live block is hidden until the user selects at least one filter value;
 * render a sample pill so designers can style the block in place.
 */
import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Edit component for the active-filters block.
 *
 * @return {object} Rendered element.
 */
export default function ActiveFiltersEdit() {
	const blockProps = useBlockProps();
	return (
		<div { ...blockProps }>
			<span className="jetpack-search-active-filters__heading">
				{ __( 'Active filters:', 'jetpack-search-pkg' ) }
			</span>
			<ul className="jetpack-search-active-filters__pills">
				<li>
					<button
						type="button"
						className="wp-element-button jetpack-search-active-filters__pill"
						disabled
					>
						<span className="jetpack-search-active-filters__pill-label">
							{ __( 'Example filter', 'jetpack-search-pkg' ) }
						</span>
						<span className="jetpack-search-active-filters__pill-remove" aria-hidden="true">
							×
						</span>
					</button>
				</li>
			</ul>
		</div>
	);
}
