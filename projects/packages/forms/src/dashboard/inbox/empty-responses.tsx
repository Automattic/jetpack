import { __ } from '@wordpress/i18n';

type EmptyResponsesProps = {
	status: string;
	isSearch: boolean;
};

const EmptyResponses = ( { status, isSearch }: EmptyResponsesProps ) => {
	const searchMessage = __( 'No responses found', 'jetpack-forms' );
	if ( isSearch ) {
		return searchMessage;
	}

	const noTrashMessage = __( 'Trash is empty', 'jetpack-forms' );
	if ( status === 'trash' ) {
		return noTrashMessage;
	}

	const noSpamMessage = __(
		'Spam responses are automatically trashed after 15 days.',
		'jetpack-forms'
	);
	if ( status === 'spam' ) {
		return noSpamMessage;
	}

	return __( 'No responses', 'jetpack-forms' );
};

export default EmptyResponses;
