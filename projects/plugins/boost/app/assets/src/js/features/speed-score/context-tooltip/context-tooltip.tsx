import { IconTooltip } from '@automattic/jetpack-components';
import GradeExplanation from '../../../../../../../_inc/overview/grade-explanation';
import styles from './context-tooltip.module.scss';

const ContextTooltip = () => {
	return (
		<IconTooltip
			title=""
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
