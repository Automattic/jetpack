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

const InboxList = ( { responses, onSelectionChange, currentPage, setCurrentPage, pages } ) => {
	return (
		<>
			<Table
				className="jp-forms__inbox-list"
				columns={ COLUMNS }
				items={ responses }
				onSelectionChange={ onSelectionChange }
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
