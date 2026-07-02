/**
 * Operations rail for the Studio editor screen.
 *
 * A vertical list of editing tools. v1 ships a single "Trim & cut" entry that
 * is always selected; the list shape (rather than a lone heading) is
 * deliberate so future tools — Blur, Audio, etc. — slot in as more items
 * without a layout change.
 */
import { __ } from '@wordpress/i18n';
import type { ReactElement } from 'react';

/**
 * The Studio editor's operations rail.
 *
 * @return The rail element.
 */
export default function StudioEditorOperationsPanel(): ReactElement {
	const operations = [ { id: 'trim-cut', label: __( 'Trim & cut', 'jetpack-videopress-pkg' ) } ];
	// Single tool for now, so selection is static.
	const activeId = 'trim-cut';

	return (
		<ul
			className="vp-studio-editor__operations"
			aria-label={ __( 'Editing tools', 'jetpack-videopress-pkg' ) }
		>
			{ operations.map( operation => {
				const isActive = operation.id === activeId;
				return (
					<li key={ operation.id }>
						<button
							type="button"
							className={
								'vp-studio-editor__operation' +
								( isActive ? ' vp-studio-editor__operation--active' : '' )
							}
							aria-current={ isActive ? 'true' : undefined }
						>
							{ operation.label }
						</button>
					</li>
				);
			} ) }
		</ul>
	);
}
