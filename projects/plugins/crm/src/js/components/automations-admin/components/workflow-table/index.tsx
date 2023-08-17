import { useCallback, useState } from 'react';
import { Workflow } from '../../types';
import { WorkflowRow } from '../workflow-row';
import { WorkflowTableHeader } from '../workflow-table-header';
import styles from './styles.module.scss';
import { SortDirection, SortableWorkflowTableColumn } from './types';
import { sortWorkflows } from './util';

type WorkflowTableProps = {
	workflows: Workflow[];
};

export const WorkflowTable: React.FC< WorkflowTableProps > = props => {
	const { workflows } = props;

	const [ sortedColumn, setSortedColumn ] = useState< SortableWorkflowTableColumn >( 'name' );
	const [ sortDirection, setSortDirection ] = useState< SortDirection >( 'ascending' );

	const getSortableHeaderOnClick = ( column: SortableWorkflowTableColumn ) => {
		return useCallback( () => {
			if ( column !== sortedColumn ) {
				setSortDirection( 'ascending' );
			} else {
				'ascending' === sortDirection
					? setSortDirection( 'descending' )
					: setSortDirection( 'ascending' );
			}

			setSortedColumn( column );
		}, [ column, sortedColumn, setSortedColumn, sortDirection, setSortDirection ] );
	};

	const getSortableWorkflowTableHeader = ( column: SortableWorkflowTableColumn ) => {
		return (
			<WorkflowTableHeader
				column={ column }
				onClick={ getSortableHeaderOnClick( column ) }
				selectedForSort={ sortedColumn === column }
				sortDirection={ sortDirection }
			/>
		);
	};

	const headers: SortableWorkflowTableColumn[] = [ 'name', 'status', 'added', 'trigger' ];

	const sortedWorkflows = sortWorkflows( workflows, sortedColumn, sortDirection );

	return (
		<table className={ styles.table }>
			<tr className={ styles[ 'header-row' ] }>
				<WorkflowTableHeader column={ 'checkbox' } />
				{ headers.map( column => getSortableWorkflowTableHeader( column ) ) }
				<WorkflowTableHeader column={ 'edit' } />
			</tr>
			{ sortedWorkflows.map( workflow => (
				<WorkflowRow workflow={ workflow } />
			) ) }
		</table>
	);
};
