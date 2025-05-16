import { DotPager } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import preventWidows from '../../utils/prevent-widows';

import './style.scss';

const Testimonials: React.FC = () => {
	return (
		<>
			<DotPager rotateTime={ 5 } className="jetpack-onboarding-testimonials-pager">
				<div className="jetpack-onboarding-testimonial jetpack-onboarding-testimonial--1">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="672"
						height="521"
						viewBox="0 0 672 521"
						fill="none"
					>
						<g filter="url(#filter_blur)">
							<path
								d="M763.172 -127.994C763.172 107.34 572.395 298.117 337.061 298.117C101.726 298.117 -89.0503 107.34 -89.0503 -127.994C-89.0503 -363.329 101.726 -554.105 337.061 -554.105C572.395 -554.105 763.172 -363.329 763.172 -127.994Z"
								fill="url(#paint0_linear_6772_5737)"
							/>
						</g>
						<defs>
							<filter
								id="filter_blur"
								x="-315.541"
								y="-780.596"
								width="1305.2"
								height="1305.2"
								filterUnits="userSpaceOnUse"
								colorInterpolationFilters="sRGB"
							>
								<feFlood floodOpacity="0" result="BackgroundImageFix" />
								<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
								<feGaussianBlur stdDeviation="100" result="effect1_foregroundBlur_6772_5737" />
							</filter>
							<linearGradient
								id="paint0_linear_6772_5737"
								x1="763.172"
								y1="-127.994"
								x2="-89.0503"
								y2="-127.994"
								gradientUnits="userSpaceOnUse"
							>
								<stop stopColor="#48FF50" />
								<stop offset="0.471846" stopColor="#108642" />
								<stop offset="1" stopColor="#2E38FA" />
							</linearGradient>
						</defs>
					</svg>
					<div className="jetpack-onboarding-testimonial__content">
						<div className="jetpack-onboarding-testimonial__messages">
							<p className="jetpack-onboarding-testimonial__message">
								{ __( 'Grow your audience.', 'jetpack-my-jetpack' ) }
							</p>
							<p className="jetpack-onboarding-testimonial__message">
								{ __( 'Speed up your site.', 'jetpack-my-jetpack' ) }
							</p>
							<p className="jetpack-onboarding-testimonial__message">
								{ __( 'Keep it secure.', 'jetpack-my-jetpack' ) }
							</p>
						</div>
					</div>
				</div>
				<div className="jetpack-onboarding-testimonial jetpack-onboarding-testimonial--2">
					<div className="jetpack-onboarding-testimonial__content">
						<p className="jetpack-onboarding-testimonial__quote">
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
						<p className="jetpack-onboarding-testimonial__title">
							{ __( 'Multidisciplinary Designer', 'jetpack-my-jetpack' ) }
						</p>
					</div>
				</div>
				<div className="jetpack-onboarding-testimonial jetpack-onboarding-testimonial--3">
					<div className="jetpack-onboarding-testimonial__content">
						<p className="jetpack-onboarding-testimonial__quote">
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
