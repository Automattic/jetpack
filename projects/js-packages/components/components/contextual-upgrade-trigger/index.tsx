import { Icon, arrowRight } from '@wordpress/icons';
import clsx from 'clsx';
import IconTooltip from '../icon-tooltip';
import Text from '../text';
import styles from './style.module.scss';
import { CutBaseProps } from './types';
import type React from 'react';

const ContextualUpgradeTrigger: React.FC< CutBaseProps > = ( {
	description,
	cta,
	onClick,
	href,
	openInNewTab = false,
	className,
	tooltipText = '',
} ) => {
	const Tag = href !== undefined ? 'a' : 'button';
	const tagProps =
		Tag === 'a' ? { href, ...( openInNewTab && { target: '_blank' } ) } : { onClick };

	return (
		<div className={ clsx( styles.cut, className ) }>
			<div>
				<div>
					<Text className={ styles.description }>{ description }</Text>
					{ tooltipText && (
						<IconTooltip className={ styles.iconContainer } iconSize={ 16 } offset={ 4 }>
							<Text variant="body-small">{ tooltipText }</Text>
						</IconTooltip>
					) }
				</div>
				<div>
					<Tag { ...tagProps }>
						<Text className={ styles.cta }>{ cta }</Text>
					</Tag>
				</div>
			</div>
			<Icon icon={ arrowRight } className={ styles.icon } size={ 30 } />
		</div>
	);
};

export default ContextualUpgradeTrigger;
