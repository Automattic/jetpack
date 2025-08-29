import { __ } from '@wordpress/i18n';

const EmptyResponses = () => {
	return (
		<p>
			<em>{ __( 'No responses.', 'jetpack-forms' ) }</em>
		</p>
	);
};

export default EmptyResponses;
