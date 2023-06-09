import { InnerBlocks } from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import EditBusiness from './components/edit-business';
import './editor.scss';
import { innerButtonBlock } from './';

function TockEdit( { className, attributes, setAttributes } ) {
	const { tockName: existingName } = attributes;
	const [ tockName, setTockName ] = useState( existingName || '' );
	const [ isEditing, setIsEditing ] = useState( false );

	const TockToolbarControls = () => {
		return (
			<ToolbarGroup>
				<ToolbarButton
					className="components-toolbar__control"
					label={ __( 'Edit Business name', 'jetpack' ) }
					icon="edit"
					onClick={ () => setIsEditing( true ) }
				/>
			</ToolbarGroup>
		);
	};

	// If the attribute isn't set yet or if the site owner wants to modify it, render a placeholder to set it.
	if ( ! existingName || isEditing ) {
		return (
			<EditBusiness
				className={ className }
				tockName={ tockName }
				setTockName={ setTockName }
				setIsEditing={ setIsEditing }
				setAttributes={ setAttributes }
			/>
		);
	}

	return (
		<div className={ className }>
			<TockToolbarControls />
			<InnerBlocks
				template={ [ [ innerButtonBlock.name, innerButtonBlock.attributes ] ] }
				templateLock="all"
			/>
		</div>
	);
}

export default TockEdit;
