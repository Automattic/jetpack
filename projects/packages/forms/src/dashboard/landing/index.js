import { __ } from '@wordpress/i18n';
import Layout from '../components/layout';
import './style.scss';

import './teaser-video.png';

const LandingPage = () => {
	return (
		<Layout className="jp-forms__landing">
			<section className="jp-forms__landing-section bg-white-off">
				<div className="jp-forms__landing-content">
					<h1 className="mb-2">{ __( 'Building forms made easy', 'jetpack-forms' ) }</h1>
					<h4 className="mb-8">
						{ __( 'Free, flexible, fast and it works out of the box.', 'jetpack-forms' ) }
					</h4>
					<button className="button button-primary mb-6">
						{ __( 'Create your first form', 'jetpack-forms' ) }
					</button>
					<div className="jp-forms__video-placeholder">Video Placeholder</div>
				</div>
			</section>
			<section className="jp-forms__landing-section">
				<div className="jp-forms__landing-content">
					<h1>{ __( 'Start with one of many beautiful form patterns.', 'jetpack-forms' ) }</h1>
					<h1 className="mb-12">{ __( 'Customize to your needs.', 'jetpack-forms' ) }</h1>
					<div className="jp-forms__patterns-grid mb-8">
						<div className="jp-forms__pattern-item">
							<div>Image Placeholder</div>
							<span>{ __( 'Contact form', 'jetpack-forms' ) }</span>
						</div>
						<div className="jp-forms__pattern-item">
							<div>Image Placeholder</div>
							<span>{ __( 'Contact form', 'jetpack-forms' ) }</span>
						</div>
						<div className="jp-forms__pattern-item">
							<div>Image Placeholder</div>
							<span>{ __( 'Contact form', 'jetpack-forms' ) }</span>
						</div>
						<div className="jp-forms__pattern-item">
							<div>Image Placeholder</div>
							<span>{ __( 'Contact form', 'jetpack-forms' ) }</span>
						</div>
						<div className="jp-forms__pattern-item">
							<div>Image Placeholder</div>
							<span>{ __( 'Contact form', 'jetpack-forms' ) }</span>
						</div>
						<div className="jp-forms__pattern-item">
							<div>Image Placeholder</div>
							<span>{ __( 'Contact form', 'jetpack-forms' ) }</span>
						</div>
					</div>
					<button className="button button-primary">
						{ __( 'Explore more patterns', 'jetpack-forms' ) }
					</button>
				</div>
			</section>
			<section className="jp-forms__landing-section bg-white-off">
				<div className="jp-forms__landing-content">
					<h1>{ __( 'You’re in full control of the data.', 'jetpack-forms' ) }</h1>
					<h1 className="mb-12">{ __( 'Empower your workflow.', 'jetpack-forms' ) }</h1>
				</div>
			</section>
			<section className="jp-forms__landing-section align-center">
				<div className="jp-forms__landing-content">
					<h4 className="mb-6">{ __( 'You are in good company.', 'jetpack-forms' ) }</h4>
					<h1 className="mb-8">
						{ __( 'Trusted by more than 5 million WordPress sites.', 'jetpack-forms' ) }
					</h1>
					<button className="button button-primary">
						{ __( 'Get started with Jetpack Forms', 'jetpack-forms' ) }
					</button>
				</div>
			</section>
			<section className="jp-forms__landing-section bg-white-off">
				<div className="jp-forms__landing-content">
					<h1 className="mb-6">{ __( 'Frequently Asked Questions', 'jetpack-forms' ) }</h1>
				</div>
			</section>
		</Layout>
	);
};

export default LandingPage;
