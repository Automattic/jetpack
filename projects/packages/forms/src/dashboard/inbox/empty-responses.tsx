import { __ } from '@wordpress/i18n';

type EmptyResponsesProps = {
	status: string;
	isSearch: boolean;
};

const EmptyResponses = ( { status, isSearch }: EmptyResponsesProps ) => {
	if ( isSearch ) {
		return <h4>{ __( 'No responses found', 'jetpack-forms' ) }</h4>;
	}

	if ( status === 'trash' ) {
		return __( 'Trash is empty', 'jetpack-forms' );
	}

	if ( status === 'spam' ) {
		return __( 'Spam responses are automatically trashed after 15 days.', 'jetpack-forms' );
	}

	return __( 'No responses', 'jetpack-forms' );
};

export default EmptyResponses;
