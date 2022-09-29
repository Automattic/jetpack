import React from 'react';
import { connect } from 'react-redux';
import { getSummaryPrimaryProps } from '../feature-utils';

const SummaryTextLink = ( { href, label } ) => (
	<a rel="noreferrer" target="_blank" href={ href } className="jp-summary-text-link">
		{ label }
		<span class="jp-summary-text-link__icon dashicons dashicons-arrow-right-alt2"></span>
	</a>
);

const PrimarySummaryComponent = props => {
	const { displayName, ctaLabel, ctaLink } = props;
	return (
		<div className="jp-recommendations-feature-summary is-primary">
			<span className="jp-recommendations-feature-summary__display-name">{ displayName }</span>
			<div className="jp-recommendations-feature-summary__actions">
				<div className="jp-recommendations-feature-summary__cta">
					<SummaryTextLink href={ ctaLink } label={ ctaLabel } />
				</div>
			</div>
		</div>
	);
};

const PrimarySummary = connect( ( state, ownProps ) => ( {
	...getSummaryPrimaryProps( state, ownProps.slug ),
} ) )( PrimarySummaryComponent );

export { PrimarySummary };
