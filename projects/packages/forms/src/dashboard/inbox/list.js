import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PageNavigation from '../components/page-navigation';
import Table from '../components/table';

const COLUMNS = [
	{
		key: 'name',
		label: __( 'From', 'jetpack-forms' ),
	},
	{
		key: 'date',
		label: __( 'Date', 'jetpack-forms' ),
	},
	{
		key: 'source',
		label: __( 'Source', 'jetpack-forms' ),
	},
];

const InboxList = ( {
	currentPage,
	currentResponseId,
	pages,
	responses,
	selectedResponses,
	setCurrentPage,
	setCurrentResponseId,
	setSelectedResponses,
	loading,
} ) => {
	const tableItems = useMemo(
		() =>
			responses.map( response => ( {
				...response,
				onClick: () => setCurrentResponseId( response.id ),
				isActive: response.id === currentResponseId,
			} ) ),
		[ currentResponseId, responses, setCurrentResponseId ]
	);

	if ( loading ) {
		return (
			<Table
				className="jp-forms__inbox-list"
				columns={ [ { key: 'empty', label: __( 'Loading…', 'jetpack-forms' ) } ] }
				items={ [] }
			/>
		);
	}
	if ( responses.length === 0 ) {
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
			/>

			<PageNavigation
				currentPage={ currentPage }
				pages={ pages }
				onSelectPage={ setCurrentPage }
				expandedRange={ 2 }
			/>
		</>
	);
};

export default InboxList;
