import { __ } from '@wordpress/i18n';
import styles from './footer.module.scss';
import AutomatticLogo from '$svg/automattic';
import JetpackLogo from '$svg/jetpack';

const Footer = () => {
	return (
		<footer className="jb-dashboard-footer">
			<div className={ styles[ 'signature--jetpack' ] }>
				<JetpackLogo />
				{ __( 'Jetpack Boost', 'jetpack-boost' ) }
			</div>
			<div className={ styles[ 'signature--automattic' ] }>
				<a
					href="https://automattic.com"
					aria-label={ __( 'An Automattic Airline', 'jetpack-boost' ) }
				>
					<AutomatticLogo />
				</a>
			</div>
		</footer>
	);
};

export default Footer;
