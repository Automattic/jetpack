import { DotPager } from '@automattic/jetpack-components';

import './style.scss';

const Testimonials: React.FC = () => {
	return (
		<>
			<DotPager rotateTime={ 5 }>
				<div className="testimonial testimonial--1">
					<div className="testimonial__content">
						<div className="testimonial__messages">
							<p className="testimonial__message">Grow your audience.</p>
							<p className="testimonial__message">Speed up your site</p>
							<p className="testimonial__message">Keep it secure.</p>
						</div>
					</div>
				</div>
				<div className="testimonial testimonial--2">
					<div className="testimonial__content">
						<p className="testimonial__quote">
							Jetpack&apos;s performance features are no-brainers for the sites I build. With
							one-click CDN, there&apos;s no need to sacrifice performance for style. I know that it
							just automagically works once I toggle that button.
						</p>
						<p className="testimonial__author">
							<strong>Sasha Endoh</strong>
						</p>
						<p className="testimonial__title">Multidisciplinary Designed</p>
					</div>
				</div>
				<div className="testimonial testimonial--3">
					<div className="testimonial__content">
						<p className="testimonial__quote">
							Millions of people depend on my site, and downtime isn&apos;t an option. Jetpack
							handles my site security and backups so I can focus on creation.
						</p>
						<p className="testimonial__author">
							<strong>Tim Ferriss</strong>
						</p>
						<p className="testimonial__title">Author, Investor, Podcaster</p>
					</div>
				</div>
			</DotPager>
		</>
	);
};

export default Testimonials;
