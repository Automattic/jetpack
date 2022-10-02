import analytics from 'lib/analytics';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { getSummaryPrimaryProps } from '../feature-utils';

type SummaryTextLinkProps = {
	href: string;
	label: string;
	onInterceptHref?: () => Promise< void >;
};

const SummaryTextLink = ( { href, label, onInterceptHref }: SummaryTextLinkProps ) => {
	const handleOnClick = useCallback(
		e => {
			if ( onInterceptHref ) {
				e.preventDefault();
				onInterceptHref().then( () => {
					open( href, '_blank' );
				} );

				analytics.tracks.recordEvent( 'jetpack_recommendations_summary_intercepted_click', {
					label,
				} );
			}

			analytics.tracks.recordEvent( 'jetpack_recommendations_summary_manage_click', {
				label,
			} );
		},
		[ href, label, onInterceptHref ]
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

type PrimarySummaryComponentProps = {
	displayName: string;
	ctaLabel: string;
	ctaLink: string;
	onInterceptHref?: () => Promise< void >;
};

const PrimarySummaryComponent = ( {
	displayName,
	ctaLabel,
	ctaLink,
	onInterceptHref,
}: PrimarySummaryComponentProps ) => {
	// TODO: Add Tracks
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
