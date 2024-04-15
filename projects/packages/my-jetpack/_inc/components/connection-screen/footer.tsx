import { __ } from '@wordpress/i18n';
import appleLogo from './apple.svg';
import googleLogo from './google.svg';
import styles from './styles.module.scss';
import wordpressLogo from './wordpress.svg';

const ConnectionScreenFooter: React.FC = () => (
	<>
		{ /* not using p here since connect screen apply styles for all p down the tree */ }
		{ /* https://github.com/Automattic/jetpack/blob/trunk/projects/js-packages/connection/components/connect-screen/layout/style.scss#L49-L54 */ }
		<div className={ styles[ 'account-description' ] }>
			{ __( 'You can use your existing account on any of these services:', 'jetpack-my-jetpack' ) }
		</div>
		{ /*
				Since the list style type is set to none, `role=list` is required for VoiceOver (on Safari) to announce the list.
				See: https://www.scottohara.me/blog/2019/01/12/lists-and-safari.html
			*/ }
		<ul className={ styles[ 'account-images' ] } role="list">
			<li>
				<img src={ wordpressLogo } className={ styles.wordpress } alt="WordPress.com" />
			</li>
			<li>
				<img src={ googleLogo } className={ styles.google } alt="Google" />
			</li>
			<li>
				<img src={ appleLogo } className={ styles.apple } alt="Apple" />
			</li>
		</ul>
	</>
);

export default ConnectionScreenFooter;
