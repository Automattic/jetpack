import {
	InspectorControls,
	BlockControls,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import ToolbarRequiredGroup from '../contact-form/components/block-controls/toolbar-required-group';
import JetpackFieldWidth from '../contact-form/components/jetpack-field-width';
import JetpackManageResponsesSettings from '../contact-form/components/jetpack-manage-responses-settings';
import useFormWrapper from '../shared/hooks/use-form-wrapper';
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles';
import { ALLOWED_INNER_BLOCKS } from '../shared/util/constants';

export default function CheckboxFieldEdit( props ) {
	const { setAttributes, attributes } = props;
	const { defaultValue, required, width } = attributes;

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

	return (
		<>
			<div { ...innerBlocksProps } />
			<BlockControls __experimentalShareWithChildBlocks>
				<ToolbarRequiredGroup required={ required } onClick={ onRequiredToggle } />
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Checkbox Settings', 'jetpack-forms' ) }>
					<ToggleControl
						label={ __( 'Checked by default', 'jetpack-forms' ) }
						checked={ !! defaultValue }
						onChange={ onDefaultValueChange }
						__nextHasNoMarginBottom={ true }
					/>
				</PanelBody>
			</InspectorControls>
			<InspectorControls>
				<PanelBody title={ __( 'Manage Responses', 'jetpack-forms' ) }>
					<JetpackManageResponsesSettings isChildBlock />
				</PanelBody>
				<PanelBody title={ __( 'Field Settings', 'jetpack-forms' ) }>
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
