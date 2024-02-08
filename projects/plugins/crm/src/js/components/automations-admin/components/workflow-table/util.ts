import { Workflow } from 'crm/state/automations-admin/types';
import { SortableWorkflowTableColumn, SortDirection } from './types';

const getSortValueFunctions: Record<
	SortableWorkflowTableColumn,
	( workflow: Workflow ) => Workflow[ keyof Workflow ]
> = {
	name: ( workflow: Workflow ) => workflow.name,
	status: ( workflow: Workflow ) => workflow.active,
	added: ( workflow: Workflow ) => workflow.added,
	trigger: ( workflow: Workflow ) => workflow.triggers[ 0 ].description ?? '',
};

export const sortWorkflows = (
	workflows: Workflow[],
	sortColumn: SortableWorkflowTableColumn,
	sortDirection: SortDirection
) => {
	return [ ...workflows ].sort( ( a: Workflow, b: Workflow ) => {
		const propA = getSortValueFunctions[ sortColumn ]( a );
		const propB = getSortValueFunctions[ sortColumn ]( b );

		let result = 0;
		if ( propA < propB ) {
			result = -1;
		}
		if ( propA > propB ) {
			result = 1;
		}

		if ( 'descending' === sortDirection ) {
			result *= -1;
		}

		return result;
	} );
};
