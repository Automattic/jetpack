import { Text } from '@automattic/jetpack-components';
import { Icon, chevronDown, chevronUp } from '@wordpress/icons';
import clsx from 'clsx';
import React, { useState, useCallback, useContext } from 'react';
import styles from './styles.module.scss';

const FreeAccordionContext = React.createContext();

export const FreeAccordionItem = ( { id, title, label, icon, children, onOpen } ) => {
	const accordionData = useContext( FreeAccordionContext );
	const open = accordionData?.open === id;
	const setOpen = accordionData?.setOpen;

	const bodyClassNames = clsx( styles[ 'accordion-body' ], {
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

	return (
		<div className={ styles[ 'accordion-item' ] }>
			<button className={ styles[ 'accordion-header' ] } onClick={ handleClick }>
				<div>
					<Text className={ styles[ 'accordion-header-label' ] } mb={ 1 }>
						<Icon icon={ icon } className={ styles[ 'accordion-header-label-icon' ] } />
						{ label }
					</Text>
					<Text
						className={ styles[ 'accordion-header-description' ] }
						variant={ open ? 'title-small' : 'body' }
					>
						{ title }
					</Text>
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

const FreeAccordion = ( { children } ) => {
	const [ open, setOpen ] = useState();

	return (
		<FreeAccordionContext.Provider value={ { open, setOpen } }>
			<div className={ styles.accordion }>{ children }</div>
		</FreeAccordionContext.Provider>
	);
};

export default FreeAccordion;
