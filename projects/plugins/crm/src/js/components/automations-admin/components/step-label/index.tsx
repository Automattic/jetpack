import { _x } from '@wordpress/i18n';
import classNames from 'classnames';
import styles from './styles.module.scss';

type StepLabelProps = {
	type: LabelType;
	className?: string;
};

type LabelType = 'trigger' | 'condition' | 'action';

export const StepLabel: React.FC< StepLabelProps > = ( { type, className } ) => {
	const wrapperClassNames = classNames( styles.label, styles[ `label--${ type }` ], className );
	let label;

	switch ( type ) {
		case 'trigger':
			label = _x( 'Trigger', 'automations', 'zero-bs-crm' );
			break;

		case 'condition':
			label = _x( 'Condition', 'automations', 'zero-bs-crm' );
			break;

		case 'action':
			label = _x( 'Action', 'automations', 'zero-bs-crm' );
			break;

		default:
			return `${ type } is not implemented`;
	}

	return <div className={ wrapperClassNames }>{ label }</div>;
};
