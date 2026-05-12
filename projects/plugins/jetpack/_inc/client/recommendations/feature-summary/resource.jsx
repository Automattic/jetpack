import { Link } from '@wordpress/ui';
import { useCallback } from 'react';
import { connect } from 'react-redux';
import Button from 'components/button';
import analytics from 'lib/analytics';
import { stepToRoute } from 'state/recommendations';
import { getSummaryResourceProps } from '../feature-utils';
import './style.scss';

const ResourceSummaryComponent = props => {
	const { displayName, ctaLabel, ctaLink, resourceSlug, stepRoute } = props;
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
			</Button>
			<div className="jp-recommendations-feature-summary__actions">
				<div className="jp-recommendations-feature-summary__cta">
					<Link
						openInNewTab
						type="button"
						className="dops-button is-rna"
						href={ ctaLink }
						onClick={ onLearnMoreClick }
					>
						{ ctaLabel }
					</Link>
				</div>
			</div>
		</div>
	);
};

const ResourceSummary = connect( ( state, ownProps ) => ( {
	...getSummaryResourceProps( state, ownProps.resourceSlug ),
	stepRoute: stepToRoute[ ownProps.resourceSlug ],
} ) )( ResourceSummaryComponent );

export { ResourceSummary };
