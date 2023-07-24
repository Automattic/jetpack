/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { dateI18n } from '@wordpress/date';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { times } from 'lodash';
/**
 * Internal dependencies
 */
import PageNavigation from '../components/page-navigation';
import Table from '../components/table';
import { STORE_NAME } from '../state';
import { RESPONSES_FETCH_LIMIT } from './constants';
import SingleActionsMenu from './single-actions-menu';

const COLUMNS = [
	{
		key: 'name',
		label: __( 'From', 'jetpack-forms' ),
	},
	{
		key: 'date',
		label: __( 'Date', 'jetpack-forms' ),
		getValue: item => dateI18n( 'M j, Y', item.date ),
	},
	{
		key: 'source',
		label: __( 'Source', 'jetpack-forms' ),
		getValue: item => (
			<Button href={ item.entry_permalink } variant="link">
				{ item.source }
			</Button>
		),
	},
	{
		key: 'actions',
		getValue: item => <SingleActionsMenu id={ item.id } />,
	},
];

const InboxList = ( {
	currentPage,
	currentResponseId,
	currentTab,
	pages,
	responses,
	selectedResponses,
	setCurrentPage,
	setCurrentResponseId,
	setSelectedResponses,
	loading,
} ) => {
	const tabTotals = useSelect( select => select( STORE_NAME ).getTabTotals(), [] );
	const totalResponses = tabTotals[ currentTab ];

	const tableItems = useMemo( () => {
		const items = responses.map( response => ( {
			...response,
			onClick: () => setCurrentResponseId( response.id ),
			isActive: response.id === currentResponseId,
		} ) );

		if ( loading ) {
			const numPlaceholders = totalResponses
				? Math.min(
						RESPONSES_FETCH_LIMIT,
						totalResponses - ( currentPage - 1 ) * RESPONSES_FETCH_LIMIT
				  ) - responses.length
				: 10;

			return items.concat(
				times( numPlaceholders, () => ( {
					isLoading: true,
				} ) )
			);
		}

		return items;
	}, [ currentPage, currentResponseId, loading, responses, setCurrentResponseId, totalResponses ] );

	if ( ( ! loading && responses.length === 0 ) || totalResponses === 0 ) {
		return (
			<Table
				className="jp-forms__inbox-list"
				columns={ [ { key: 'empty', label: __( 'No results found', 'jetpack-forms' ) } ] }
				items={ [] }
			/>
		);
	}

	return (
		<>
			<Table
				className="jp-forms__inbox-list"
				columns={ COLUMNS }
				items={ tableItems }
				selectedResponses={ selectedResponses }
				setSelectedResponses={ setSelectedResponses }
				rowAnimationTimeout={ 200 }
			/>

			{ pages > 1 && (
				<PageNavigation
					currentPage={ currentPage }
					pages={ pages }
					onSelectPage={ setCurrentPage }
					expandedRange={ 2 }
				/>
			) }
		</>
	);
};

export default InboxList;
