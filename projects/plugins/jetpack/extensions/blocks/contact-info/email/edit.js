import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import simpleInput from '../../../shared/simple-input';
import save from './save';

const EmailEdit = props => {
	const blockProps = useBlockProps();
	const { setAttributes } = props;

	return simpleInput(
		'email',
		props,
		__( 'Email', 'jetpack' ),
		save,
		nextValue => setAttributes( { email: nextValue } ),
		blockProps
	);
};

export default EmailEdit;
