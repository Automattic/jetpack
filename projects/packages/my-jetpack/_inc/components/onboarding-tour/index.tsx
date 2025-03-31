import { Guide } from '@wordpress/components';
import { createInterpolateElement, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { FC, useCallback } from 'react';
import WelcomeTourImage from './image';
import TourImage1x2 from './images/jp_onboarding_tour_1-2x.png';
import TourImage1 from './images/jp_onboarding_tour_1.png';
import TourImage2x2 from './images/jp_onboarding_tour_2-2x.png';
import TourImage2 from './images/jp_onboarding_tour_2.png';
import TourImage3x2 from './images/jp_onboarding_tour_3-2x.png';
import TourImage3 from './images/jp_onboarding_tour_3.png';
import TourImage4x2 from './images/jp_onboarding_tour_4-2x.png';
import TourImage4 from './images/jp_onboarding_tour_4.png';
import './styles.scss';

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
										{ __( 'Making your site super fast', 'jetpack-my-jetpack' ) }
									</h1>
									<p className="myjetpack-onboarding-welcome-tour__text">
										{ __(
											'We’re already checking how your site stacks up and will suggest speed optimizations in a few minutes.',
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
									nonAnimatedSrc={ TourImage3 }
									nonAnimatedSrc2x={ TourImage3x2 }
									animatedSrc={ TourImage3 }
									animatedSrc2x={ TourImage3x2 }
								/>
							),
							content: (
								<>
									<h1 className="myjetpack-onboarding-welcome-tour__heading">
										{ __( 'Your entire site, safe in the cloud', 'jetpack-my-jetpack' ) }
									</h1>
									<p className="myjetpack-onboarding-welcome-tour__text">
										{ __(
											'We’ve started to back up your entire site in the cloud. Restore with one click if anything goes wrong.',
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
												'Install the Jetpack app for iOS or Android and stay connected to your site from anywhere!<br />We sent you an email with the download link.',
												'jetpack-my-jetpack'
											),
											{
												br: <br />,
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
