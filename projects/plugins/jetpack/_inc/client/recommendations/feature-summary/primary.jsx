import { ExternalLink } from '@wordpress/components';
import React from 'react';
import { connect } from 'react-redux';
import { getSummaryPrimaryProps } from '../feature-utils';

const PrimarySummaryComponent = props => {
	const { displayName, ctaLabel, ctaLink } = props;
	return (
		<div className="jp-recommendations-feature-summary">
			<span className="jp-recommendations-feature-summary__display-name">{ displayName }</span>
			<div className="jp-recommendations-feature-summary__actions">
				<div className="jp-recommendations-feature-summary__cta">
					<ExternalLink href={ ctaLink }>{ ctaLabel }</ExternalLink>
				</div>
			</div>
		</div>
	);
};

const PrimarySummary = connect( ( _, ownProps ) => ( {
	...getSummaryPrimaryProps( ownProps.slug ),
} ) )( PrimarySummaryComponent );

export { PrimarySummary };
