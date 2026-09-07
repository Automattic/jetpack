import {
	InspectorControls,
	BlockControls,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import JetpackFieldWidth from '../shared/components/jetpack-field-width.jsx';
import ToolbarRequiredGroup from '../shared/components/toolbar-required-group.jsx';
import useFormWrapper from '../shared/hooks/use-form-wrapper.js';
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles.js';
import { ALLOWED_INNER_BLOCKS } from '../shared/util/constants.js';

export default function CheckboxFieldEdit( props ) {
	const { setAttributes, attributes } = props;
	const { defaultValue, required, width, className } = attributes;

	const { __unstableMarkNextChangeAsNotPersistent } = useDispatch( blockEditorStore );

	useFormWrapper( props );

	// TODO: Is this block style needed?
	const { blockStyle } = useJetpackFieldStyles( attributes );
	const blockProps = useBlockProps( {
		className: 'jetpack-field jetpack-field-checkbox',
		style: {
			...blockStyle,
			// alignItems: 'center', // TODO: Is this needed on the frontend too?
		},
	} );

	const template = [
		[ 'jetpack/option', { isStandalone: true, placeholder: __( 'Add label…', 'jetpack-forms' ) } ],
	];
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_INNER_BLOCKS,
		template,
		templateLock: 'all',
	} );

	const onDefaultValueChange = useCallback(
		value => setAttributes( { defaultValue: value ? 'true' : '' } ),
		[ setAttributes ]
	);

	const onRequiredToggle = useCallback(
		() => setAttributes( { required: ! required } ),
		[ setAttributes, required ]
	);

	const onRequiredChange = useCallback(
		value => setAttributes( { required: value } ),
		[ setAttributes ]
	);

	const onShareFieldAttributesChange = useCallback(
		value => setAttributes( { shareFieldAttributes: value } ),
		[ setAttributes ]
	);

	const hasUpgradedToNewStyle = useRef( 1 );
	// Ensure the className is set to 'is-style-list' if it is empty or not set.
	// By updating the className on the second render, we can make sure that the block doesn't trigger a "Save" action.
	useEffect( () => {
		if ( ! className && hasUpgradedToNewStyle.current === 1 ) {
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( { className: 'is-style-list' } );
			hasUpgradedToNewStyle.current = 2;
		}
	}, [ className, setAttributes, __unstableMarkNextChangeAsNotPersistent ] ); // This effect is a placeholder for any future side effects.

	return (
		<>
			<div { ...innerBlocksProps } />
			<BlockControls __experimentalShareWithChildBlocks>
				<ToolbarRequiredGroup required={ required } onClick={ onRequiredToggle } />
			</BlockControls>
			<InspectorControls>
				<PanelBody
					title={ __( 'Checkbox settings', 'jetpack-forms' ) }
					className="jetpack-contact-form__panel"
				>
					<ToggleControl
						label={ __( 'Checked by default', 'jetpack-forms' ) }
						checked={ !! defaultValue }
						onChange={ onDefaultValueChange }
						__nextHasNoMarginBottom={ true }
					/>
				</PanelBody>
			</InspectorControls>
			<InspectorControls>
				<PanelBody
					title={ __( 'Field settings', 'jetpack-forms' ) }
					className="jetpack-contact-form__panel"
				>
					<ToggleControl
						label={ __( 'Field is required', 'jetpack-forms' ) }
						checked={ required }
						onChange={ onRequiredChange }
						help={ __( 'You can edit the "required" label in the editor', 'jetpack-forms' ) }
						__nextHasNoMarginBottom={ true }
					/>
					<JetpackFieldWidth setAttributes={ setAttributes } width={ width } />

					<ToggleControl
						label={ __( 'Sync fields style', 'jetpack-forms' ) }
						checked={ attributes.shareFieldAttributes }
						onChange={ onShareFieldAttributesChange }
						help={ __( 'Deactivate for individual styling of this block', 'jetpack-forms' ) }
						__nextHasNoMarginBottom={ true }
					/>
				</PanelBody>
			</InspectorControls>
		</>
	);
}
