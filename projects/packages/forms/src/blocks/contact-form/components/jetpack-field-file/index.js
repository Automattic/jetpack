import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { __experimentalNumberControl as NumberControl } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { useFormWrapper } from '../../util/form';
import { withSharedFieldAttributes } from '../../util/with-shared-field-attributes';
import JetpackFieldControls from '../jetpack-field-controls';
import { useJetpackFieldStyles } from '../use-jetpack-field-styles';
import './editor.css';

const JetpackFieldFile = props => {
	const { attributes, clientId, isSelected, setAttributes } = props;
	const { id, required, width } = attributes;

	useFormWrapper( { attributes, clientId, name } );
	const { blockStyle } = useJetpackFieldStyles( attributes );

	const blockProps = useBlockProps( {
		className: `jetpack-field${ isSelected ? ' is-selected' : '' }`,
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
				width={ width }
				setAttributes={ setAttributes }
				attributes={ attributes }
				hidePlaceholder={ true }
			/>
		</>
	);
};

export default compose(
	withSharedFieldAttributes( [ 'labelFontSize', 'labelLineHeight', 'labelColor' ] )
)( JetpackFieldFile );
