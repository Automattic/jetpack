import { getJetpackExtensionAvailability } from '@automattic/jetpack-shared-extension-utils';
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import JetpackFieldControls from '../shared/components/jetpack-field-controls';
import useFormWrapper from '../shared/hooks/use-form-wrapper';
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles';
import { UpsellNudge } from '../upsell-nudge';
import './editor.scss';

export default function FileFieldEdit( props ) {
	const { attributes, clientId, isSelected, setAttributes, name, className } = props;
	const { id, required, width } = attributes;

	const fieldFileAvailability = getJetpackExtensionAvailability( 'field-file' );

	useFormWrapper( { attributes, clientId, name } );
	const { blockStyle } = useJetpackFieldStyles( attributes );

	const classes = clsx( className, 'jetpack-field is-non-animated-label', {
		'is-selected': isSelected,
		[ `jetpack-field__width-${ width }` ]: width,
	} );

	const blockProps = useBlockProps( {
		className: classes,
		style: blockStyle,
	} );

	const uploadLabel = __( 'Upload a file', 'jetpack-forms' );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: [
			[
				'jetpack/label',
				{
					label: uploadLabel,
					defaultLabel: uploadLabel,
					lock: { move: true, remove: true },
				},
			],
			[
				'jetpack/dropzone',
				{
					lock: { move: true, remove: true },
					layout: { type: 'flex', justifyContent: 'center', orientation: 'vertical' },
				},
			],
		],
		allowedBlocks: [ 'jetpack/dropzone', 'jetpack/label' ],
		renderAppender: false,
	} );

	const isInnerBlockSelected = useSelect( select => {
		const selectedBlockClientId = select( 'core/block-editor' ).getSelectedBlockClientId();
		const blockParents = select( 'core/block-editor' ).getBlockParents( selectedBlockClientId );
		return blockParents.includes( clientId );
	} );

	const requiresCustomUpgradeNudge = useMemo( () => {
		return (
			( ! fieldFileAvailability || ! fieldFileAvailability.available ) &&
			fieldFileAvailability?.unavailableReason?.includes( 'nudge_disabled' )
		);
	}, [ fieldFileAvailability ] );

	return (
		<>
			{ requiresCustomUpgradeNudge && ( isSelected || isInnerBlockSelected ) && (
				<UpsellNudge requiredPlan={ fieldFileAvailability?.details?.required_plan } />
			) }
			<div { ...innerBlocksProps } />
			<JetpackFieldControls
				id={ id }
				required={ required }
				setAttributes={ setAttributes }
				width={ width }
				attributes={ attributes }
				hidePlaceholder={ true }
			/>
		</>
	);
}
