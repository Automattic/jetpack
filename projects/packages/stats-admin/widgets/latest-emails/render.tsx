import { formatNumber } from '@automattic/number-formatters';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DataViews } from '@wordpress/dataviews';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, Text } from '@wordpress/ui';
import { useLatestEmails } from './hooks/use-latest-emails';
import { getEmailStatsDetailUrl } from './lib/get-email-stats-url';
import styles from './style.module.css';
import type { LatestEmailRow } from './hooks/use-latest-emails';
import type { Field, View } from '@wordpress/dataviews';

const queryClient = new QueryClient();

const defaultView: View = {
	type: 'table',
	page: 1,
	perPage: 10,
	fields: [ 'title', 'open_rate', 'clicks' ],
	titleField: 'title',
	layout: {
		enableMoving: false,
	},
};

const defaultLayouts = {
	table: {
		density: 'compact',
	},
};

/**
 * Return a stable id for DataViews row keys.
 *
 * @param item - Email row.
 * @return Stable DataViews item id.
 */
function getLatestEmailItemId( item: LatestEmailRow ): string {
	return item.id;
}

/**
 * Format open rate for the table column.
 *
 * @param value - Open rate percentage (0–100), or null when unknown.
 * @return Formatted open rate for display.
 */
function formatOpenRate( value: number | null ): string {
	if ( value === null || Number.isNaN( value ) ) {
		return '—';
	}

	return formatNumber( value / 100, {
		numberFormatOptions: {
			style: 'percent',
			minimumFractionDigits: 0,
			maximumFractionDigits: 1,
		},
	} );
}

/**
 * Widget body: latest emails in a compact DataViews table.
 *
 * @return Widget content.
 */
function LatestEmailsContent(): JSX.Element {
	const { data = [], isLoading, isError, error } = useLatestEmails();
	const [ view, setView ] = useState< View >( defaultView );

	const fields = useMemo< Field< LatestEmailRow >[] >(
		() => [
			{
				id: 'title',
				type: 'text',
				label: __( 'Email', 'jetpack-stats-admin' ),
				enableGlobalSearch: false,
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
				getValue: ( { item } ) => item.title,
				render: ( { item } ) => (
					<a className={ styles.titleLink } href={ getEmailStatsDetailUrl( item.postId ) }>
						{ item.title }
					</a>
				),
			},
			{
				id: 'open_rate',
				type: 'text',
				label: __( 'Open rate', 'jetpack-stats-admin' ),
				enableGlobalSearch: false,
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
				getValue: ( { item } ) => formatOpenRate( item.openRate ),
			},
			{
				id: 'clicks',
				type: 'integer',
				label: __( 'Clicks', 'jetpack-stats-admin' ),
				enableGlobalSearch: false,
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
				getValue: ( { item } ) => item.clicks,
			},
		],
		[]
	);

	const paginationInfo = useMemo(
		() => ( {
			totalItems: data.length,
			totalPages: 1,
		} ),
		[ data.length ]
	);

	if ( isError ) {
		return (
			<Card.FullBleed className={ styles.container }>
				<Text variant="body" className={ styles.error }>
					{ error instanceof Error
						? error.message
						: __( 'Unable to load latest emails.', 'jetpack-stats-admin' ) }
				</Text>
			</Card.FullBleed>
		);
	}

	return (
		<Card.FullBleed className={ styles.container }>
			<DataViews< LatestEmailRow >
				data={ data }
				fields={ fields }
				view={ view }
				onChangeView={ setView }
				defaultLayouts={ defaultLayouts }
				paginationInfo={ paginationInfo }
				getItemId={ getLatestEmailItemId }
				isLoading={ isLoading }
			/>
		</Card.FullBleed>
	);
}

/**
 * Latest emails dashboard widget.
 *
 * @return Widget root with query client.
 */
export default function LatestEmailsWidget(): JSX.Element {
	return (
		<QueryClientProvider client={ queryClient }>
			<LatestEmailsContent />
		</QueryClientProvider>
	);
}
