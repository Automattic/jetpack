import { __ } from '@wordpress/i18n';
import { openPaidSupport } from '../../../../utils/paid-plan';

export const Support = () => {
	return (
		<div className="jb-section">
			<div className="jb-container--narrow">
				<div className="jb-support">
					<div className="jb-support__content">
						<h3 className="jb-support__title">{ __( "We're here to help", 'jetpack-boost' ) }</h3>
						<p className="jb-support__description">
							{ __(
								'Your paid plan gives you access to prioritized Jetpack Boost support',
								'jetpack-boost'
							) }
						</p>
					</div>
					<div className="jb-support__cta">
						<button
							className="components-button jb-button jb-button--outline"
							onClick={ openPaidSupport }
							type="button"
						>
							{ __( 'Contact Us', 'jetpack-boost' ) }
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
