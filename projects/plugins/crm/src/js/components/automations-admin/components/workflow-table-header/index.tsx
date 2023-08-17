import { __ } from '@wordpress/i18n';
import { chevronDown, chevronUp } from '@wordpress/icons';
import { Checkbox } from '../checkbox';
import { SortDirection, WorkflowTableColumn } from '../workflow-table/types';
import styles from './styles.module.scss';

type WorkflowTableHeaderProps = {
	column: WorkflowTableColumn;
	onClick?: React.MouseEventHandler;
	selectedForSort?: boolean;
	sortDirection?: SortDirection;
};

export const WorkflowTableHeader: React.FC< WorkflowTableHeaderProps > = props => {
	const { column, onClick, selectedForSort, sortDirection } = props;

	const columnNames: Record< WorkflowTableColumn, React.ReactNode > = {
		checkbox: <Checkbox id="decorative-checkbox" decorative />,
		name: __( 'Name', 'zero-bs-crm' ),
		status: __( 'Status', 'zero-bs-crm' ),
		added: __( 'Added', 'zero-bs-crm' ),
		trigger: __( 'Trigger', 'zero-bs-crm' ),
		edit: __( 'Edit', 'zero-bs-crm' ),
	};

	return (
		<th className={ styles.header } onClick={ onClick }>
			<div className={ styles.container }>
				<div className={ styles.text }>{ columnNames[ column ] }</div>
				{ selectedForSort && (
					<div className={ styles.chevron }>
						{ 'ascending' === sortDirection ? chevronDown : chevronUp }
					</div>
				) }
			</div>
		</th>
	);
};
