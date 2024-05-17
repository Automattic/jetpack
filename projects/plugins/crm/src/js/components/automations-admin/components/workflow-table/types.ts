export type WorkflowTableColumn = 'checkbox' | 'name' | 'status' | 'added' | 'trigger' | 'edit';
export type SortableWorkflowTableColumn = Exclude< WorkflowTableColumn, 'checkbox' | 'edit' >;

export type SortDirection = 'ascending' | 'descending';
