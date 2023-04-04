import { Button } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PageNavigation from '../components/page-navigation';
import Table from '../components/table';
import SingleActionsMenu from './single-actions-menu';

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
		component: Button,
		getProps: item => ( {
			href: item.entry_permalink,
			variant: 'link',
		} ),
	},
	{
		key: 'actions',
		component: SingleActionsMenu,
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
