/**
 * External dependencies
 */
import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import MyPlanCard from '../my-plan-card';
import { imagePath } from 'constants/urls';

/**
 * Import styles
 */
import './style.scss';

const MyPlanBanner = props => {
	const { productSlug, action, title, tagLine, trackingId } = props;

	useEffect( () => {
		analytics.tracks.recordEvent( 'jetpack_my_plan_banner_view', {
			type: trackingId,
		} );
	}, [ trackingId ] );

	const trackActionClick = useCallback( () => {
		analytics.tracks.recordJetpackClick( {
			target: trackingId,
			feature: 'my-plan-banner',
			page: 'my-plan',
		} );
	}, [ trackingId ] );

	return (
		<div className="jp-my-plan-banner">
			<div
				className="jp-my-plan-banner__card dops-card"
				style={ { backgroundImage: `url(${ imagePath }jetpack-banner-gradient.svg)` } }
			>
				<MyPlanCard
					productSlug={ productSlug }
					action={ React.cloneElement( action, { onClick: trackActionClick } ) }
					title={ title }
					tagLine={ tagLine }
				/>
			</div>
		</div>
	);
};

MyPlanBanner.propTypes = {
	productSlug: PropTypes.string.isRequired,
	trackingId: PropTypes.string.isRequired,
	action: PropTypes.element.isRequired,
	tagLine: PropTypes.oneOfType( [ PropTypes.string, PropTypes.node, PropTypes.element ] ),
	title: PropTypes.oneOfType( [ PropTypes.string, PropTypes.node, PropTypes.element ] ),
};

export default MyPlanBanner;
