import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { noop } from 'lodash';
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

const DATA = [
	{
		id: 1,
		name: 'Jasmine Rice',
		date: '2 hours ago',
		source: '/rsvp',
	},
	{
		id: 2,
		name: 'Jasmine Rice',
		date: '4 hours ago',
		source: '/rsvp',
	},
	{
		id: 3,
		name: 'Jasmine Rice',
		date: 'Jan 12, 2023',
		source: '/rsvp',
	},
	{
		id: 4,
		name: 'Jasmine Rice',
		date: 'Jan 12, 2023',
		source: '/rsvp',
	},
	{
		id: 5,
		name: 'Jasmine Rice',
		date: 'Jan 12, 2023',
		source: '/rsvp',
	},
];

const InboxList = () => {
	const [ currentPage, setCurrentPage ] = useState( 1 );

	return (
		<>
			<Table
				className="jp-forms__inbox-list"
				columns={ COLUMNS }
				items={ DATA }
				onSelectionChange={ noop }
			/>

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
