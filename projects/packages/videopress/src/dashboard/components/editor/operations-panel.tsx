/**
 * Tools rail for the Studio editor screen, per the editor redesign: a 224px
 * "Edit" section of icon + label items, the active one filled with the
 * accent color. Selection is owned by the editor screen; the rail is
 * controlled. The list shape is deliberate so further tools slot in as more
 * items without a layout change.
 */
import { __ } from '@wordpress/i18n';
import { Icon, crop, listView } from '@wordpress/icons';
import type { StudioTool } from './state/tools';
import type { ReactElement } from 'react';

type Props = {
	activeTool: StudioTool;
	onSelect: ( tool: StudioTool ) => void;
};

type RailItem = {
	id: StudioTool;
	label: string;
	icon: JSX.Element;
};

/**
 * The Studio editor's tools rail.
 *
 * @param props            - Component props.
 * @param props.activeTool - The currently selected tool.
 * @param props.onSelect   - Called with the tool id when an item is activated.
 * @return The rail element.
 */
export default function StudioEditorOperationsPanel( {
	activeTool,
	onSelect,
}: Props ): ReactElement {
	const tools: RailItem[] = [
		{
			id: 'trim-cut',
			label: __( 'Trim & cut', 'jetpack-videopress-pkg' ),
			icon: <Icon icon={ crop } size={ 24 } />,
		},
		{
			id: 'chapters',
			label: __( 'Chapters', 'jetpack-videopress-pkg' ),
			icon: <Icon icon={ listView } size={ 24 } />,
		},
	];

	return (
		<div className="vp-studio-editor__operations">
			<h5 className="vp-studio-editor__operations-heading">
				{ __( 'Edit', 'jetpack-videopress-pkg' ) }
			</h5>
			<ul
				className="vp-studio-editor__operations-list"
				aria-label={ __( 'Editing tools', 'jetpack-videopress-pkg' ) }
			>
				{ tools.map( tool => {
					const isActive = tool.id === activeTool;
					return (
						<li key={ tool.id }>
							<button
								type="button"
								className={
									'vp-studio-editor__operation' +
									( isActive ? ' vp-studio-editor__operation--active' : '' )
								}
								aria-current={ isActive ? 'true' : undefined }
								data-testid={ `studio-editor-tool-${ tool.id }` }
								onClick={ () => onSelect( tool.id ) }
							>
								{ tool.icon }
								{ tool.label }
							</button>
						</li>
					);
				} ) }
			</ul>
		</div>
	);
}
