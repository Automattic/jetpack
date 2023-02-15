import { __ } from '@wordpress/i18n';
import { noop } from 'lodash';
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
	return (
		<>
			<Table
				className="jp-forms__inbox-list"
				columns={ COLUMNS }
				items={ DATA }
				onSelectionChange={ noop }
			/>
		</>
	);
};

export default InboxList;
