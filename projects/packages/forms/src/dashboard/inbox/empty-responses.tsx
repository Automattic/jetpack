import { __ } from '@wordpress/i18n';

type EmptyResponsesProps = {
	status: string;
	isSearch: boolean;
};

const EmptyResponses = ( { status, isSearch }: EmptyResponsesProps ) => {
	const searchMessage = __( 'No responses found', 'jetpack-forms' );
	if ( isSearch ) {
		return <p>{ searchMessage }</p>;
	}

	const noTrashMessage = __( 'Trash is empty', 'jetpack-forms' );
	if ( status === 'trash' ) {
		return <p>{ noTrashMessage }</p>;
	}

	const noSpamMessage = __(
		'Spam responses are automatically trashed after 15 days.',
		'jetpack-forms'
	);
	if ( status === 'spam' ) {
		return <p>{ noSpamMessage }</p>;
	}

	return <p>{ __( 'No responses', 'jetpack-forms' ) }</p>;
};

export default EmptyResponses;
