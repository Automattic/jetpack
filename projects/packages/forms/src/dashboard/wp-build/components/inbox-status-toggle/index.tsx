/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import * as Tabs from '../../../components/tabs';

type Status = 'inbox' | 'spam' | 'trash';

type Counts = {
	inbox: number;
	spam: number;
	trash: number;
};

type Props = {
	activeStatus: Status;
	counts: Counts;
	onChange: ( nextStatus: Status ) => void;
};

const getLabel = ( status: Status, count: number ): string => {
	switch ( status ) {
		case 'inbox':
			return sprintf(
				/* translators: %d is the number of inbox responses. */
				__( 'Inbox (%d)', 'jetpack-forms' ),
				count
			);
		case 'spam':
			return sprintf(
				/* translators: %d is the number of spam responses. */
				__( 'Spam (%d)', 'jetpack-forms' ),
				count
			);
		case 'trash':
			return sprintf(
				/* translators: %d is the number of trash responses. */
				__( 'Trash (%d)', 'jetpack-forms' ),
				count
			);
	}
};

/**
 * wp-build single-form view status tabs (Inbox / Spam / Trash).
 *
 * @param props              - Props.
 * @param props.activeStatus - Current active status.
 * @param props.counts       - Counts for each status.
 * @param props.onChange     - Called when the status changes.
 * @return Tabs UI.
 */
export default function InboxStatusToggle( {
	activeStatus,
	counts,
	onChange,
}: Props ): JSX.Element {
	const handleChange = useCallback(
		( nextStatus: Status ) => {
			if ( nextStatus === activeStatus ) {
				return;
			}
			onChange( nextStatus );
		},
		[ activeStatus, onChange ]
	);

	const statusTabs: Array< { value: Status; label: string } > = [
		{ value: 'inbox', label: getLabel( 'inbox', counts.inbox ) },
		{ value: 'spam', label: getLabel( 'spam', counts.spam ) },
		{ value: 'trash', label: getLabel( 'trash', counts.trash ) },
	];

	return (
		<Tabs.Root value={ activeStatus } onValueChange={ handleChange }>
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
