import { DotPager } from '@automattic/jetpack-components';

import './style.scss';

const Testimonials: React.FC = () => {
	return (
		<>
			<DotPager rotateTime={ 5 }>
				<div className="testimonial1">
					<div className="testimonial-content">
						<p className="header">Grow your audience with Jetpack.</p>
						<p className="header">Speed up your site</p>
						<p className="header">Keep it secure.</p>
					</div>
				</div>
				<div className="testimonial2">
					<div className="testimonial-content">
						<p className="quote">
							Jetpack&apos;s performance features are no-brainers for the sites I build. With
							one-click CDN, there&apos;s no need to sacrifice performance for style. I know that it
							just automagically works once I toggle that button.
						</p>
						<p className="author">
							<strong>Sasha Endoh</strong>
						</p>
						<p className="title">Multidisciplinary Designed</p>
					</div>
				</div>
				<div className="testimonial3">
					<div className="testimonial-content">
						<p className="quote">
							Millions of people depend on my site, and downtime isn&apos;t an option. Jetpack
							handles my site security and backups so I can focus on creation.
						</p>
						<p className="author">
							<strong>Tim Ferriss</strong>
						</p>
						<p className="title">Author, Investor, Podcaster</p>
					</div>
				</div>
			</DotPager>
		</>
	);
};

export default Testimonials;
