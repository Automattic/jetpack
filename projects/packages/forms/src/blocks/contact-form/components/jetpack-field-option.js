import { RichText } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useParentAttributes } from '../util/use-parent-attributes';
import { useJetpackFieldStyles } from './use-jetpack-field-styles';

export const JetpackFieldOptionEdit = props => {
	const { attributes, clientId, onReplace, setAttributes } = props;
	const { removeBlock } = useDispatch( 'core/block-editor' );
	const parentAttributes = useParentAttributes( clientId );
	const { optionStyle } = useJetpackFieldStyles( parentAttributes );

	const handleSplit = label =>
		createBlock( 'jetpack/field-option', {
			...attributes,
			clientId: label && attributes.label.indexOf( label ) === 0 ? attributes.clientId : undefined,
			label,
		} );

	const handleDelete = () => {
		// if ( answersCount <= 2 ) {
		// 	return;
		// }

		removeBlock( clientId );
	};

	return (
		<div className="jetpack-field-option">
			<input type={ attributes.fieldType } className="jetpack-option__type" />
			<RichText
				allowedFormats={ [ 'core/bold', 'core/italic' ] }
				onChange={ value => {
					setAttributes( { label: value } );
				} }
				onRemove={ handleDelete }
				onSplit={ handleSplit }
				onReplace={ onReplace }
				placeholder={ __( 'Add an option', 'jetpack-forms' ) }
				preserveWhiteSpace={ false }
				withoutInteractiveFormatting
				value={ attributes.label }
				style={ optionStyle }
			/>
		</div>
	);
};
