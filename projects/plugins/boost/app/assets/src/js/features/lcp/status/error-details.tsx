import FoldingElement from '$features/critical-css/folding-element/folding-element';
import { recordBoostEvent } from '$lib/utils/analytics';
import { getRedirectUrl, Notice } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useLcpState } from '../lib/stores/lcp-state';
import { LcpErrorDetails } from '../lib/stores/lcp-state-types';
import styles from './error-details.module.scss';

type PageErrorProps = {
	url: string;
	error: LcpErrorDetails;
};

const PageError = ( { url, error }: PageErrorProps ) => {
	const getErrorLabel = ( { type, meta }: LcpErrorDetails ) => {
		if ( type === 'http-error' ) {
			return createInterpolateElement(
				sprintf(
					/* translators: %d is the HTTP Status Code */
					__(
						'Boost encountered an HTTP error <b>%d</b> when attempting to analyze this page. Please make sure it loads correctly in incognito mode, and try again.',
						'jetpack-boost'
					),
					meta?.code ?? 'unknown'
				),
				{
					b: <strong />,
				}
			);
		}

		if ( type === 'lcp-timeout' ) {
			return __(
				'The page took too long to load during analysis. Please make sure the page loads correctly in incognito mode, and try again.',
				'jetpack-boost'
			);
		}

		if ( type === 'lcp-metric-timeout' ) {
			return __(
				"Boost couldn't identify the main LCP element within the time limit. This may happen with slow-loading, or complex pages.",
				'jetpack-boost'
			);
		}

		if ( type === 'element-not-unique' ) {
			return sprintf(
				/* translators: %s is the HTML selector */
				__(
					'Boost was unable to identify the main LCP element on the page, due to multiple similar large elements with the same selector (%s).',
					'jetpack-boost'
				),
				meta?.selector ?? 'unknown'
			);
		}

		return __(
			'Something went wrong while optimizing this page. Please try again later, or contact support if the issue persists.',
			'jetpack-boost'
		);
	};

	return (
		<li className={ styles.summary__row }>
			{ getErrorLabel( error ) } ({ url }){ ' ' }
			<ExternalLink
				href={ getRedirectUrl( 'jetpack-boost-lcp-errors', {
					anchor: error?.type,
				} ) }
				onClick={ () => {
					recordBoostEvent( 'lcp_learn_more', {
						error_type: error?.type,
					} );
				} }
			>
				{ __( 'Learn more', 'jetpack-boost' ) }
			</ExternalLink>
		</li>
	);
};

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

	const pagesWithErrors = pages.filter( page => ( page?.errors?.length || 0 ) > 0 );
	if ( pagesWithErrors.length === 0 ) {
		return null;
	}

	const errorMessages = pagesWithErrors.flatMap(
		page => page.errors?.map( error => ( { error, url: page.url } ) ) || []
	);

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
					{ errorMessages.map( ( { error, url }, index ) => (
						<PageError url={ url } error={ error } key={ index } />
					) ) }
				</ul>
			</FoldingElement>
		</Notice>
	);
};
