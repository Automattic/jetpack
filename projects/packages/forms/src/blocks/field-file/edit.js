import { getJetpackExtensionAvailability } from '@automattic/jetpack-shared-extension-utils';
import {
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import JetpackFieldControls from '../shared/components/jetpack-field-controls';
import { UpsellNudge } from '../shared/components/upsell-nudge';
import useFormWrapper from '../shared/hooks/use-form-wrapper';
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles';
import useParentFormClientId from '../shared/hooks/use-parent-form-client-id';
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
		allowedBlocks: [], // leave this empty to prevent adding new blocks inside and dplicateing them.
		renderAppender: false,
	} );

	const formClientId = useParentFormClientId( clientId );

	const selectedBlockClientId = useSelect( select => {
		const { getSelectedBlockClientId } = select( blockEditorStore );
		return getSelectedBlockClientId();
	} );

	const selectedFormClientId = useParentFormClientId( selectedBlockClientId );

	const requiresCustomUpgradeNudge = useMemo( () => {
		return (
			( ! fieldFileAvailability || ! fieldFileAvailability.available ) &&
			fieldFileAvailability?.unavailableReason?.includes( 'nudge_disabled' )
		);
	}, [ fieldFileAvailability ] );

	const childern = innerBlocksProps.children;
	delete innerBlocksProps.children;

	return (
		<>
			<div { ...innerBlocksProps }>
				{ requiresCustomUpgradeNudge &&
					( selectedFormClientId === formClientId || formClientId === selectedBlockClientId ) && (
						<UpsellNudge requiredPlan={ fieldFileAvailability?.details?.required_plan } />
					) }
				{ childern }
			</div>

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
