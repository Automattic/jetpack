import { __, sprintf } from '@wordpress/i18n';
import { StepLabel } from 'crm/components/automations-admin/components/step-label';
import { Trigger } from 'crm/state/automations-admin/types';
import styles from './styles.module.scss';

type TriggerInfoProps = {
	trigger: Trigger;
};

export const TriggerInfo: React.FC< TriggerInfoProps > = ( { trigger } ) => {
	return (
		<div className={ styles.container }>
			<div className={ styles.title }>
				{
					// 	translators: triggerTitle is a string which is used to identify the trigger
					sprintf( __( 'Trigger: %(triggerTitle)s', 'zero-bs-crm' ), {
						triggerTitle: trigger.title,
					} )
				}
			</div>
			{ trigger.description }
			<StepLabel className={ styles[ 'step-label' ] } type={ 'trigger' } />
		</div>
	);
};
