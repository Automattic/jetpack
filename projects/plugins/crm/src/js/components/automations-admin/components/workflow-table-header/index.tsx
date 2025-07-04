import { dispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { chevronDown, chevronUp } from '@wordpress/icons';
import clsx from 'clsx';
import { useCallback } from 'react';
import { store } from 'crm/state/store';
import { Checkbox } from '../checkbox';
import { SortDirection, WorkflowTableColumn } from '../workflow-table/types';
import styles from './styles.module.scss';
import type { ChangeEvent, FC, MouseEventHandler, ReactNode } from 'react';

type WorkflowTableHeaderProps = {
	column: WorkflowTableColumn;
	onClick?: MouseEventHandler;
	selectedForSort?: boolean;
	sortDirection?: SortDirection;
};

export const WorkflowTableHeader: FC< WorkflowTableHeaderProps > = props => {
	const { column, onClick, selectedForSort, sortDirection } = props;

	const onCheckboxChange = useCallback( ( event: ChangeEvent< HTMLInputElement > ) => {
		const checked = event.target.checked;
		checked ? dispatch( store ).selectAllWorkflows() : dispatch( store ).deselectAllWorkflows();
	}, [] );

	const columnNames: Record< WorkflowTableColumn, ReactNode > = {
		checkbox: <Checkbox onChange={ onCheckboxChange } id="header-checkbox" />,
		name: __( 'Name', 'zero-bs-crm' ),
		status: __( 'Status', 'zero-bs-crm' ),
		added: __( 'Added', 'zero-bs-crm' ),
		trigger: __( 'Trigger', 'zero-bs-crm' ),
		edit: __( 'Edit', 'zero-bs-crm' ),
	};

	return (
		<th
			className={ clsx( styles.header, { [ styles.clickable ]: !! onClick } ) }
			onClick={ onClick }
		>
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
