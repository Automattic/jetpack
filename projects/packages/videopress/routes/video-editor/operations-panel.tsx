import { __ } from '@wordpress/i18n';
import { Icon, listView, reusableBlock } from '@wordpress/icons';
import { isChaptersEditorEnabled } from '../../src/dashboard/utils/chapters-editor';
import { isTrimCutEnabled } from '../../src/dashboard/utils/trim-cut';

export type EditorTool = 'chapters' | 'trim';

type Props = {
	activeTool?: EditorTool;
	onSelect?: ( tool: EditorTool ) => void;
};

/**
 * Select an available video editing tool.
 *
 * @param props            - Component props.
 * @param props.activeTool - Selected tool.
 * @param props.onSelect   - Select a tool.
 * @return The tools rail.
 */
export default function EditorOperationsPanel( { activeTool = 'chapters', onSelect }: Props ) {
	const tools = [
		{
			id: 'trim' as const,
			label: __( 'Trim & cut', 'jetpack-videopress-pkg' ),
			icon: reusableBlock,
			enabled: isTrimCutEnabled(),
		},
		{
			id: 'chapters' as const,
			label: __( 'Chapters', 'jetpack-videopress-pkg' ),
			icon: listView,
			enabled: isChaptersEditorEnabled(),
		},
	];
	return (
		<div className="vp-video-editor__operations">
			<h5 className="vp-video-editor__operations-heading">
				{ __( 'Edit', 'jetpack-videopress-pkg' ) }
			</h5>
			<ul
				className="vp-video-editor__operations-list"
				aria-label={ __( 'Editing tools', 'jetpack-videopress-pkg' ) }
			>
				{ tools
					.filter( tool => tool.enabled )
					.map( tool => (
						<li key={ tool.id }>
							<button
								type="button"
								className={
									'vp-video-editor__operation' +
									( activeTool === tool.id ? ' vp-video-editor__operation--active' : '' )
								}
								aria-label={ tool.label }
								aria-current={ activeTool === tool.id ? 'true' : undefined }
								data-testid={ `video-editor-tool-${ tool.id }` }
								onClick={ () => onSelect?.( tool.id ) }
							>
								<Icon icon={ tool.icon } size={ 24 } />
								<span className="vp-video-editor__operation-label">{ tool.label }</span>
							</button>
						</li>
					) ) }
			</ul>
		</div>
	);
}
