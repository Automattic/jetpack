import { __ } from '@wordpress/i18n';

type EmptyResponsesProps = {
	status: string;
	isSearch: boolean;
};

const EmptyResponses = ( { status, isSearch }: EmptyResponsesProps ) => {
	if ( isSearch ) {
		return __( 'No responses found', 'jetpack-forms' );
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
