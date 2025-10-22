import {
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import useConfigValue from '../../hooks/use-config-value';
import CreateFormButton from '../components/create-form-button';

const EmptyWrapper = ( { heading = '', body = '', actions = null } ) => (
	<VStack alignment="center" spacing="2">
		{ heading && (
			<Text as="h3" weight="500" size="15">
				{ heading }
			</Text>
		) }
		{ body && <Text variant="muted">{ body }</Text> }
		{ actions && <span style={ { marginBlockStart: '16px' } }>{ actions }</span> }
	</VStack>
);

type EmptyResponsesProps = {
	status: string;
	isSearch: boolean;
	readStatusFilter?: 'unread' | 'read';
};

const EmptyResponses = ( { status, isSearch, readStatusFilter }: EmptyResponsesProps ) => {
	const emptyTrashDays = useConfigValue( 'emptyTrashDays' ) ?? 0;

	// Handle search and filter states first
	const hasReadStatusFilter = !! readStatusFilter;
	const searchHeading = __( 'No results found', 'jetpack-forms' );
	const searchMessage = __(
		"Try adjusting your search or filters to find what you're looking for.",
		'jetpack-forms'
	);
	if ( isSearch || hasReadStatusFilter ) {
		return <EmptyWrapper heading={ searchHeading } body={ searchMessage } />;
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
			<EmptyWrapper heading={ noTrashHeading } body={ emptyTrashDays > 0 && noTrashMessage } />
		);
	}

	const noSpamHeading = __( 'Lucky you, no spam!', 'jetpack-forms' );
	const noSpamMessage = __( 'Spam responses are moved to trash after 15 days.', 'jetpack-forms' );
	if ( status === 'spam' ) {
		return <EmptyWrapper heading={ noSpamHeading } body={ noSpamMessage } />;
	}

	return (
		<EmptyWrapper
			heading={ __( "You're set up. No responses yet.", 'jetpack-forms' ) }
			body={ __(
				'Share your form to start collecting responses. New items will appear here.',
				'jetpack-forms'
			) }
			actions={ <CreateFormButton label={ __( 'Create a new form', 'jetpack-forms' ) } /> }
		/>
	);
};

export default EmptyResponses;
