import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { IconButton } from '@wordpress/ui';
import TspMetricsBannerImage from './tsp-metrics-banner-image';
import './style.scss';

type TspMetricsBannerProps = {
	onClose: () => void;
	display: boolean;
};

/**
 *
 * @param props
 */
function TspMetricsBanner( props: TspMetricsBannerProps ) {
	const onBannerClose = () => {
		props.onClose();
	};
	if ( props.display ) {
		return (
			<div className="tsp-metrics-info-banner__container">
				<IconButton
					className="tsp-metrics-info-banner__close"
					icon={ close }
					label={ __( 'Dismiss', 'jetpack-blaze' ) }
					variant="minimal"
					tone="neutral"
					size="small"
					onClick={ onBannerClose }
				/>
				<div>
					<span className="tsp-metrics-info-banner__title">
						{ __( 'New metrics available', 'jetpack-blaze' ) }
					</span>
					<span className="tsp-metrics-info-banner__text">
						{ __(
							'Social engagement metrics allow you to see how many Tumblr users saw and interacted with your ad.',
							'jetpack-blaze'
						) }
					</span>
				</div>
				<div className="tsp-metrics-info-banner__image">
					<TspMetricsBannerImage />
				</div>
			</div>
		);
	}
	return <></>;
}

export default TspMetricsBanner;
