import { Spinner, Text, useBreakpointMatch } from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Icon, check, chevronDown, chevronUp } from '@wordpress/icons';
import clsx from 'clsx';
import React, { useState, useCallback, useContext } from 'react';
import { STORE_ID } from '../../state/store';
import ThreatSeverityBadge from '../severity';
import styles from './styles.module.scss';

const PaidAccordionContext = React.createContext();

export const PaidAccordionItemFrame = ( {
	id,
	children,
	fixable,
	icon,
	label,
	onOpen,
	severity,
	threatsAreFixing,
	title,
} ) => {
	const accordionData = useContext( PaidAccordionContext );
	const open = accordionData?.open === id;
	const setOpen = accordionData?.setOpen;

	const [ isSmall ] = useBreakpointMatch( [ 'sm', 'lg' ], [ null, '<' ] );

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
				<div>
					<ThreatSeverityBadge severity={ severity } />
				</div>
				<div>
					{ fixable && (
						<>
							{ threatsAreFixing.indexOf( id ) >= 0 ? (
								<Spinner color="black" />
							) : (
								<Icon icon={ check } className={ styles[ 'icon-check' ] } size={ 28 } />
							) }
							{ isSmall && <span>{ __( 'Auto-fix', 'jetpack-protect' ) }</span> }
						</>
					) }
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

export const PaidAccordionItem = ( {
	children,
	fixable,
	icon,
	id,
	label,
	onOpen,
	severity,
	title,
} ) => {
	const threatsAreFixing = useSelect( select => select( STORE_ID ).getThreatsAreFixing() );

	return (
		<PaidAccordionItemFrame
			fixable={ fixable }
			onOpen={ onOpen }
			icon={ icon }
			label={ label }
			open={ open }
			severity={ severity }
			threatsAreFixing={ threatsAreFixing }
			title={ title }
			id={ id }
		>
			{ children }
		</PaidAccordionItemFrame>
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
