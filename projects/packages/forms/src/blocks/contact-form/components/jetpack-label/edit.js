import { useBlockProps } from '@wordpress/block-editor';
import { DATE_FORMATS } from '../../util/constants.js';
import useSyncStyleAttributes from '../../util/use-sync-style-attributes.js';
import JetpackFieldLabel from '../jetpack-field-label.js';

const SYNCED_ATTRIBUTES = [ 'textColor', 'fontFamily', 'fontSize', 'style' ];

const JetpackLabelEdit = ( { attributes, clientId, name, setAttributes, context } ) => {
	useSyncStyleAttributes( clientId, name, 'jetpack/contact-form', SYNCED_ATTRIBUTES );
	const { 'jetpack/field-required': required, 'jetpack/field-dateFormat': dateFormat } = context;
	const suffix = dateFormat
		? `(${ DATE_FORMATS.find( f => f.value === dateFormat )?.label })`
		: undefined;
	const blockProps = useBlockProps();

	return (
		<JetpackFieldLabel
			blockProps={ blockProps }
			attributes={ attributes }
			label={ attributes.label }
			placeholder={ attributes.defaultLabel ?? attributes.label }
			required={ required }
			requiredText={ attributes.requiredText }
			setAttributes={ setAttributes }
			suffix={ suffix }
		/>
	);
};

export default JetpackLabelEdit;
