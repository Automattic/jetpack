import { Workflow } from '../../types';

export type WorkflowTableColumn = 'checkbox' | 'name' | 'status' | 'added' | 'trigger' | 'edit';
export type SortableWorkflowTableColumn = Exclude< WorkflowTableColumn, 'checkbox' | 'edit' >;

export type SortDirection = 'ascending' | 'descending';

export type WorkflowSortFunction = ( a: Workflow, b: Workflow ) => number;
