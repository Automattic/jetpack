/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import { ExternalLink } from '@wordpress/components';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { mapStateToSummaryResourceProps } from '../feature-utils';
import analytics from 'lib/analytics';

/**
 * Style dependencies
 */
import './style.scss';
import { __ } from '@wordpress/i18n';

const ResourceSummaryComponent = props => {
	const { displayName, ctaLabel, ctaLink, resourceSlug, isNew } = props;

	const onLearnMoreClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_learn_more_click', {
			feature: resourceSlug,
		} );
	}, [ resourceSlug ] );

	return (
		<div className="jp-recommendations-feature-summary">
			<div className="jp-recommendations-feature-summary__display-name">
				{ displayName }
				{ isNew && (
					/* translators: 'New' is shown as a badge to indicate that this content has not been viewed before. */
					<span className="jp-recommendations__new-badge">{ __( 'New', 'jetpack' ) }</span>
				) }
			</div>
			<div className="jp-recommendations-feature-summary__actions">
				<div className="jp-recommendations-feature-summary__cta">
					<ExternalLink
						type="button"
						className="dops-button is-rna"
						href={ ctaLink }
						onClick={ onLearnMoreClick }
					>
						{ ctaLabel }
					</ExternalLink>
				</div>
			</div>
		</div>
	);
};

const ResourceSummary = connect( ( state, ownProps ) => ( {
	...mapStateToSummaryResourceProps( state, ownProps.resourceSlug ),
} ) )( ResourceSummaryComponent );

export { ResourceSummary };
