/**
 * WordPress dependencies
 */
import { DataViews } from '@wordpress/dataviews';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Stack } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import * as Tabs from '../../../components/tabs';
import InboxStatusToggle from '../inbox-status-toggle';
import './style.scss';

type ActiveTab = 'forms' | 'responses';
type StatusTab = 'inbox' | 'spam' | 'trash';

type DataViewsHeaderRowProps = {
	activeTab: ActiveTab;
	isSingleFormView?: boolean;
	activeStatus?: StatusTab;
	statusCounts?: { inbox: number; spam: number; trash: number };
	onStatusChange?: ( nextStatus: StatusTab ) => void;
};

/**
 * Shared wp-build DataViews header row:
 * - Left: Forms | Responses tabs (CFM-on behavior; wp-build assumes CFM is always on)
 * - Single-form special case: show Inbox/Spam/Trash tabs instead
 * - Right: DataViews controls (Search + ViewConfig)
 * - Below: DataViews filter pills row (collapses when empty)
 *
 * @param props                  - Props.
 * @param props.activeTab        - Which top tab is active.
 * @param props.isSingleFormView - Whether this screen is showing a single-form responses view.
 * @param props.activeStatus     - Current status for the single-form status tabs.
 * @param props.statusCounts     - Status counts for the single-form status tabs.
 * @param props.onStatusChange   - Handler for single-form status tab changes.
 * @return Header row markup for wp-build DataViews screens.
 */
export default function DataViewsHeaderRow( {
	activeTab,
	isSingleFormView = false,
	activeStatus,
	statusCounts,
	onStatusChange,
}: DataViewsHeaderRowProps ): JSX.Element {
	const navigate = useNavigate();

	const onTabChange = useCallback(
		( nextValue: ActiveTab ) => {
			if ( nextValue === 'forms' ) {
				navigate( { href: '/forms' } );
				return;
			}

			// In the wp-build environment we always treat Responses as `/responses/inbox`.
			navigate( { href: '/responses/inbox' } );
		},
		[ navigate ]
	);

	return (
		<>
			<Stack
				align="center"
				className="jp-forms-dataviews__view-actions"
				gap="sm"
				justify="space-between"
			>
				<Stack align="center" gap="sm">
					{ isSingleFormView ? (
						<InboxStatusToggle
							activeStatus={ activeStatus ?? 'inbox' }
							counts={ statusCounts ?? { inbox: 0, spam: 0, trash: 0 } }
							onChange={ onStatusChange ?? ( () => {} ) }
						/>
					) : (
						<Tabs.Root value={ activeTab } onValueChange={ onTabChange }>
							<Tabs.List density="compact">
								<Tabs.Tab value="responses">{ __( 'Responses', 'jetpack-forms' ) }</Tabs.Tab>
								<Tabs.Tab value="forms">{ __( 'Forms', 'jetpack-forms' ) }</Tabs.Tab>
							</Tabs.List>
						</Tabs.Root>
					) }
				</Stack>
				<Stack align="center" gap="sm">
					<DataViews.Search />
					{ isSingleFormView ? <DataViews.FiltersToggle /> : null }
					<DataViews.ViewConfig />
				</Stack>
			</Stack>
			<DataViews.FiltersToggled className="jp-forms-dataviews-filters__container" />
		</>
	);
}
