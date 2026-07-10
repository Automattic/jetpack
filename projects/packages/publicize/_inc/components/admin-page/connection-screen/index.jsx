import { Dialog, ProductOffer, TermsOfService } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { __, _x } from '@wordpress/i18n';
import illustration from '../../../assets/illustration.webp';
import background from './background.svg';
import styles from './styles.module.scss';

const ConnectionScreen = () => {
	const { userIsConnecting, siteIsRegistering, handleRegisterSite, registrationError } =
		useConnection( {
			from: 'jetpack-social',
			redirectUri: 'admin.php?page=jetpack-social',
		} );

	const buttonText = __( 'Get Started', 'jetpack-publicize-pkg' );

	return (
		<Dialog
			className={ styles.card }
			primary={
				<div className={ styles.column }>
					<ProductOffer
						className={ styles.offer }
						slug={ 'jetpack-social' }
						title={ _x( 'Jetpack Social', 'Plugin name', 'jetpack-publicize-pkg' ) }
						subTitle={ __(
							'Share your posts with your social media network and increase your site’s traffic',
							'jetpack-publicize-pkg'
						) }
						features={ [
							__(
								'Share to Facebook, Instagram, LinkedIn, Mastodon, Tumblr, Threads, Bluesky, and Nextdoor',
								'jetpack-publicize-pkg'
							),
							__( 'Post to multiple channels at once', 'jetpack-publicize-pkg' ),
							__( 'Manage all of your channels from a single hub', 'jetpack-publicize-pkg' ),
						] }
						isCard={ false }
						isBundle={ false }
						onAdd={ handleRegisterSite }
						buttonText={ buttonText }
						icon="social"
						isLoading={ siteIsRegistering || userIsConnecting }
						buttonDisclaimer={
							<TermsOfService
								className={ styles[ 'terms-of-service' ] }
								agreeButtonLabel={ buttonText }
							/>
						}
						error={
							registrationError
								? __( 'An error occurred. Please try again.', 'jetpack-publicize-pkg' )
								: null
						}
					/>
				</div>
			}
			secondary={
				<div className={ styles.sidebar }>
					<img className={ styles.background } src={ background } alt="" />
					<img className={ styles.illustration } src={ illustration } alt="" />
				</div>
			}
		/>
	);
};

export default ConnectionScreen;
