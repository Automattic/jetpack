import clsx from 'clsx';
import Button from 'components/button';
import analytics from 'lib/analytics';
import { useCallback } from 'react';
import { connect } from 'react-redux';
import { stepToRoute } from 'state/recommendations';
import { getSummaryPrimaryProps } from '../feature-utils';
import type { MouseEventHandler } from 'react';

type SummaryTextLinkProps = {
	href: string;
	label: string;
	isHidden?: boolean;
	onClick: MouseEventHandler< HTMLAnchorElement >;
};

const SummaryTextLink = ( { href, label, isHidden, onClick }: SummaryTextLinkProps ) => {
	return (
		<a
			rel="noreferrer"
			target="_blank"
			href={ href }
			onClick={ onClick }
			className={ clsx( 'jp-summary-text-link', { [ 'is-hidden' ]: isHidden } ) }
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
};

const PrimarySummaryComponent = ( {
	slug,
	displayName,
	ctaLabel,
	ctaLink,
	stepRoute,
}: PrimarySummaryComponentProps ) => {
	const isActive = !! ctaLink;

	const onStepNameClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_step_name_click', {
			feature: slug,
		} );
	}, [ slug ] );

	const onManageClick = useCallback< MouseEventHandler< HTMLAnchorElement > >( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_manage_click', {
			feature: slug,
		} );
	}, [ slug ] );
	return (
		<div className="jp-recommendations-feature-summary is-primary">
			{ isActive ? (
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
			) : (
				<span className="jp-recommendations-feature-summary__display-name">{ displayName }</span>
			) }
			<div className="jp-recommendations-feature-summary__actions">
				<div className="jp-recommendations-feature-summary__cta">
					<SummaryTextLink
						href={ ctaLink }
						label={ ctaLabel }
						onClick={ onManageClick }
						isHidden={ ! isActive }
					/>
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
