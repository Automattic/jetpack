/**
 * External dependencies
 */
import { formatNumberCompact } from '@automattic/number-formatters';
/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { DataViews } from '@wordpress/dataviews';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Badge, Stack, Tabs } from '@wordpress/ui';
import { NON_TRASH_FORM_STATUSES } from '../../../constants.ts';
import useFormsData from '../../../hooks/use-forms-data.ts';
import { store as dashboardStore } from '../../../store/index.js';
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
	const { totalItems: formsCount = 0 } = useFormsData( 1, 1, '', NON_TRASH_FORM_STATUSES );

	const responsesInboxCount = useSelect( select => {
		// Trigger resolver if needed.
		select( dashboardStore ).getCounts();
		return select( dashboardStore ).getInboxCount() ?? 0;
	}, [] );

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
							<Tabs.List variant="minimal">
								<Tabs.Tab value="forms">
									<span>
										{ __( 'Forms', 'jetpack-forms' ) }
										<Badge intent="draft" className="jp-forms-tabs-count">
											{ formatNumberCompact( formsCount || 0 ) }
										</Badge>
									</span>
								</Tabs.Tab>
								<Tabs.Tab value="responses">
									<span>
										{ __( 'Responses', 'jetpack-forms' ) }
										<Badge intent="draft" className="jp-forms-tabs-count">
											{ formatNumberCompact( responsesInboxCount || 0 ) }
										</Badge>
									</span>
								</Tabs.Tab>
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
