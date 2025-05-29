import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import JetpackFieldControls from '../shared/components/jetpack-field-controls';
import useFormWrapper from '../shared/hooks/use-form-wrapper';
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles';
import './editor.scss';

export default function FileFieldEdit( props ) {
	const { attributes, clientId, isSelected, setAttributes, name, className } = props;
	const { id, required, width } = attributes;

	useFormWrapper( { attributes, clientId, name } );
	const { blockStyle } = useJetpackFieldStyles( attributes );

	let classes = clsx( className, 'jetpack-field is-non-animated-label', {
		'is-selected': isSelected,
	} );
	if ( width ) {
		classes += ` jetpack-field__width-${ width }`;
	}

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
				},
			],
		],
		templateLock: 'insert',
		allowedBlocks: [ 'jetpack/dropzone', 'jetpack/label' ],
		renderAppender: false,
	} );

	return (
		<>
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
