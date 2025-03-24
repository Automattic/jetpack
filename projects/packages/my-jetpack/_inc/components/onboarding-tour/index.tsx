import { Guide } from '@wordpress/components';
// import { useDispatch } from '@wordpress/data';
import { createInterpolateElement, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import WelcomeTourImage from './image';
import TourImage1 from './images/jp_onboarding_tour_1.png';
import TourImage2 from './images/jp_onboarding_tour_2.png';
import TourImage3 from './images/jp_onboarding_tour_3.png';
import TourImage4 from './images/jp_onboarding_tour_4.png';
import './styles.scss';

const storageKey = `jetpack_onboarding_guide_${ globalThis._currentSiteId }_is_dismissed`;

const OnboardingGuide = () => {
	const [ isOpen, setOpen ] = useState( true );

	const closeGuide = useCallback( () => {
		globalThis.localStorage.setItem( storageKey, 'true' );

		setOpen( false );
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
							image: <WelcomeTourImage nonAnimatedSrc={ TourImage1 } animatedSrc={ TourImage1 } />,
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
							image: <WelcomeTourImage nonAnimatedSrc={ TourImage2 } animatedSrc={ TourImage2 } />,
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
							image: <WelcomeTourImage nonAnimatedSrc={ TourImage3 } animatedSrc={ TourImage3 } />,
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
							image: <WelcomeTourImage nonAnimatedSrc={ TourImage4 } animatedSrc={ TourImage4 } />,
							content: (
								<>
									<h1 className="myjetpack-onboarding-welcome-tour__heading">
										{ __( 'Your site goes wherever you go.', 'jetpack-my-jetpack' ) }
									</h1>
									<p className="myjetpack-onboarding-welcome-tour__text">
										{ createInterpolateElement(
											__(
												'Install the Jetpack app for iOS or Android and stay connected to your site from anywhere!<br />We sent you an email with the download link!',
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

// const guideDismissed = globalThis.localStorage.getItem( storageKey );

// if ( hasQueryArg( globalThis.location.href, 'in-editor-deprecation-group' ) && ! guideDismissed ) {
// 	registerPlugin( 'wpcom-classic-block-editor-nux', {
// 		render: () => <OnboardingGuide />,
// 	} );
// }

export default OnboardingGuide;
