import { useMemo, useState } from '@wordpress/element';
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

const InboxList = ( { currentResponseId, responses, setCurrentResponseId } ) => {
	const [ currentPage, setCurrentPage ] = useState( 1 );

	const tableItems = useMemo(
		() =>
			responses.map( response => ( {
				...response,
				onClick: () => setCurrentResponseId( response.id ),
				isActive: response.id === currentResponseId,
			} ) ),
		[ currentResponseId, responses, setCurrentResponseId ]
	);

	return (
		<>
			<Table className="jp-forms__inbox-list" columns={ COLUMNS } items={ tableItems } />

			<PageNavigation
				currentPage={ currentPage }
				pages={ 10 }
				onSelectPage={ setCurrentPage }
				expandedRange={ 2 }
			/>
		</>
	);
};

export default InboxList;
