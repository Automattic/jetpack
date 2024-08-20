import { Spinner, Text, useBreakpointMatch } from '@automattic/jetpack-components';
import { dateI18n } from '@wordpress/date';
import { sprintf, __ } from '@wordpress/i18n';
import { Icon, check, chevronDown, chevronUp } from '@wordpress/icons';
import clsx from 'clsx';
import React, { useState, useCallback, useContext } from 'react';
import useFixers from '../../hooks/use-fixers';
import ThreatSeverityBadge from '../severity';
import styles from './styles.module.scss';

const PaidAccordionContext = React.createContext();

const ScanHistoryDetails = ( { detectedAt, fixedOn, status } ) => {
	return (
		<>
			{ detectedAt && (
				<Text className={ styles[ 'accordion-header-status' ] }>
					{ sprintf(
						/* translators: %s: First detected date */
						__( 'Threat found %s', 'jetpack-protect' ),
						dateI18n( 'M j, Y', detectedAt )
					) }
					{ 'fixed' === status && (
						<>
							<span className={ styles[ 'accordion-header-status-separator' ] }></span>
							<span className={ styles[ 'is-fixed' ] }>
								{ sprintf(
									/* translators: %s: Fixed on date */
									__( 'Threat fixed %s', 'jetpack-protect' ),
									dateI18n( 'M j, Y', fixedOn )
								) }
							</span>
						</>
					) }
					{ 'ignored' === status && (
						<>
							<span className={ styles[ 'accordion-header-status-separator' ] }></span>
							<span className={ styles[ 'is-ignored' ] }>
								{ __( 'Threat ignored', 'jetpack-protect' ) }
							</span>
						</>
					) }
				</Text>
			) }
			{ ( 'fixed' === status || 'ignored' === status ) && (
				<StatusBadge status={ 'fixed' === status ? 'fixed' : 'ignored' } />
			) }
		</>
	);
};

const StatusBadge = ( { status } ) => (
	<div className={ `${ styles[ 'status-badge' ] } ${ styles[ status ] }` }>
		{ 'fixed' === status
			? __( 'Fixed', 'jetpack-protect' )
			: __( 'Ignored', 'jetpack-protect', /* dummy arg to avoid bad minification */ 0 ) }
	</div>
);

export const PaidAccordionItem = ( {
	id,
	title,
	label,
	icon,
	fixable,
	severity,
	children,
	firstDetected,
	fixedOn,
	onOpen,
	status,
	hideAutoFixColumn = false,
} ) => {
	const accordionData = useContext( PaidAccordionContext );
	const open = accordionData?.open === id;
	const setOpen = accordionData?.setOpen;

	const bodyClassNames = clsx( styles[ 'accordion-body' ], {
		[ styles[ 'accordion-body-open' ] ]: open,
		[ styles[ 'accordion-body-close' ] ]: ! open,
	} );

	const { fixersStatus } = useFixers();

	const handleClick = useCallback( () => {
		if ( ! open ) {
			onOpen?.();
		}
		setOpen( current => {
			return current === id ? null : id;
		} );
	}, [ open, onOpen, setOpen, id ] );

	const [ isSmall ] = useBreakpointMatch( [ 'sm', 'lg' ], [ null, '<' ] );

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
					{ ( 'fixed' === status || 'ignored' === status ) && (
						<ScanHistoryDetails
							detectedAt={ firstDetected }
							status={ status }
							fixedAt={ fixedOn }
						/>
					) }
				</div>
				<div>
					<ThreatSeverityBadge severity={ severity } />
				</div>
				{ ! hideAutoFixColumn && (
					<div>
						{ fixable && (
							<>
								{ fixersStatus?.[ id ]?.status === 'in_progress' ? (
									<Spinner color="black" />
								) : (
									<Icon icon={ check } className={ styles[ 'icon-check' ] } size={ 28 } />
								) }
								{ isSmall && <span>{ __( 'Auto-fix', 'jetpack-protect' ) }</span> }
							</>
						) }
					</div>
				) }
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
