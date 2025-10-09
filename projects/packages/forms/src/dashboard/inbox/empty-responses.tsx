import { __experimentalVStack as VStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { __, _n, sprintf } from '@wordpress/i18n';
import useFormsConfig from '../../hooks/use-forms-config';

const EmptyWrapper = ( { children } ) => (
	<VStack alignment="center" spacing="0">
		{ children }
	</VStack>
);

type EmptyResponsesProps = {
	status: string;
	isSearch: boolean;
};

const EmptyResponses = ( { status, isSearch }: EmptyResponsesProps ) => {
	const formsConfig = useFormsConfig();
	const emptyTrashDays = formsConfig?.emptyTrashDays ?? 0;

	const searchHeading = __( 'No results found', 'jetpack-forms' );
	const searchMessage = __(
		"Try adjusting your search or filters to find what you're looking for.",
		'jetpack-forms'
	);
	if ( isSearch ) {
		return (
			<EmptyWrapper>
				<h4>{ searchHeading }</h4>
				<p>{ searchMessage }</p>
			</EmptyWrapper>
		);
	}

	const noTrashHeading = __( 'Trash is empty', 'jetpack-forms' );
	const noTrashMessage = sprintf(
		/* translators: %d number of days. */
		_n(
			'Items in trash are permanently deleted after %d day.',
			'Items in trash are permanently deleted after %d days.',
			emptyTrashDays,
			'jetpack-forms'
		),
		emptyTrashDays
	);
	if ( status === 'trash' ) {
		return (
			<EmptyWrapper>
				<h4>{ noTrashHeading }</h4>
				<p>{ emptyTrashDays > 0 && noTrashMessage }</p>;
			</EmptyWrapper>
		);
	}

	const noSpamHeading = __( 'Lucky you, no spam!', 'jetpack-forms' );
	const noSpamMessage = __( 'Spam responses are moved to trash after 15 days.', 'jetpack-forms' );
	if ( status === 'spam' ) {
		return (
			<EmptyWrapper>
				<h4>{ noSpamHeading }</h4>
				<p>{ noSpamMessage }</p>
			</EmptyWrapper>
		);
	}

	return (
		<EmptyWrapper>
			<h4>{ __( "You're set up. No responses yet.", 'jetpack-forms' ) }</h4>
			<p>
				{ __(
					'Share your form to start collecting responses. New items will appear here.',
					'jetpack-forms'
				) }
			</p>
		</EmptyWrapper>
	);
};

export default EmptyResponses;
