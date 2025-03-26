import { IconTooltip, Spinner, Text, useBreakpointMatch } from '@automattic/jetpack-components';
import { ThreatSeverityBadge } from '@automattic/jetpack-scan';
import { ExternalLink } from '@wordpress/components';
import { dateI18n } from '@wordpress/date';
import { createInterpolateElement } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import { Icon, check, chevronDown, chevronUp } from '@wordpress/icons';
import clsx from 'clsx';
import React, { useState, useCallback, useContext, useMemo } from 'react';
import { PAID_PLUGIN_SUPPORT_URL } from '../../constants';
import useFixers from '../../hooks/use-fixers';
import styles from './styles.module.scss';

// Extract context provider for clarity and reusability
const PaidAccordionContext = React.createContext();

// Component for displaying threat dates
const ScanHistoryDetails = ( { firstDetected, fixedOn, status } ) => {
	const statusText = useMemo( () => {
		if ( status === 'fixed' ) {
			return sprintf(
				/* translators: %s: Fixed on date */
				__( 'Threat fixed %s', 'jetpack-protect' ),
				dateI18n( 'M j, Y', fixedOn )
			);
		}
		if ( status === 'ignored' ) {
			return __( 'Threat ignored', 'jetpack-protect' );
		}
		return null;
	}, [ status, fixedOn ] );

	return (
		firstDetected && (
			<>
				<Text className={ styles[ 'accordion-header-status' ] }>
					{ sprintf(
						/* translators: %s: First detected date */
						__( 'Threat found %s', 'jetpack-protect' ),
						dateI18n( 'M j, Y', firstDetected )
					) }
					{ statusText && (
						<>
							<span className={ styles[ 'accordion-header-status-separator' ] }></span>
							<span className={ styles[ `is-${ status }` ] }>{ statusText }</span>
						</>
					) }
				</Text>
				{ [ 'fixed', 'ignored' ].includes( status ) && <StatusBadge status={ status } /> }
			</>
		)
	);
};

// Badge for displaying the status (fixed or ignored)
const StatusBadge = ( { status } ) => (
	<div className={ `${ styles[ 'status-badge' ] } ${ styles[ status ] }` }>
		{ status === 'fixed'
			? __( 'Fixed', 'jetpack-protect' )
			: __( 'Ignored', 'jetpack-protect', /* dummy arg to avoid bad minification */ 0 ) }
	</div>
);

const renderFixerStatus = ( isActiveFixInProgress, isStaleFixInProgress ) => {
	if ( isStaleFixInProgress ) {
		return (
			<IconTooltip
				className={ styles[ 'icon-tooltip' ] }
				iconClassName={ styles[ 'icon-tooltip__icon' ] }
				iconSize={ 20 }
				placement={ 'top' }
				hoverShow={ true }
			>
				<Text className={ styles[ 'icon-tooltip__content' ] }>
					{ createInterpolateElement(
						__(
							'The fixer is taking longer than expected. Please try again or <supportLink>contact support</supportLink>.',
							'jetpack-protect'
						),
						{
							supportLink: (
								<ExternalLink
									className={ styles[ 'support-link' ] }
									href={ PAID_PLUGIN_SUPPORT_URL }
								/>
							),
						}
					) }
				</Text>
			</IconTooltip>
		);
	}

	if ( isActiveFixInProgress ) {
		return <Spinner color="black" />;
	}

	return <Icon icon={ check } className={ styles[ 'icon-check' ] } size={ 28 } />;
};

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
	const { open, setOpen } = useContext( PaidAccordionContext );
	const isOpen = open === id;

	const { isThreatFixInProgress, isThreatFixStale } = useFixers();

	const handleClick = useCallback( () => {
		if ( ! isOpen ) {
			onOpen?.();
		}
		setOpen( current => ( current === id ? null : id ) );
	}, [ isOpen, onOpen, setOpen, id ] );

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
						variant={ isOpen ? 'title-small' : 'body' }
					>
						{ title }
					</Text>
					{ [ 'fixed', 'ignored' ].includes( status ) && (
						<ScanHistoryDetails
							firstDetected={ firstDetected }
							fixedOn={ fixedOn }
							status={ status }
						/>
					) }
				</div>
				<div>
					<ThreatSeverityBadge severity={ severity } />
				</div>
				{ ! hideAutoFixColumn && fixable && (
					<div>
						{ renderFixerStatus( isThreatFixInProgress( id ), isThreatFixStale( id ) ) }
						{ isSmall && <span>{ __( 'Auto-fix', 'jetpack-protect' ) }</span> }
					</div>
				) }
				<div className={ styles[ 'accordion-header-button' ] }>
					<Icon icon={ isOpen ? chevronUp : chevronDown } size={ 38 } />
				</div>
			</button>
			<div
				className={ clsx( styles[ 'accordion-body' ], {
					[ styles[ 'accordion-body-open' ] ]: isOpen,
					[ styles[ 'accordion-body-close' ] ]: ! isOpen,
				} ) }
				aria-hidden={ ! isOpen }
			>
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
