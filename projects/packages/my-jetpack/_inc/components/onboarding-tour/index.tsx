import { Guide } from '@wordpress/components';
import { createInterpolateElement, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import { FC, useCallback } from 'react';
import { assetUrl } from '../../assets/url';
import WelcomeTourImage from './image';
import './styles.scss';

const TourImage1 = assetUrl( 'components/onboarding-tour/images/jp_onboarding_tour_1.webp' );
const TourImage1x2 = assetUrl( 'components/onboarding-tour/images/jp_onboarding_tour_1-2x.webp' );
const TourImage2 = assetUrl( 'components/onboarding-tour/images/jp_onboarding_tour_2.webp' );
const TourImage2x2 = assetUrl( 'components/onboarding-tour/images/jp_onboarding_tour_2-2x.webp' );
const TourImage4 = assetUrl( 'components/onboarding-tour/images/jp_onboarding_tour_4.webp' );
const TourImage4x2 = assetUrl( 'components/onboarding-tour/images/jp_onboarding_tour_4-2x.webp' );

const removeQueryParam = ( paramName: string ) => {
	const url = new URL( window.location.href );
	url.searchParams.delete( paramName );
	window.history.replaceState( {}, '', url );
};

const OnboardingTour: FC< { open?: boolean } > = ( { open = true } ) => {
	const [ isOpen, setOpen ] = useState( open );

	const closeGuide = useCallback( () => {
		setOpen( false );
		removeQueryParam( 'from' );
	}, [ setOpen ] );

	return (
		<>
			{ isOpen && (
				<Guide
					className="myjetpack-onboarding-welcome-tour"
					contentLabel={ __( 'Welcome to Jetpack', 'jetpack-my-jetpack' ) }
					onFinish={ closeGuide }
					finishButtonText={ __( 'Done', 'jetpack-my-jetpack' ) }
					pages={ [
						{
							image: (
								<WelcomeTourImage
									className="myjetpack-onboarding-welcome-tour__image"
									nonAnimatedSrc={ TourImage1 }
									nonAnimatedSrc2x={ TourImage1x2 }
									animatedSrc={ TourImage1 }
									animatedSrc2x={ TourImage1x2 }
								/>
							),
							content: (
								<>
									<h1 className="myjetpack-onboarding-welcome-tour__heading">
										{ __( 'Simple, yet powerful stats', 'jetpack-my-jetpack' ) }
									</h1>
									<p className="myjetpack-onboarding-welcome-tour__text">
										{ __(
											'In a few hours you’ll see detailed insights on who’s visiting your site and where they’re coming from.',
											'jetpack-my-jetpack'
										) }
									</p>
								</>
							),
						},
						{
							image: (
								<WelcomeTourImage
									className="myjetpack-onboarding-welcome-tour__image"
									nonAnimatedSrc={ TourImage2 }
									nonAnimatedSrc2x={ TourImage2x2 }
									animatedSrc={ TourImage2 }
									animatedSrc2x={ TourImage2x2 }
								/>
							),
							content: (
								<>
									<h1 className="myjetpack-onboarding-welcome-tour__heading">
										{ __( 'Make your site super fast', 'jetpack-my-jetpack' ) }
									</h1>
									<p className="myjetpack-onboarding-welcome-tour__text">
										{ __(
											'Make your site faster and more user-friendly by boosting loading speeds and SEO in seconds.',
											'jetpack-my-jetpack'
										) }
									</p>
								</>
							),
						},
						{
							image: (
								<WelcomeTourImage
									className="myjetpack-onboarding-welcome-tour__image"
									nonAnimatedSrc={ TourImage4 }
									nonAnimatedSrc2x={ TourImage4x2 }
									animatedSrc={ TourImage4 }
									animatedSrc2x={ TourImage4x2 }
								/>
							),
							content: (
								<>
									<h1 className="myjetpack-onboarding-welcome-tour__heading">
										{ __( 'Your site goes wherever you go', 'jetpack-my-jetpack' ) }
									</h1>
									<p className="myjetpack-onboarding-welcome-tour__text">
										{ createInterpolateElement(
											__(
												'Install the <mobileLink>Jetpack app</mobileLink> for iOS or Android and stay connected to your site from anywhere!',
												'jetpack-my-jetpack'
											),
											{
												mobileLink: (
													<Link openInNewTab href="https://jetpack.com/mobile/" children={ null } />
												),
											}
										) }
									</p>
								</>
							),
						},
					] }
				/>
			) }
		</>
	);
};

export default OnboardingTour;
