import { IconTooltip } from '@automattic/jetpack-components';
import ImageCdnRecommendation from '../image-cdn-recommendation';
import styles from './styles.module.scss';

const RecommendationContext = () => {
	return (
		<IconTooltip
			title=""
			placement={ 'bottom' }
			className={ styles.tooltip }
			iconSize={ 22 }
			offset={ 20 }
			wide={ true }
		>
			<ImageCdnRecommendation />
		</IconTooltip>
	);
};

export default RecommendationContext;
