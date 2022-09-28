import { BlockControls } from '@wordpress/block-editor';
import { MenuGroup, MenuItem, ToolbarButton, ToolbarDropdownMenu } from '@wordpress/components';

export default function ViewSelector( props ) {
	const { options, selectedOption, selectAction, contractViewport, label } = props;

	const optionSelected = option => option.id === selectedOption.id;

	if ( contractViewport ) {
		return (
			<BlockControls group="block">
				<ToolbarDropdownMenu label={ label } icon="arrow-down" text={ selectedOption.label }>
					{ ( { onClose } ) => (
						<MenuGroup>
							{ options.map( optionDefinition => {
								const isSelected = optionSelected( optionDefinition );
								return (
									<MenuItem
										isSelected={ isSelected }
										icon={ isSelected ? 'yes' : undefined }
										onClick={ () => {
											selectAction( optionDefinition );
											onClose();
										} }
										key={ `jetpack-premium-content-tab-${ optionDefinition.id }` }
									>
										{ optionDefinition.label }
									</MenuItem>
								);
							} ) }
						</MenuGroup>
					) }
				</ToolbarDropdownMenu>
			</BlockControls>
		);
	}

	return (
		<BlockControls group="other">
			{ options.map( optionDefinition => {
				const isSelected = optionSelected( optionDefinition );
				return (
					<ToolbarButton
						onClick={ () => {
							selectAction( optionDefinition );
						} }
						className="components-tab-button"
						isPressed={ isSelected }
						key={ `jetpack-premium-content-tab-${ optionDefinition.id }` }
					>
						<span>{ optionDefinition.label }</span>
					</ToolbarButton>
				);
			} ) }
		</BlockControls>
	);
}
