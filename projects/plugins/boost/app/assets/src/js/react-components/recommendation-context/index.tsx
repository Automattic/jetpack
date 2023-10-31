import classNames from 'classnames';
import { ImageCdnRecommendation } from '../image-cdn-recommendation';
import styles from './styles.module.scss';

export const RecommendationContext = () => {
	return (
		<div className={ classNames( styles.wrapper, 'jb-score-context' ) }>
			<span className={ classNames( styles.icon, 'jb-score-context__info-icon' ) }>i</span>
			<div className={ classNames( styles.container, 'jb-score-context__info-container' ) }>
				<ImageCdnRecommendation />
				<i />
			</div>
		</div>
	);
};
