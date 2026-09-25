import { IconTooltip } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import GradeExplanation from '../../../../../../../_inc/overview/grade-explanation';
import styles from './context-tooltip.module.scss';

const ContextTooltip = () => {
	return (
		<IconTooltip
			title=""
			label={ __( 'How the overall grade is calculated', 'jetpack-boost' ) }
			placement={ 'bottom' }
			className={ styles.tooltip }
			iconSize={ 22 }
			wide={ true }
		>
			<GradeExplanation tableClassName={ styles.table } />
		</IconTooltip>
	);
};

export default ContextTooltip;
