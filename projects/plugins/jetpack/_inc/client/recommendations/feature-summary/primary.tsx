import Button from 'components/button';
import analytics from 'lib/analytics';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { stepToRoute } from 'state/recommendations';
import { getSummaryPrimaryProps } from '../feature-utils';

type SummaryTextLinkProps = {
	href: string;
	label: string;
	onClick: React.MouseEventHandler< HTMLAnchorElement >;
};

const SummaryTextLink = ( { href, label, onClick }: SummaryTextLinkProps ) => {
	return (
		<a
			rel="noreferrer"
			target="_blank"
			href={ href }
			onClick={ onClick }
			className="jp-summary-text-link"
		>
			{ label }
			<span className="jp-summary-text-link__icon dashicons dashicons-arrow-right-alt2"></span>
		</a>
	);
};

type PrimarySummaryComponentProps = {
	slug: string;
	displayName: string;
	ctaLabel: string;
	ctaLink: string;
	stepRoute: string;
	onInterceptHref?: () => Promise< void >;
};

const PrimarySummaryComponent = ( {
	slug,
	displayName,
	ctaLabel,
	ctaLink,
	stepRoute,
	onInterceptHref,
}: PrimarySummaryComponentProps ) => {
	const onStepNameClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_step_name_click', {
			feature: slug,
		} );
	}, [ slug ] );

	const onManageClick = useCallback< React.MouseEventHandler< HTMLAnchorElement > >(
		e => {
			if ( onInterceptHref ) {
				e.preventDefault();
				onInterceptHref().then( () => {
					open( ctaLink, '_blank' );
				} );

				analytics.tracks.recordEvent( 'jetpack_recommendations_summary_intercepted_click', {
					feature: slug,
				} );
			}

			analytics.tracks.recordEvent( 'jetpack_recommendations_summary_manage_click', {
				feature: slug,
			} );
		},
		[ ctaLink, onInterceptHref, slug ]
	);
	return (
		<div className="jp-recommendations-feature-summary is-primary">
			<Button
				href={ stepRoute }
				onClick={ onStepNameClick }
				className="jp-recommendations-feature-summary__display-name"
				borderless
			>
				<span className="jp-recommendations-feature-summary__display-name-text">
					{ displayName }
				</span>
			</Button>
			<div className="jp-recommendations-feature-summary__actions">
				<div className="jp-recommendations-feature-summary__cta">
					<SummaryTextLink href={ ctaLink } label={ ctaLabel } onClick={ onManageClick } />
				</div>
			</div>
		</div>
	);
};

const PrimarySummary = connect( ( state, ownProps ) => ( {
	...getSummaryPrimaryProps( state, ownProps.slug ),
	stepRoute: stepToRoute[ ownProps.slug ],
} ) )( PrimarySummaryComponent );

export { PrimarySummary };
