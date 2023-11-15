import { __ } from '@wordpress/i18n';
import styles from './Support.module.scss';
import { openPaidSupport } from '$lib/utils/paid-plan';

const Support = () => {
	return (
		<div className="jb-section">
			<div className="jb-container--narrow">
				<div className={ styles.support }>
					<div className="content">
						<h3 className={ styles.title }>{ __( "We're here to help", 'jetpack-boost' ) }</h3>
						<p>
							{ __(
								'Your paid plan gives you access to prioritized Jetpack Boost support',
								'jetpack-boost'
							) }
						</p>
					</div>
					<div className={ styles.cta }>
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

export default Support;
