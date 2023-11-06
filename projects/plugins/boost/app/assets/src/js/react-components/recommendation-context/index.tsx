import { IconTooltip } from '@automattic/jetpack-components';
import { ImageCdnRecommendation } from '../image-cdn-recommendation';
import styles from './styles.module.scss';

export const RecommendationContext = () => {
	return (
		<IconTooltip
			title=""
			placement={ 'bottom-end' }
			className={ styles.tooltip }
			iconSize={ 22 }
			offset={ 20 }
			wide={ true }
		>
			<ImageCdnRecommendation />
		</IconTooltip>
	);
};
