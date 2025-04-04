import { DotPager } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import preventWidows from '../../utils/prevent-widows';

import './style.scss';

const Testimonials: React.FC = () => {
	return (
		<>
			<DotPager rotateTime={ 5 }>
				<div className="jetpack-onboarding-testimonial jetpack-onboarding-testimonial--1">
					<div className="jetpack-onboarding-testimonial__content">
						<div className="jetpack-onboarding-testimonial__messages">
							<p className="jetpack-onboarding-testimonial__message">
								{ __( 'Grow your audience.', 'jetpack-my-jetpack' ) }
							</p>
							<p className="testimonial__message">
								{ __( 'Speed up your site.', 'jetpack-my-jetpack' ) }
							</p>
							<p className="jetpack-onboarding-testimonial__message">
								{ __( 'Keep it secure.', 'jetpack-my-jetpack' ) }
							</p>
						</div>
					</div>
				</div>
				<div className="testimonial testimonial--2">
					<div className="testimonial__content">
						<p className="testimonial__quote">
							{ preventWidows(
								__(
									"Jetpack's performance features are no-brainers for the sites I build. With one-click CDN, there's no need to sacrifice performance for style. I know that it just automagically works once I toggle that button.",
									'jetpack-my-jetpack'
								)
							) }
						</p>
						<p className="jetpack-onboarding-testimonial__author">
							<strong>{ __( 'Sasha Endoh', 'jetpack-my-jetpack' ) }</strong>
						</p>
						<p className="testimonial__title">
							{ __( 'Multidisciplinary Designer', 'jetpack-my-jetpack' ) }
						</p>
					</div>
				</div>
				<div className="testimonial testimonial--3">
					<div className="testimonial__content">
						<p className="testimonial__quote">
							{ preventWidows(
								__(
									"Millions of people depend on my site, and downtime isn't an option. Jetpack handles my site security and backups so I can focus on creation.",
									'jetpack-my-jetpack'
								)
							) }
						</p>
						<p className="jetpack-onboarding-testimonial__author">
							<strong>{ __( 'Tim Ferriss', 'jetpack-my-jetpack' ) }</strong>
						</p>
						<p className="jetpack-onboarding-testimonial__title">
							{ __( 'Author, Investor, Podcaster', 'jetpack-my-jetpack' ) }
						</p>
					</div>
				</div>
			</DotPager>
		</>
	);
};

export default Testimonials;
