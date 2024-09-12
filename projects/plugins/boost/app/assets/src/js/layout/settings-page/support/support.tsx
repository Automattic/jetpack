import { __ } from '@wordpress/i18n';
import { Button } from '@automattic/jetpack-components';
import styles from './support.module.scss';

const Support = () => {
	const openPaidSupport = () => {
		const supportUrl = 'https://jetpackme.wordpress.com/contact-support/';
		window.open( supportUrl, '_blank' );
	};

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
						<Button variant="secondary" onClick={ openPaidSupport }>
							{ __( 'Contact Us', 'jetpack-boost' ) }
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Support;
