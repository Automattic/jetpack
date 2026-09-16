import { ToggleControl } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import styles from './module.module.scss';
import type { ReactNode } from 'react';

type ModuleRowProps = {
	label: ReactNode;
	description: ReactNode;
	children?: ReactNode;
	testId?: string;
	toggle?: {
		className?: string;
		checked: boolean;
		disabled?: boolean;
		onChange: ( checked: boolean ) => void;
	};
};

/**
 * A module inside a modern Settings group card: a toggle with its label, then
 * the description and any extra controls indented to the label.
 *
 * @param props             - Component props.
 * @param props.label       - Toggle label, or the heading when there is no toggle.
 * @param props.description - Copy shown under the label.
 * @param props.children    - Extra controls shown under the description.
 * @param props.testId      - `data-testid` for the row.
 * @param props.toggle      - Toggle state; omit to render a heading instead.
 */
const ModuleRow = ( { label, description, children, testId, toggle }: ModuleRowProps ) => (
	<div className={ styles.row } data-testid={ testId }>
		{ toggle ? (
			<ToggleControl
				className={ toggle.className }
				label={ label }
				checked={ toggle.checked }
				disabled={ toggle.disabled }
				onChange={ toggle.onChange }
				__nextHasNoMarginBottom={ true }
			/>
		) : (
			<h3 className={ styles[ 'row-title' ] }>{ label }</h3>
		) }
		<Stack direction="column" gap="md" className={ styles[ 'row-body' ] }>
			<div className={ styles[ 'row-description' ] }>{ description }</div>
			{ children }
		</Stack>
	</div>
);

export default ModuleRow;
