/**
 * External dependencies
 */
import React from 'react';
import { Text } from '@automattic/jetpack-components';
import { Icon, chevronDown, chevronUp } from '@wordpress/icons';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import styles from './styles.module.scss';

export const AccordionItem = ( { title, label, icon, children } ) => {
	const open = false;
	const bodyClassNames = classNames( styles[ 'accordion-body' ], {
		[ styles[ 'accordion-body-open' ] ]: open,
	} );

	return (
		<div className={ styles[ 'accordion-item' ] }>
			<div className={ styles[ 'accordion-header' ] } role="button">
				<div>
					<Text className={ styles[ 'accordion-header-title' ] } mb={ 1 }>
						<Icon icon={ icon } className={ styles[ 'accordion-header-title-icon' ] } />
						{ label }
					</Text>
					<Text>{ title }</Text>
				</div>
				<div className={ styles[ 'accordion-header-button' ] }>
					<Icon icon={ open ? chevronUp : chevronDown } size={ 38 } />
				</div>
			</div>
			<div className={ bodyClassNames }>{ children }</div>
		</div>
	);
};

const Accordion = ( { children } ) => {
	return <div className={ styles.accordion }>{ children }</div>;
};

export default Accordion;
