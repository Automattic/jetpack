import { Workflow } from 'crm/state/automations-admin/types';
import { useCallback, useState } from 'react';
import { WorkflowRow } from '../workflow-row';
import { WorkflowTableHeader } from '../workflow-table-header';
import styles from './styles.module.scss';
import { SortDirection, SortableWorkflowTableColumn } from './types';
import { sortWorkflows } from './util';

type WorkflowTableProps = {
	workflows: Workflow[];
	refetchWorkflows: () => void;
};

export const WorkflowTable: React.FC< WorkflowTableProps > = props => {
	const { workflows, refetchWorkflows } = props;

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
				key={ column }
				column={ column }
				onClick={ getSortableHeaderOnClick( column ) }
				selectedForSort={ sortedColumn === column }
				sortDirection={ sortDirection }
			/>
		);
	};

	const sortableColumns: SortableWorkflowTableColumn[] = [ 'name', 'status', 'added', 'trigger' ];

	const sortedWorkflows = sortWorkflows( workflows, sortedColumn, sortDirection );

	return (
		<div className={ styles.container }>
			<table className={ styles.table }>
				<thead>
					<tr className={ styles[ 'header-row' ] }>
						<WorkflowTableHeader column={ 'checkbox' } />
						{ sortableColumns.map( column => getSortableWorkflowTableHeader( column ) ) }
						<WorkflowTableHeader column={ 'edit' } />
					</tr>
				</thead>
				<tbody>
					{ sortedWorkflows.map( workflow => (
						<WorkflowRow
							key={ workflow.id }
							workflow={ workflow }
							refetchWorkflows={ refetchWorkflows }
						/>
					) ) }
				</tbody>
			</table>
		</div>
	);
};
