import { SearchControl, Spinner } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, settings as settingsIcon } from '@wordpress/icons';
import { Button, Card, Stack } from '@wordpress/ui';
import { useActivityLog } from '../../hooks/use-activity-log';
import ActivityRow from '../activity-row';
import './style.scss';
import type { ActivityItem } from '../../types/activity';

const PAGE_SIZE = 10;

type Props = {
	selectedId: string | null;
	onSelect: ( id: string ) => void;
};

/**
 * Left pane of the modernized Overview: a paginated, searchable activity list.
 *
 * Owns its own search and pagination state and reads items from the mock hook.
 * Selection is owned by the parent so it can be reflected in the URL and used
 * by the right-hand detail pane.
 *
 * @param props            - Component props.
 * @param props.selectedId - Currently selected row id, or null when nothing is selected.
 * @param props.onSelect   - Callback invoked with the new selection id when a row is activated.
 * @return The rendered activity list card.
 */
export default function ActivityList( { selectedId, onSelect }: Props ) {
	const [ search, setSearch ] = useState( '' );
	const [ page, setPage ] = useState( 1 );
	const { items, totalPages, isLoading } = useActivityLog( {
		page,
		pageSize: PAGE_SIZE,
		search,
	} );

	const handleSearchChange = useCallback( ( next: string ) => {
		setSearch( next );
		setPage( 1 );
	}, [] );

	const handlePrevPage = useCallback( () => {
		setPage( p => Math.max( 1, p - 1 ) );
	}, [] );

	const handleNextPage = useCallback( () => {
		setPage( p => Math.min( totalPages, p + 1 ) );
	}, [ totalPages ] );

	return (
		<Card className="jpb-activity-list">
			<Stack direction="row" gap="sm" align="center" className="jpb-activity-list__header">
				<SearchControl
					value={ search }
					onChange={ handleSearchChange }
					label={ __( 'Search backups', 'jetpack-backup-pkg' ) }
					placeholder={ __( 'Search backups', 'jetpack-backup-pkg' ) }
					__nextHasNoMarginBottom
				/>
				<Button
					variant="tertiary"
					aria-label={ __( 'Filter activity', 'jetpack-backup-pkg' ) }
					icon={ <Icon icon={ settingsIcon } /> }
				/>
			</Stack>
			<div className="jpb-activity-list__rows" aria-busy={ isLoading }>
				{ isLoading ? (
					<div className="jpb-activity-list__loading">
						<Spinner />
					</div>
				) : (
					items.map( ( item: ActivityItem ) => (
						<ActivityRow
							key={ item.id }
							item={ item }
							isSelected={
								selectedId !== null &&
								( item.kind === 'backup' ? item.rewindId : item.id ) === selectedId
							}
							onSelect={ onSelect }
						/>
					) )
				) }
			</div>
			<Stack
				direction="row"
				gap="sm"
				align="center"
				justify="space-between"
				className="jpb-activity-list__footer"
			>
				<span>
					{ sprintf(
						/* translators: %1$d current page, %2$d total pages */
						__( 'Page %1$d of %2$d', 'jetpack-backup-pkg' ),
						page,
						totalPages
					) }
				</span>
				<Stack direction="row" gap="xs">
					<Button variant="tertiary" disabled={ page === 1 } onClick={ handlePrevPage }>
						‹
					</Button>
					<Button variant="tertiary" disabled={ page >= totalPages } onClick={ handleNextPage }>
						›
					</Button>
				</Stack>
			</Stack>
		</Card>
	);
}
