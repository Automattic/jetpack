import {
	InspectorControls,
	BlockControls,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { compose, withInstanceId } from '@wordpress/compose';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ALLOWED_INNER_BLOCKS } from '../util/constants';
import { withSharedFieldAttributes } from '../util/with-shared-field-attributes';
import ToolbarRequiredGroup from './block-controls/toolbar-required-group';
import JetpackFieldWidth from './jetpack-field-width';
import JetpackManageResponsesSettings from './jetpack-manage-responses-settings';
import { useJetpackFieldStyles } from './use-jetpack-field-styles';

function JetpackFieldCheckbox( props ) {
	const {
		instanceId,
		required,
		requiredText,
		label,
		setAttributes,
		width,
		defaultValue,
		attributes,
	} = props;

	const { blockStyle } = useJetpackFieldStyles( attributes );
	// TODO: Clean up vertial alignment inline style.
	const blockProps = useBlockProps( {
		id: `jetpack-field-checkbox-${ instanceId }`,
		className: 'jetpack-field jetpack-field-checkbox',
		style: {
			...blockStyle,
			alignItems: 'center',
		},
	} );

	const labelBlockType = getBlockType( 'jetpack/field-label' );
	const defaultLabel = labelBlockType.attributes.label.default;
	const template = useMemo( () => {
		return [
			[ 'jetpack/field-input', { defaultValue, inline: true, type: 'checkbox' } ],
			[ 'jetpack/field-label', { defaultLabel, inline: true, label, required, requiredText } ],
		];
	}, [ label, defaultLabel, defaultValue, required, requiredText ] );

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
			<BlockControls>
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

export default compose(
	withSharedFieldAttributes( [
		'borderRadius',
		'borderWidth',
		'labelFontSize',
		'fieldFontSize',
		'lineHeight',
		'labelLineHeight',
		'inputColor',
		'labelColor',
		'fieldBackgroundColor',
		'borderColor',
	] ),
	withInstanceId
)( JetpackFieldCheckbox );
