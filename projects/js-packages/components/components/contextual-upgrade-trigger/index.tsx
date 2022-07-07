import { Icon, arrowRight } from '@wordpress/icons';
import Text from '../text';
import styles from './style.module.scss';
import { CutBaseProps } from './types';
import type React from 'react';

const ContextualUpgradeTrigger: React.FC< CutBaseProps > = ( { description, cta, onClick } ) => {
	return (
		<button className={ styles.cut } onClick={ onClick } role="link">
			<div>
				<Text>{ description }</Text>
				<Text className={ styles.cta }>{ cta }</Text>
			</div>
			<Icon icon={ arrowRight } className={ styles.icon } size={ 30 } />
		</button>
	);
};

export default ContextualUpgradeTrigger;
