import { __experimentalText as Text } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { __ } from '@wordpress/i18n';
import CreateFormButton from '../components/create-form-button';

const EmptyResponses = () => {
	return (
		<>
			<Text>{ __( 'No responses yet.', 'jetpack-forms' ) }</Text>
			<CreateFormButton showPatterns label={ __( 'Create a form', 'jetpack-forms' ) } />;
		</>
	);
};

export default EmptyResponses;
