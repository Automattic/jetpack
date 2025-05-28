import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { __experimentalNumberControl as NumberControl } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { __ } from '@wordpress/i18n';
import JetpackFieldControls from '../shared/components/jetpack-field-controls';
import useFormWrapper from '../shared/hooks/use-form-wrapper';
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles';
import './editor.scss';

export default function FileFieldEdit( props ) {
	const { attributes, clientId, isSelected, setAttributes, name } = props;
	const { id, required, width } = attributes;

	useFormWrapper( { attributes, clientId, name } );
	const { blockStyle } = useJetpackFieldStyles( attributes );
	let className = 'jetpack-field';
	if ( isSelected ) {
		className += ' is-selected';
	}

	if ( width ) {
		className += ` jetpack-field__width-${ width }`;
	}

	const blockProps = useBlockProps( {
		className,
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
		templateLock: false,
		allowedBlocks: [ 'jetpack/dropzone', 'jetpack/label' ],
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
