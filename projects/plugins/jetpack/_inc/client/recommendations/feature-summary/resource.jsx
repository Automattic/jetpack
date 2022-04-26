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
import { stepToRoute } from 'state/recommendations';
import analytics from 'lib/analytics';

/**
 * Style dependencies
 */
import './style.scss';
import { __ } from '@wordpress/i18n';
import Button from 'components/button';

const ResourceSummaryComponent = props => {
	const { displayName, ctaLabel, ctaLink, resourceSlug, isNew, stepRoute } = props;

	const onLearnMoreClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_learn_more_click', {
			feature: resourceSlug,
		} );
	}, [ resourceSlug ] );

	const onStepNameClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_step_name_click', {
			feature: resourceSlug,
		} );
	}, [ resourceSlug ] );

	return (
		<div className="jp-recommendations-feature-summary">
			<Button
				borderless
				href={ stepRoute }
				onClick={ onStepNameClick }
				className="jp-recommendations-feature-summary__display-name"
			>
				<span className="jp-recommendations-feature-summary__display-name-text">
					{ displayName }
				</span>
				{ isNew && (
					/* translators: 'New' is shown as a badge to indicate that this content has not been viewed before. */
					<span className="jp-recommendations__new-badge">{ __( 'New', 'jetpack' ) }</span>
				) }
			</Button>
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
	stepRoute: stepToRoute[ ownProps.resourceSlug ],
} ) )( ResourceSummaryComponent );

export { ResourceSummary };
