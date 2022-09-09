import { Icon, arrowRight } from '@wordpress/icons';
import classnames from 'classnames';
import Text from '../text';
import styles from './style.module.scss';
import { CutBaseProps } from './types';
import type React from 'react';

const ContextualUpgradeTrigger: React.FC< CutBaseProps > = ( {
	description,
	cta,
	onClick,
	href,
	className,
} ) => {
	const Tag = href !== undefined ? 'a' : 'button';
	const tagProps = Tag === 'a' ? { href, target: '_blank' } : { onClick };

	return (
		<div className={ classnames( styles.cut, className ) }>
			<div>
				<Text>{ description }</Text>
				<Tag { ...tagProps }>
					<Text className={ styles.cta }>{ cta }</Text>
				</Tag>
			</div>
			<Icon icon={ arrowRight } className={ styles.icon } size={ 30 } />
		</div>
	);
};

export default ContextualUpgradeTrigger;
