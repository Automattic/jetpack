import FoldingElement from '$features/critical-css/folding-element/folding-element';
import { recordBoostEvent } from '$lib/utils/analytics';
import { Notice } from '@automattic/jetpack-components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useLcpState } from '../lib/stores/lcp-state';
import styles from './error-details.module.scss';

export const ErrorDetails = () => {
	const dictionary = {
		unknown: __(
			'Something went wrong while optimizing this page. Please try again later, or contact support if the issue persists.',
			'jetpack-boost'
		),
		'element-not-unique': __(
			'This page has multiple similar large elements, making it difficult to determine which one to optimize. Manual optimization may be needed.',
			'jetpack-boost'
		),
		'http-error': __(
			"We couldn't access this page due to a connection issue. Please check that the page is publicly accessible and try again.",
			'jetpack-boost'
		),
		'lcp-timeout': __(
			'The page took too long to load during optimization. Please check that the page is publicly accessible and try again.',
			'jetpack-boost'
		),
		'lcp-metric-timeout': __(
			"We couldn't identify the main LCP element within the time limit. This may happen with slow-loading or complex pages.",
			'jetpack-boost'
		),
	};

	const [ query ] = useLcpState();
	const lcpState = query?.data;

	if ( lcpState?.status !== 'analyzed' ) {
		return null;
	}

	const pages = lcpState?.pages;
	if ( ! pages || pages.length === 0 ) {
		return null;
	}

	const pagesWithErrors = pages.filter( page => ( page?.errors?.length || 0 ) > 0 );
	if ( pagesWithErrors.length === 0 ) {
		return null;
	}

	const errorMessages: string[] = [];

	pagesWithErrors.forEach( page => {
		page.errors?.forEach( error => {
			if ( error?.type ) {
				errorMessages.push( `${ dictionary[ error?.type ] } (${ page.url })` );
			}
		} );
	} );

	return (
		<Notice
			level="warning"
			hideCloseButton={ true }
			title={ __( 'LCP Optimization issues', 'jetpack-boost' ) }
		>
			<div className={ styles.summary }>
				{ sprintf(
					// translators: %d is a number of pages which failed to be optimized
					_n(
						'%d page could not be optimized.',
						'%d pages could not be optimized.',
						errorMessages.length,
						'jetpack-boost'
					),
					errorMessages.length
				) }
			</div>
			<FoldingElement
				labelExpandedText={ __( 'View details', 'jetpack-boost' ) }
				labelCollapsedText={ __( 'Hide details', 'jetpack-boost' ) }
				onExpand={ ( isExpanded: boolean ) => {
					if ( isExpanded ) {
						recordBoostEvent( 'lcp_error_details_expanded', {} );
					}
				} }
			>
				<ul className={ styles.summary__list }>
					{ errorMessages.map( ( error, index ) => (
						<li className={ styles.summary__row } key={ index }>
							{ error }
						</li>
					) ) }
				</ul>
			</FoldingElement>
		</Notice>
	);
};
