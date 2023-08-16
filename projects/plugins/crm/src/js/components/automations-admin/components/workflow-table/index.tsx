import { __ } from '@wordpress/i18n';
import { Workflow } from '../../types';
import { Checkbox } from '../checkbox';
import { WorkflowRow } from '../workflow-row';
import styles from './styles.module.scss';

type WorkflowTableProps = {
	workflows: Workflow[];
};

export const WorkflowTable: React.FC< WorkflowTableProps > = props => {
	const { workflows } = props;

	return (
		<table className={ styles.table }>
			<tr className={ styles[ 'header-row' ] }>
				<th className={ styles.header }>
					<Checkbox id="decorative-checkbox" decorative />
				</th>
				<th className={ styles.header }>{ __( 'Name', 'zero-bs-crm' ) }</th>
				<th className={ styles.header }>{ __( 'Status', 'zero-bs-crm' ) }</th>
				<th className={ styles.header }>{ __( 'Added', 'zero-bs-crm' ) }</th>
				<th className={ styles.header }>{ __( 'Trigger', 'zero-bs-crm' ) }</th>
				<th className={ styles.header }>{ __( 'Edit', 'zero-bs-crm' ) }</th>
			</tr>
			{ workflows.map( workflow => (
				<WorkflowRow workflow={ workflow } />
			) ) }
		</table>
	);
};
