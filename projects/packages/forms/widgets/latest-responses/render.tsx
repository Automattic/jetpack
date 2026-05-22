import { DataViews } from '@wordpress/dataviews';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card } from '@wordpress/ui';
import { useLatestResponses } from './hooks/use-latest-responses';
import { getResponseDetailUrl } from './lib/get-response-detail-url';
import styles from './style.module.css';
import type { LatestResponseRow } from './hooks/use-latest-responses';
import type { Field, View } from '@wordpress/dataviews';

const defaultView: View = {
	type: 'table',
	page: 1,
	perPage: 10,
	fields: [ 'from', 'date', 'source' ],
};

const defaultLayouts = {
	table: {
		density: 'compact',
	},
};

/**
 * Return a stable id for DataViews row keys.
 *
 * @param item - Response row.
 * @return Stable DataViews item id.
 */
function getLatestResponseItemId( item: LatestResponseRow ): string {
	return item.id;
}

/**
 * Widget body: latest form responses in a compact DataViews table.
 *
 * @return Widget content.
 */
export default function LatestResponsesWidget(): JSX.Element {
	const { data, isLoading } = useLatestResponses();
	const [ view, setView ] = useState< View >( defaultView );
	const dateSettings = getDateSettings();

	const fields = useMemo< Field< LatestResponseRow >[] >(
		() => [
			{
				id: 'from',
				type: 'text',
				label: __( 'From', 'jetpack-forms' ),
				enableGlobalSearch: false,
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
				getValue: ( { item } ) => item.from,
				render: ( { item } ) => (
					<a className={ styles.fromLink } href={ getResponseDetailUrl( item.responseId ) }>
						{ item.from }
					</a>
				),
			},
			{
				id: 'date',
				type: 'date',
				label: __( 'Date', 'jetpack-forms' ),
				enableGlobalSearch: false,
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
				getValue: ( { item } ) => item.date,
				render: ( { item } ) =>
					item.date ? dateI18n( dateSettings.formats.datetime, item.date ) : '—',
			},
			{
				id: 'source',
				type: 'text',
				label: __( 'Source', 'jetpack-forms' ),
				enableGlobalSearch: false,
				enableHiding: false,
				enableSorting: false,
				filterBy: false,
				getValue: ( { item } ) => item.source,
			},
		],
		[ dateSettings.formats.datetime ]
	);

	const paginationInfo = useMemo(
		() => ( {
			totalItems: data.length,
			totalPages: 1,
		} ),
		[ data.length ]
	);

	return (
		<Card.FullBleed className={ styles.container }>
			<DataViews< LatestResponseRow >
				data={ data }
				fields={ fields }
				view={ view }
				onChangeView={ setView }
				defaultLayouts={ defaultLayouts }
				paginationInfo={ paginationInfo }
				getItemId={ getLatestResponseItemId }
				isLoading={ isLoading }
			>
				<DataViews.Layout />
			</DataViews>
		</Card.FullBleed>
	);
}
