import { imagePath } from 'constants/urls';
import analytics from 'lib/analytics';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect } from 'react';
import MyPlanCard from '../my-plan-card';

/**
 * Import styles
 */
import './style.scss';

const MyPlanBanner = props => {
	const { additionalEventProperties, productSlug, action, title, tagLine, trackingId } = props;

	useEffect( () => {
		analytics.tracks.recordEvent( 'jetpack_my_plan_banner_view', {
			type: trackingId,
			...additionalEventProperties,
		} );
	}, [ additionalEventProperties, trackingId ] );

	const trackActionClick = useCallback( () => {
		analytics.tracks.recordJetpackClick( {
			target: trackingId,
			feature: 'my-plan-banner',
			page: 'my-plan',
			...additionalEventProperties,
		} );
	}, [ additionalEventProperties, trackingId ] );

	return (
		<div className="jp-my-plan-banner">
			<div
				className="jp-my-plan-banner__card dops-card"
				style={ { backgroundImage: `url(${ imagePath }jetpack-banner-gradient.png)` } }
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
	action: PropTypes.element.isRequired,
	productSlug: PropTypes.string.isRequired,
	trackingId: PropTypes.string.isRequired,
	additionalEventProperties: PropTypes.object,
	tagLine: PropTypes.oneOfType( [ PropTypes.string, PropTypes.node, PropTypes.element ] ),
	title: PropTypes.oneOfType( [ PropTypes.string, PropTypes.node, PropTypes.element ] ),
};

export default MyPlanBanner;
