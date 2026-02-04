/**
 * External dependencies
 */
import { formatNumberCompact } from '@automattic/number-formatters';
import { Badge } from '@automattic/ui';
import { useCallback, useMemo } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
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

const getLabel = ( status: Status, count: number ): JSX.Element => {
	let label: string;
	switch ( status ) {
		case 'inbox':
			label = __( 'Inbox', 'jetpack-forms' );
			break;
		case 'spam':
			label = __( 'Spam', 'jetpack-forms' );
			break;
		case 'trash':
			label = _x( 'Trash', 'noun', 'jetpack-forms' );
			break;
	}

	return (
		<span>
			{ label }
			<Badge intent="default" className="jp-forms-count-badge">
				{ formatNumberCompact( count || 0 ) }
			</Badge>
		</span>
	);
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

	const statusTabs: Array< { value: Status; label: JSX.Element } > = useMemo(
		() => [
			{ value: 'inbox', label: getLabel( 'inbox', counts.inbox ) },
			{ value: 'spam', label: getLabel( 'spam', counts.spam ) },
			{ value: 'trash', label: getLabel( 'trash', counts.trash ) },
		],
		[ counts.inbox, counts.spam, counts.trash ]
	);

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
