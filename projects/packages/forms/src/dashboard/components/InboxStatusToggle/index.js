import {
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControl as ToggleGroupControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { useEntityRecords } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import './style.scss';
import { store as dashboardStore } from '../../store';

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
 *
 */
export default function InboxStatusToggle() {
	const [ searchParams, setSearchParams ] = useSearchParams();
	const status = searchParams.get( 'status' ) || 'inbox';

	const currentQuery = useSelect( select => select( dashboardStore ).getCurrentQuery(), [] );
	const queryBase = { search: '', page: 1, ...currentQuery, per_page: 1, _fields: 'id' };

	const { totalItems: totalItemsInbox } = useEntityRecords( 'postType', 'feedback', {
		...queryBase,
		status: 'publish,draft',
	} );
	const { totalItems: totalItemsSpam } = useEntityRecords( 'postType', 'feedback', {
		...queryBase,
		status: 'spam',
	} );
	const { totalItems: totalItemsTrash } = useEntityRecords( 'postType', 'feedback', {
		...queryBase,
		status: 'trash',
	} );

	const statusTabs = [
		{ label: getTabLabel( __( 'Inbox', 'jetpack-forms' ), totalItemsInbox ), value: 'inbox' },
		{ label: getTabLabel( __( 'Spam', 'jetpack-forms' ), totalItemsSpam ), value: 'spam' },
		{ label: getTabLabel( __( 'Trash', 'jetpack-forms' ), totalItemsTrash ), value: 'trash' },
	];

	const handleChange = useCallback(
		newStatus => {
			setSearchParams( prev => {
				const params = new URLSearchParams( prev );
				params.set( 'status', newStatus );
				return params;
			} );
		},
		[ setSearchParams ]
	);

	return (
		<ToggleGroupControl
			className="jp-forms__inbox-status-toggle"
			value={ status }
			onChange={ handleChange }
		>
			{ statusTabs.map( option => (
				<ToggleGroupControlOption
					key={ option.value }
					value={ option.value }
					label={ option.label }
				/>
			) ) }
		</ToggleGroupControl>
	);
}
