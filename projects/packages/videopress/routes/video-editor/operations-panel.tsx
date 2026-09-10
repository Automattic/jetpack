/**
 * Tools rail for the editor screen, ported from the Studio editor redesign:
 * a 224px "Edit" section of icon + label items, the active one filled with
 * the accent color. Chapters is the only extracted tool today, so the rail
 * renders a single, always-active entry with no selection state — the list
 * shape is deliberate so further tools (e.g. Trim & cut) slot in as more
 * items without a layout change.
 */
import { __ } from '@wordpress/i18n';
import { Icon, listView } from '@wordpress/icons';
import type { ReactElement } from 'react';

/**
 * The editor's tools rail.
 *
 * @return The rail element.
 */
export default function EditorOperationsPanel(): ReactElement {
	return (
		<div className="vp-video-editor__operations">
			<h5 className="vp-video-editor__operations-heading">
				{ __( 'Edit', 'jetpack-videopress-pkg' ) }
			</h5>
			<ul
				className="vp-video-editor__operations-list"
				aria-label={ __( 'Editing tools', 'jetpack-videopress-pkg' ) }
			>
				<li>
					<button
						type="button"
						className="vp-video-editor__operation vp-video-editor__operation--active"
						// The label span is visually hidden when the rail collapses to
						// icons on narrow viewports; the aria-label keeps the
						// accessible name constant across both presentations.
						aria-label={ __( 'Chapters', 'jetpack-videopress-pkg' ) }
						aria-current="true"
						data-testid="video-editor-tool-chapters"
					>
						<Icon icon={ listView } size={ 24 } />
						<span className="vp-video-editor__operation-label">
							{ __( 'Chapters', 'jetpack-videopress-pkg' ) }
						</span>
					</button>
				</li>
			</ul>
		</div>
	);
}
