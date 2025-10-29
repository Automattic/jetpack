/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useBreakpointMatch } from '@automattic/jetpack-components';
import { formatNumber } from '@automattic/number-formatters';
import {
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControl as ToggleGroupControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
/**
 * Internal dependencies
 */
import useInboxData from '../../hooks/use-inbox-data';

/**
 * Returns a formatted tab label with count.
 *
 * @param {string} label - The label for the tab.
 * @param {number} count - The count to display.
 * @return {string} The formatted label.
 */
function getTabLabel( label: string, count: number ): string {
	return `${ label } (${ formatNumber( count || 0 ) })`;
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
		<ToggleGroupControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			hideLabelFromVision
			isAdaptiveWidth={ true }
			isBlock
			key={ `${ totalItemsInbox ?? 0 }-${ totalItemsSpam ?? 0 }-${ totalItemsTrash ?? 0 }` }
			label={ __( 'Form responses type', 'jetpack-forms' ) }
			onChange={ handleChange }
			value={ status }
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
