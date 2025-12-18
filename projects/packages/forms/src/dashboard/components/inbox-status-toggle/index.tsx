/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useBreakpointMatch } from '@automattic/jetpack-components';
import { formatNumberCompact } from '@automattic/number-formatters';
import { Badge } from '@automattic/ui';
import { __, _x } from '@wordpress/i18n';
import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
/**
 * Internal dependencies
 */
import useInboxData from '../../hooks/use-inbox-data.ts';
import * as Tabs from '../tabs/index.ts';

/**
 * Returns a formatted tab label with count badge.
 *
 * @param {string} label - The label for the tab.
 * @param {number} count - The count to display.
 * @return {JSX.Element} The formatted label with count badge.
 */
function getTabLabel( label: string, count: number ): JSX.Element {
	return (
		<span style={ { display: 'flex', gap: '4px', alignItems: 'center' } }>
			{ label }
			<Badge intent="default">{ formatNumberCompact( count || 0 ) }</Badge>
		</span>
	);
}

type InboxStatusToggleProps = {
	onChange: ( status: string ) => void;
};

/**
 * Renders the status toggle for the inbox view.
 *
 * @param {Function} onChange - The function to call when the status changes.
 * @return {JSX.Element} The status toggle component.
 */
export default function InboxStatusToggle( { onChange }: InboxStatusToggleProps ): JSX.Element {
	const [ searchParams, setSearchParams ] = useSearchParams();
	const status = searchParams.get( 'status' ) || 'inbox';
	const [ isSm ] = useBreakpointMatch( 'sm' );

	const { totalItemsInbox, totalItemsSpam, totalItemsTrash, setSelectedResponses } = useInboxData();

	const statusTabs = [
		{ label: getTabLabel( __( 'Inbox', 'jetpack-forms' ), totalItemsInbox ), value: 'inbox' },
		{ label: getTabLabel( __( 'Spam', 'jetpack-forms' ), totalItemsSpam ), value: 'spam' },
		{
			label: getTabLabel( _x( 'Trash', 'noun', 'jetpack-forms' ), totalItemsTrash ),
			value: 'trash',
		},
	];

	const handleChange = useCallback(
		( newStatus: string ) => {
			jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_inbox_status_change', {
				status: newStatus,
				viewport: isSm ? 'mobile' : 'desktop',
				previous_status: status,
			} );

			setSearchParams( prev => {
				const params = new URLSearchParams( prev );
				params.set( 'status', newStatus );
				params.delete( 'r' ); // Clear selected responses when changing tabs.
				return params;
			} );
			setSelectedResponses( [] );
			onChange( newStatus );
		},
		[ isSm, status, setSearchParams, onChange, setSelectedResponses ]
	);

	return (
		<Tabs.Root value={ status } onValueChange={ handleChange }>
			<Tabs.List density="compact">
				{ statusTabs.map( option => (
					<Tabs.Tab key={ option.value } value={ option.value }>
						{ option.label }
					</Tabs.Tab>
				) ) }
			</Tabs.List>
		</Tabs.Root>
	);
}
