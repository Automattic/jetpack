import { __ } from '@wordpress/i18n';
import { openPaidSupport } from '../../utils/paid-plan';
import { Section } from '../section';
import styles from './styles.module.scss';

export const Support = () => {
	return (
		<Section>
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
		</Section>
	);
};
