import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import simpleInput from '../../../shared/simple-input';
import save from './save';

const PhoneEdit = props => {
	const blockProps = useBlockProps();
	const { setAttributes } = props;

	return simpleInput(
		'phone',
		props,
		__( 'Phone number', 'jetpack' ),
		save,
		nextValue => setAttributes( { phone: nextValue } ),
		blockProps
	);
};

export default PhoneEdit;
