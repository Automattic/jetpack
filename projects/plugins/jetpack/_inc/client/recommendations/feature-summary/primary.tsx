import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { getSummaryPrimaryProps } from '../feature-utils';

const SummaryTextLink = ( { href, label, onInterceptHref } ) => {
	const handleOnClick = useCallback(
		e => {
			if ( onInterceptHref ) {
				e.preventDefault();
				onInterceptHref().then( () => {
					open( href, '_blank' );
				} );
			}
		},
		[ href, onInterceptHref ]
	);

	return (
		<a
			rel="noreferrer"
			target="_blank"
			href={ href }
			onClick={ handleOnClick }
			className="jp-summary-text-link"
		>
			{ label }
			<span className="jp-summary-text-link__icon dashicons dashicons-arrow-right-alt2"></span>
		</a>
	);
};

const PrimarySummaryComponent = props => {
	const { displayName, ctaLabel, ctaLink, onInterceptHref } = props;

	return (
		<div className="jp-recommendations-feature-summary is-primary">
			<span className="jp-recommendations-feature-summary__display-name">{ displayName }</span>
			<div className="jp-recommendations-feature-summary__actions">
				<div className="jp-recommendations-feature-summary__cta">
					<SummaryTextLink
						href={ ctaLink }
						label={ ctaLabel }
						onInterceptHref={ onInterceptHref }
					/>
				</div>
			</div>
		</div>
	);
};

const PrimarySummary = connect( ( state, ownProps ) => ( {
	...getSummaryPrimaryProps( state, ownProps.slug ),
} ) )( PrimarySummaryComponent );

export { PrimarySummary };
