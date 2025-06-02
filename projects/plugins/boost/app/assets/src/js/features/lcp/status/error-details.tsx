import FoldingElement from '$features/critical-css/folding-element/folding-element';
import { recordBoostEvent } from '$lib/utils/analytics';
import { Notice } from '@automattic/jetpack-components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useLcpState } from '../lib/stores/lcp-state';
import styles from './error-details.module.scss';

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

	const errorMessages = errors.flatMap( p => ( p.errors || [] ).map( e => e.message ) );

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
