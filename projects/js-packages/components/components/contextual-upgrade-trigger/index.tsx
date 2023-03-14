import { Tooltip } from '@wordpress/components';
import { Icon, arrowRight, info } from '@wordpress/icons';
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
	openInNewTab = false,
	className,
	tooltipText = '',
} ) => {
	const Tag = href !== undefined ? 'a' : 'button';
	const tagProps =
		Tag === 'a' ? { href, ...( openInNewTab && { target: '_blank' } ) } : { onClick };

	return (
		<div className={ classnames( styles.cut, className ) }>
			<div>
				<Tag { ...tagProps }>
					<Text>
						{ description }
						{ tooltipText && (
							<>
								<Tooltip position="middle center" text={ tooltipText }>
									<span>
										<Icon icon={ info } size={ 12 } />
									</span>
								</Tooltip>
							</>
						) }
					</Text>
					<Text className={ styles.cta }>{ cta }</Text>
				</Tag>
			</div>
			<Icon icon={ arrowRight } className={ styles.icon } size={ 30 } />
		</div>
	);
};

export default ContextualUpgradeTrigger;
