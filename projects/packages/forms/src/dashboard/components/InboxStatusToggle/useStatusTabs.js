import { useEntityRecords } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Returns a formatted tab label with count.
 *
 * @param {string} label - The label for the tab.
 * @param {number} count - The count to display.
 * @return {string} The formatted label.
 */
function getTabLabel( label, count ) {
	/* translators: 1: Tab label, 2: Count */
	return sprintf( __( '%1$s (%2$s)', 'jetpack-forms' ), label, count || 0 );
}

/**
 * Custom hook to get status tabs for the inbox view.
 *
 * @return {Array<{label: string, value: string}>} The status tabs.
 */
export default function useStatusTabs() {
	const { totalItems: totalItemsInbox } = useEntityRecords( 'postType', 'feedback', {
		status: 'publish,draft',
		per_page: 1,
		_fields: 'id',
	} );
	const { totalItems: totalItemsSpam } = useEntityRecords( 'postType', 'feedback', {
		status: 'spam',
		per_page: 1,
		_fields: 'id',
	} );
	const { totalItems: totalItemsTrash } = useEntityRecords( 'postType', 'feedback', {
		status: 'trash',
		per_page: 1,
		_fields: 'id',
	} );

	return [
		{ label: getTabLabel( __( 'Inbox', 'jetpack-forms' ), totalItemsInbox ), value: 'inbox' },
		{ label: getTabLabel( __( 'Spam', 'jetpack-forms' ), totalItemsSpam ), value: 'spam' },
		{ label: getTabLabel( __( 'Trash', 'jetpack-forms' ), totalItemsTrash ), value: 'trash' },
	];
}
