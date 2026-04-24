import { Card, CardBody, Icon } from '@wordpress/components';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { gridiconToWordPressIcon } from '../../data/gridicons';
import { useFormattedTime } from '../../data/use-formatted-time';
import styles from './style.module.scss';
import type { ActivityLogEntry } from '../../data/types';
import type { Field, View } from '@wordpress/dataviews';
import type { FC } from 'react';

const DEFAULT_LAYOUTS = { list: {} } as const;

const defaultView: View = {
	type: 'list',
	fields: [ 'date', 'content_text' ],
	mediaField: 'icon',
	titleField: 'title',
	perPage: 10,
	sort: {
		field: 'date',
		direction: 'desc',
	},
	layout: {
		density: 'balanced',
	},
	showLevels: false,
};

const FormattedDate: FC< { timestamp: string } > = ( { timestamp } ) => {
	const formatted = useFormattedTime( timestamp, {
		dateStyle: 'medium',
		timeStyle: 'short',
	} );
	return <>{ formatted }</>;
};

// Hoisted to module scope so the `fields` array has a stable
// reference — calling `getFields()` inline on every render made
// `filterSortAndPaginate` return a fresh `filteredData` array each
// render, and DataViews in turn remounted every row's icon and
// content cells at 60fps (30k DOM mutations / 2s on the list alone).
const FIELDS: Field< ActivityLogEntry >[] = [
	{
		id: 'icon',
		label: __( 'Icon', 'jetpack-backup-pkg' ),
		enableSorting: false,
		render: ( { item } ) => <Icon icon={ gridiconToWordPressIcon( item.gridicon ) } size={ 24 } />,
	},
	{
		id: 'title',
		label: __( 'Title', 'jetpack-backup-pkg' ),
		getValue: ( { item } ) => {
			const actor = item.actor?.name
				? // translators: %s is the name of the person or system that performed the action.
				  ` ${ sprintf( __( 'by %s', 'jetpack-backup-pkg' ), item.actor.name ) }`
				: '';
			return ( item.summary ?? '' ) + actor;
		},
		enableGlobalSearch: true,
	},
	{
		id: 'date',
		label: __( 'Date', 'jetpack-backup-pkg' ),
		getValue: ( { item } ) => item.published || item.last_published,
		render: ( { item } ) => <FormattedDate timestamp={ item.published || item.last_published } />,
	},
	{
		id: 'content_text',
		label: __( 'Content', 'jetpack-backup-pkg' ),
		getValue: ( { item } ) => item.content?.text ?? '',
		enableGlobalSearch: true,
	},
];

interface BackupsListProps {
	activityLog: ActivityLogEntry[];
	isLoadingActivityLog: boolean;
	selectedBackup: ActivityLogEntry | null;
	onSelectBackup: ( backup: ActivityLogEntry | null ) => void;
	dateRange?: { start: Date; end: Date };
}

const BackupsList: FC< BackupsListProps > = ( {
	activityLog,
	isLoadingActivityLog,
	selectedBackup,
	onSelectBackup,
	dateRange,
} ) => {
	const [ view, setView ] = useState< View >( defaultView );
	const { data: filteredData, paginationInfo } = useMemo(
		() => filterSortAndPaginate( activityLog, view, FIELDS ),
		[ activityLog, view ]
	);

	// Reset page when the date range changes — otherwise pagination can
	// point at a page that no longer exists in the new window.
	useEffect( () => {
		setView( current => ( { ...current, page: 1 } ) );
	}, [ dateRange ] );

	const getItemId = useCallback( ( item: ActivityLogEntry ) => item.activity_id, [] );
	const handleChangeSelection = useCallback(
		( selection: string[] ) => {
			const match =
				selection.length > 0
					? activityLog.find( item => item.activity_id === selection[ 0 ] ) ?? null
					: null;
			onSelectBackup( match );
		},
		[ activityLog, onSelectBackup ]
	);
	const selection = useMemo(
		() => ( selectedBackup ? [ selectedBackup.activity_id ] : [] ),
		[ selectedBackup ]
	);
	const emptyMessage = useMemo(
		() => (
			<p>
				{ view.search
					? __( 'No results for this search term.', 'jetpack-backup-pkg' )
					: __( 'No results for this period.', 'jetpack-backup-pkg' ) }
			</p>
		),
		[ view.search ]
	);

	return (
		<Card className={ styles.listCard }>
			<CardBody>
				<DataViews< ActivityLogEntry >
					getItemId={ getItemId }
					data={ filteredData }
					fields={ FIELDS }
					view={ view }
					onChangeView={ setView }
					isLoading={ isLoadingActivityLog }
					defaultLayouts={ DEFAULT_LAYOUTS }
					paginationInfo={ paginationInfo }
					searchLabel={ __( 'Search backups', 'jetpack-backup-pkg' ) }
					onChangeSelection={ handleChangeSelection }
					selection={ selection }
					empty={ emptyMessage }
				/>
			</CardBody>
		</Card>
	);
};

export default BackupsList;
