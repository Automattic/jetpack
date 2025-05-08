import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import {
	ToolbarGroup,
	DropdownMenu,
	ToolbarButton,
	SVG,
	Path,
	MenuGroup,
	MenuItem,
	ToolbarItem,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { next, previous } from '@wordpress/icons';

// Define a constant for the "All Steps" option value
const ALL_STEPS_VALUE = '__all__';

// Transition options
const TRANSITION_OPTIONS = [
	{
		label: __( 'None', 'jetpack-forms' ),
		value: 'none',
	},
	{
		label: __( 'Fade', 'jetpack-forms' ),
		value: 'fade',
	},
	{
		label: __( 'Slide', 'jetpack-forms' ),
		value: 'slide',
	},
	{
		label: __( 'Fade & Slide', 'jetpack-forms' ),
		value: 'fade-slide',
	},
];

// Transition speed options
const TRANSITION_SPEED_OPTIONS = [
	{
		label: __( 'Fast (0.2s)', 'jetpack-forms' ),
		value: '0.2s',
	},
	{
		label: __( 'Normal (0.35s)', 'jetpack-forms' ),
		value: '0.35s',
	},
	{
		label: __( 'Slow (0.5s)', 'jetpack-forms' ),
		value: '0.5s',
	},
	{
		label: __( 'Very Slow (1s)', 'jetpack-forms' ),
		value: '1s',
	},
];

/**
 * Toolbar controls for managing steps within a multi-step form.
 *
 * @param {object}   props                      - Component props.
 * @param {string}   props.clientId             - Client ID of the parent contact form block.
 * @param {string}   props.selectedStepClientId - The client ID of the currently selected step (or ALL_STEPS_VALUE).
 * @param {Function} props.setParentAttributes  - Function to set attributes on the parent block.
 * @param {string}   props.stepTransition       - The current transition style for step animations (none, fade, slide, or fade-slide).
 * @param {string}   props.stepTransitionSpeed  - The speed of transition animations (e.g., '0.35s', '0.5s', '1s').
 * @return {JSX.Element} The rendered BlockControls component.
 */
const StepControls = ( {
	clientId,
	selectedStepClientId,
	setParentAttributes,
	stepTransition,
	stepTransitionSpeed,
} ) => {
	const { selectBlock, insertBlock } = useDispatch( blockEditorStore );
	const { getBlockOrder } = useSelect( select => select( blockEditorStore ), [] );

	// Transition style handler
	const handleTransitionChange = useCallback(
		transitionValue => {
			setParentAttributes( { stepTransition: transitionValue } );
		},
		[ setParentAttributes ]
	);

	// Transition speed handler
	const handleTransitionSpeedChange = useCallback(
		speedValue => {
			setParentAttributes( { stepTransitionSpeed: speedValue } );
		},
		[ setParentAttributes ]
	);

	return (
		<ToolbarGroup>
			{ /* Transition style dropdown */ }
			<ToolbarItem>
				{ () => (
					<DropdownMenu
						label={ __( 'Transition Style', 'jetpack-forms' ) }
						icon={
							<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
								<Path d="M8.5 3.5A1.5 1.5 0 0110 2h4a1.5 1.5 0 011.5 1.5v1A1.5 1.5 0 0114 6h-4a1.5 1.5 0 01-1.5-1.5v-1zm10 9a1.5 1.5 0 011.5-1.5h1a1.5 1.5 0 011.5 1.5v4a1.5 1.5 0 01-1.5 1.5h-1a1.5 1.5 0 01-1.5-1.5v-4zM3.5 12.5a1.5 1.5 0 00-1.5 1.5v4a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-4a1.5 1.5 0 00-1.5-1.5h-1zM11.5 9l-3 3 3 3 3-3-3-3z" />
							</SVG>
						}
					>
						{ ( { onClose } ) => (
							<MenuGroup>
								{ TRANSITION_OPTIONS.map( ( { label, value } ) => (
									<MenuItem
										key={ value }
										onClick={ () => {
											handleTransitionChange( value );
											onClose();
										} }
										isSelected={ stepTransition === value }
									>
										{ label }
									</MenuItem>
								) ) }
							</MenuGroup>
						) }
					</DropdownMenu>
				) }
			</ToolbarItem>

			{ /* Transition speed dropdown */ }
			<ToolbarItem>
				{ () => (
					<DropdownMenu
						label={ __( 'Transition Speed', 'jetpack-forms' ) }
						icon={
							<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
								<Path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.88-11.71L10 11.44 9.95 16h1.89l.03-3.19 4.14-2.82-1.13-1.7z" />
							</SVG>
						}
					>
						{ ( { onClose } ) => (
							<MenuGroup>
								{ TRANSITION_SPEED_OPTIONS.map( ( { label, value } ) => (
									<MenuItem
										key={ value }
										onClick={ () => {
											handleTransitionSpeedChange( value );
											onClose();
										} }
										isSelected={ stepTransitionSpeed === value }
									>
										{ label }
									</MenuItem>
								) ) }
							</MenuGroup>
						) }
					</DropdownMenu>
				) }
			</ToolbarItem>

			{ /* Step navigation controls*/ }
			<ToolbarItem>
				{ () => (
					<DropdownMenu
						label={ __( 'Select Step', 'jetpack-forms' ) }
						icon={
							<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
								<Path d="M6.5 14.5L12 9l5.5 5.5" />
							</SVG>
						}
					>
						{ ( { onClose } ) => (
							<MenuGroup>
								<MenuItem
									onClick={ () => {
										setParentAttributes( { selectedStepClientId: ALL_STEPS_VALUE } );
										onClose();
									} }
									isSelected={ selectedStepClientId === ALL_STEPS_VALUE }
								>
									{ __( 'All Steps', 'jetpack-forms' ) }
								</MenuItem>
								<MenuGroup>
									{ getBlockOrder( clientId ).map( stepClientId => (
										<MenuItem
											key={ stepClientId }
											onClick={ () => {
												setParentAttributes( { selectedStepClientId: stepClientId } );
												selectBlock( stepClientId );
												onClose();
											} }
											isSelected={ selectedStepClientId === stepClientId }
										>
											{ __( 'Step', 'jetpack-forms' ) }
										</MenuItem>
									) ) }
								</MenuGroup>
							</MenuGroup>
						) }
					</DropdownMenu>
				) }
			</ToolbarItem>

			<ToolbarButton
				icon={ previous }
				label={ __( 'Add step before', 'jetpack-forms' ) }
				onClick={ () => {
					const stepClientIds = getBlockOrder( clientId );
					const blockIndex = stepClientIds.indexOf( selectedStepClientId );
					const block = createBlock( 'jetpack/step' );
					insertBlock( block, blockIndex, clientId );
				} }
				disabled={ selectedStepClientId === ALL_STEPS_VALUE }
			/>
			<ToolbarButton
				icon={ next }
				label={ __( 'Add step after', 'jetpack-forms' ) }
				onClick={ () => {
					const stepClientIds = getBlockOrder( clientId );
					const blockIndex = stepClientIds.indexOf( selectedStepClientId );
					const block = createBlock( 'jetpack/step' );
					insertBlock( block, blockIndex + 1, clientId );
				} }
				disabled={ selectedStepClientId === ALL_STEPS_VALUE }
			/>
		</ToolbarGroup>
	);
};

export default StepControls;
