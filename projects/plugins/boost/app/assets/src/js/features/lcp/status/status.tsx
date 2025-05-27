import { __, _n, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import InfoIcon from '$svg/info';
import { createInterpolateElement, useState } from '@wordpress/element';
import styles from './status.module.scss';
import { useLcpState } from '../lib/stores/lcp-state';
import TimeAgo from '$features/critical-css/time-ago/time-ago';
import { Button } from '@automattic/jetpack-components';
import { ErrorTooltip } from './error-tooltip';

const ErrorDetails = () => {
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

	return createInterpolateElement(
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
	);
};

const ErrorDetailsTooltip = () => {
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

const Status: React.FC = () => {
	const [ query ] = useLcpState();
	const lcpState = query?.data;

	if ( lcpState?.status === 'error' ) {
		return (
			<div className={ styles?.failures }>
				{ __(
					"An error occurred while optimizing your Cornerstone Page's LCP. Please try again.",
					'jetpack-boost'
				) }
			</div>
		);
	}

	if ( lcpState?.status === 'not_analyzed' ) {
		// This should never happen, but just in case.
		return (
			<div>
				{ __(
					"Click the optimize button to start optimizing your Cornerstone Page's LCP.",
					'jetpack-boost'
				) }
			</div>
		);
	}

	if ( lcpState?.status === 'pending' ) {
		return (
			<div className={ styles?.generating }>
				{ __(
					"Jetpack Boost is optimizing your Cornerstone Page's LCP for you.",
					'jetpack-boost'
				) }
			</div>
		);
	}

	if ( lcpState?.status !== 'analyzed' || ! lcpState?.updated ) {
		return null;
	}

	return (
		<>
			<div className={ styles?.successes }>
				{ __( 'Last optimized', 'jetpack-boost' ) }{ ' ' }
				<TimeAgo time={ new Date( lcpState.updated * 1000 ) } />.
			</div>
			{ lcpState?.status === 'analyzed' && (
				<div className={ clsx( 'failures', styles.failures ) }>
					<InfoIcon />

					<ErrorDetails />
				</div>
			) }
		</>
	);
};

export default Status;
