import { __experimentalText as Text, __experimentalVStack as VStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { __ } from '@wordpress/i18n';
import CreateFormButton from '../components/create-form-button';

type EmptyResponsesProps = {
	status: string;
	isSearch: boolean;
};

const EmptyResponses = ( { status, isSearch }: EmptyResponsesProps ) => {
	if ( isSearch ) {
		return <h4>{ __( 'No responses found', 'jetpack-forms' ) }</h4>;
	}

	if ( status === 'trash' ) {
		return (
			<VStack justify="space-around" alignment="center">
				<h4>{ __( 'Trash is empty', 'jetpack-forms' ) }</h4>
				<Text variant="muted">
					{ __( 'Spam responses are automatically trashed after 15 days.', 'jetpack-forms' ) }
				</Text>
			</VStack>
		);
	}

	if ( status === 'spam' ) {
		return (
			<VStack justify="space-around" alignment="center">
				<h4>{ __( 'No spam', 'jetpack-forms' ) }</h4>
				<Text variant="muted">
					{ __( 'Spam responses are automatically trashed after 15 days.', 'jetpack-forms' ) }
				</Text>
			</VStack>
		);
	}

	return (
		<VStack justify="space-around" alignment="center">
			<h4>{ __( 'No responses', 'jetpack-forms' ) }</h4>
			<CreateFormButton showPatterns label={ __( 'Create form', 'jetpack-forms' ) } />
		</VStack>
	);
};

export default EmptyResponses;
