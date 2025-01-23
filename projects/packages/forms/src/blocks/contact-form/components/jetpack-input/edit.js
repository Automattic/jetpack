import { useBlockProps } from '@wordpress/block-editor';
import useSyncStyleAttributes from '../../util/use-sync-style-attributes.js';

const SYNCED_ATTRIBUTES = [
	'backgroundColor',
	'borderColor',
	'fontFamily',
	'fontSize',
	'style',
	'textColor',
];

const JetpackInputEdit = ( { attributes, clientId, name, setAttributes } ) => {
	useSyncStyleAttributes( clientId, name, 'jetpack/contact-form', SYNCED_ATTRIBUTES );
	const blockProps = useBlockProps( { className: 'jetpack-field__input' } );

	return (
		<input
			{ ...blockProps }
			style={ blockProps?.style }
			onChange={ e => setAttributes( { placeholder: e.target.value } ) }
			type="text"
			value={ attributes.placeholder }
		/>
	);
};

export default JetpackInputEdit;
