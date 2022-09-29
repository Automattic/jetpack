import { Text } from '@automattic/jetpack-components';
import { Icon, check, chevronDown, chevronUp } from '@wordpress/icons';
import classNames from 'classnames';
import React, { useState, useCallback, useContext } from 'react';
import ThreatSeverityBadge from '../severity';
import styles from './styles.module.scss';

const PaidAccordionContext = React.createContext();

export const PaidAccordionItem = ( { id, title, label, icon, children, onOpen } ) => {
	const accordionData = useContext( PaidAccordionContext );
	const open = accordionData?.open === id;
	const setOpen = accordionData?.setOpen;

	const bodyClassNames = classNames( styles[ 'accordion-body' ], {
		[ styles[ 'accordion-body-open' ] ]: open,
		[ styles[ 'accordion-body-close' ] ]: ! open,
	} );

	const handleClick = useCallback( () => {
		if ( ! open ) {
			onOpen?.();
		}
		setOpen( current => {
			return current === id ? null : id;
		} );
	}, [ open, onOpen, setOpen, id ] );

	// Rig these up properly if we find its worth it
	// Update once we have access to severity value
	// const hasRequiredPlan = true;
	const isFixable = true;

	return (
		<div className={ styles[ 'accordion-item' ] }>
			<button className={ styles[ 'accordion-header' ] } onClick={ handleClick }>
				<div>
					<Text className={ styles[ 'accordion-header-label' ] } mb={ 1 }>
						<Icon icon={ icon } className={ styles[ 'accordion-header-label-icon' ] } />
						{ label }
					</Text>
					<Text
						className={ styles[ 'accordion-header-text' ] }
						variant={ open ? 'title-small' : 'body' }
					>
						{ title }
					</Text>
				</div>
				<div>
					<ThreatSeverityBadge severity={ 5 } />
				</div>
				<div>
					{ isFixable && <Icon icon={ check } className={ styles[ 'icon-check' ] } size={ 28 } /> }
				</div>
				<div className={ styles[ 'accordion-header-button' ] }>
					<Icon icon={ open ? chevronUp : chevronDown } size={ 38 } />
				</div>
			</button>
			<div className={ bodyClassNames } aria-hidden={ open ? 'false' : 'true' }>
				{ children }
			</div>
		</div>
	);
};

const PaidAccordion = ( { children } ) => {
	const [ open, setOpen ] = useState();

	return (
		<PaidAccordionContext.Provider value={ { open, setOpen } }>
			<div className={ styles.accordion }>{ children }</div>
		</PaidAccordionContext.Provider>
	);
};

export default PaidAccordion;
