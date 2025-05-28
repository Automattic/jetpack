import { Button } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useState, type FunctionComponent } from 'react';
import { useLcpState } from '../lib/stores/lcp-state';
import styles from './error-details.module.scss';

interface ErrorTooltipProps {
	errors: string[];
}

export const ErrorDetails = () => {
	const [ query ] = useLcpState();
	const lcpState = query?.data;

	if ( lcpState?.status !== 'analyzed' ) {
		return null;
	}

	const pages = lcpState?.pages;
	if ( ! pages || pages.length === 0 ) {
		return null;
	}

	const errors = pages.filter( page => ( page?.errors?.length || 0 ) > 0 );
	if ( errors.length === 0 ) {
		return null;
	}

	const errorMessages = errors.flatMap( p => p.errors );

	return (
		<div className={ styles.summary }>
			{ createInterpolateElement(
				sprintf(
					// translators: %d is a number of pages which failed to be optimized
					_n(
						'%d page could not be optimized. <errorDetails />',
						'%d pages could not be optimized. <errorDetails />',
						errorMessages.length,
						'jetpack-boost'
					),
					errorMessages.length
				),
				{
					errorDetails: <ErrorDetailsTooltip />,
				}
			) }
		</div>
	);
};

export const ErrorDetailsTooltip = () => {
	const [ isVisible, setIsVisible ] = useState( false );
	const [ query ] = useLcpState();
	const lcpState = query?.data;

	if ( lcpState?.status !== 'analyzed' ) {
		return null;
	}

	const pages = lcpState?.pages;
	if ( ! pages || pages.length === 0 ) {
		return null;
	}

	const errors = pages.filter( page => ( page?.errors?.length || 0 ) > 0 );
	if ( errors.length === 0 ) {
		return null;
	}

	const errorMessages = errors.flatMap( p => ( p.errors || [] ).map( e => e.message ) );

	return (
		<div className={ styles[ 'error-tooltip-wrapper' ] }>
			<Button
				className={ styles[ 'optimize-button' ] }
				variant="link"
				size="small"
				weight="regular"
				onClick={ () => setIsVisible( ! isVisible ) }
				aria-expanded={ isVisible }
			>
				{ __( 'View details', 'jetpack-boost' ) }
			</Button>
			{ isVisible && <ErrorTooltip errors={ errorMessages } /> }
		</div>
	);
};

export const ErrorTooltip: FunctionComponent< ErrorTooltipProps > = ( { errors } ) => {
	if ( ! errors || errors.length === 0 ) {
		return null;
	}

	return (
		<div className={ styles[ 'jb-error-tooltip' ] }>
			<div className={ styles[ 'jb-error-tooltip__header' ] }>
				{ __( 'Optimization Details', 'jetpack-boost' ) }
			</div>
			<hr />
			<ul>
				{ errors.map( ( error, index ) => (
					<li key={ index } className={ styles[ 'jb-error-tooltip__row' ] }>
						{ error }
					</li>
				) ) }
			</ul>
			<div className={ styles[ 'jb-error-tooltip__pointer' ] }></div>
		</div>
	);
};
