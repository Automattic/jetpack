/**
 * External dependencies
 */
import React from 'react';
import Button from 'components/button';
import { translate as __ } from 'i18n-calypso';
import analytics from 'lib/analytics';
import { getPlanClass } from 'lib/plans/constants';

/**
 * Internal dependencies
 */
import { imagePath } from 'constants/urls';

const PlanHeader = React.createClass( {
	trackLearnMore() {
		analytics.tracks.recordJetpackClick( {
			target: 'learn-more',
			plan: 'free',
			page: 'plans'
		} );
	},

	render() {
		let starrySky = '',
			planCard = '';
		const planClass = 'dev' !== this.props.plan
			? getPlanClass( this.props.plan )
			: 'dev';
		switch ( planClass ) {
			case 'is-free-plan':
				starrySky = (
					<div className="jp-landing-plans__header">
						<h2 className="jp-landing-plans__header-title">
							{ __( 'Introducing our most affordable backups and security plan yet' ) }
						</h2>
						<p className="jp-landing-plans__header-description">
							{ __( 'Jetpack Personal keeps your data, site, and hard work safe.' ) }
						</p>
						<div className="jp-landing-plans__header-img-container">
							<div className="jp-landing-plans__header-col-left">
								<h3 className="jp-landing-plans__header-subtitle">{ __( "How much is your website worth?" ) }</h3>
								<p className="jp-landing-plans__header-text">
									{ __( "For less than the price of a coffee a month you can rest easy knowing your hard work (or livelihood) is backed up." ) }
									<br /><br />
									{ __( "Hackers, botnets and spammers attack websites indiscriminately. Their goal is to attack everywhere and often. Our goal is to help you prepare by blocking these threats, and in worst-case-scenarios we'll be here to help you restore your site to its former glory." ) }
								</p>
								<p className="jp-landing-plans__header-btn-container">
									<Button href={ 'https://jetpack.com/redirect/?source=plans-main-top&site=' + this.props.siteRawUrl } className="is-primary">
										{ __( 'Learn more' ) }
									</Button>
								</p>
							</div>
							<div className="jp-landing-plans__header-col-right">
								<svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="335" height="233" viewBox="0 0 1005 700" version="1.1" aria-labelledby="wpcomLogin" role="img"><title id="wpcomLogin">{ __( 'Image of WordPress login screen protected by Jetpack' ) }</title><defs><rect id="path-1" x="0" y="0" width="1005" height="700" rx="8"/><polygon id="path-3" points="0 80 80 80 80 0 0 0 0 80"/><rect id="path-5" x="22" y="154" width="280" height="35"/><mask id="mask-6" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="280" height="35" fill="white"><use xlinkHref="#path-5"/></mask><rect id="path-7" x="22" y="234" width="280" height="35"/><mask id="mask-8" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="280" height="35" fill="white"><use xlinkHref="#path-7"/></mask><rect id="path-9" x="22" y="291" width="15" height="15"/><mask id="mask-10" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="15" height="15" fill="white"><use xlinkHref="#path-9"/></mask><rect id="path-11" x="230" y="289" width="71" height="30" rx="3"/><filter x="-50" y="-50" width="200" height="200" filterUnits="objectBoundingBox" id="filter-12"><feOffset dx="0" dy="1" in="SourceAlpha" result="shadowOffsetOuter1"/><feComposite in="shadowOffsetOuter1" in2="SourceAlpha" operator="out" result="shadowOffsetOuter1"/><feColorMatrix values="0" type="matrix" in="shadowOffsetOuter1"/></filter><filter x="-50" y="-50" width="200" height="200" filterUnits="objectBoundingBox" id="filter-13"><feOffset dx="0" dy="2" in="SourceAlpha" result="shadowOffsetInner1"/><feComposite in="shadowOffsetInner1" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowInnerInner1"/><feColorMatrix values="0" type="matrix" in="shadowInnerInner1"/></filter><mask id="mask-14" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="71" height="30" fill="white"><use xlinkHref="#path-11"/></mask><polygon id="path-15" points="54 33.75 54 0 0 0 0 33.75 0 67.5 54 67.5"/></defs><g id="Page-1" stroke="none" strokeWidth="1" fill="none" fill-rule="evenodd"><g id="Plans---wp-login-stripped" transform="translate(-197.000000, -136.000000)"><g id="Editor-Container" transform="translate(197.000000, 136.000000)"><g id="Simple-Layout"><g id="bg"><mask id="mask-2" fill="white"><use xlinkHref="#path-1"/></mask><use id="content-bg-mask" fill="#F1F1F1" xlinkHref="#path-1"/></g><g id="chrome"><rect fill="#FEFEFE" x="0" y="0" width="1005" height="53" rx="8"/><rect id="Rectangle" fill="#F1F1F1" x="0" y="46" width="1005" height="38"/><path d="M27.5 31C23.36 31 20 27.64 20 23.5 20 19.36 23.36 16 27.5 16 31.64 16 35 19.36 35 23.5 35 27.64 31.64 31 27.5 31L27.5 31ZM77.5 31C73.36 31 70 27.64 70 23.5 70 19.36 73.36 16 77.5 16 81.64 16 85 19.36 85 23.5 85 27.64 81.64 31 77.5 31L77.5 31ZM52.5 31C48.36 31 45 27.64 45 23.5 45 19.36 48.36 16 52.5 16 56.64 16 60 19.36 60 23.5 60 27.64 56.64 31 52.5 31L52.5 31Z" id="Shape" fill="#8D8D8D"/></g></g><g id="login-form" opacity="0.5" transform="translate(340.000000, 156.000000)"><rect id="log-bg" fill="#FFFFFF" x="0" y="110" width="325" height="243"/><g id="wplogo" transform="translate(123.000000, 0.000000)"><mask id="mask-4" fill="white"><use xlinkHref="#path-3"/></mask><g id="Clip-2"/><path d="M57.09 69.39L67.48 39.36C69.42 34.51 70.07 30.63 70.07 27.18 70.07 25.93 69.98 24.77 69.84 23.69 72.49 28.53 74 34.09 74 40 74 52.54 67.2 63.5 57.09 69.39L57.09 69.39ZM44.69 24.06C46.73 23.95 48.58 23.74 48.58 23.74 50.41 23.52 50.19 20.82 48.36 20.93 48.36 20.93 42.85 21.36 39.3 21.36 35.96 21.36 30.35 20.93 30.35 20.93 28.51 20.82 28.29 23.63 30.13 23.74 30.13 23.74 31.86 23.95 33.69 24.06L38.99 38.57 31.55 60.89 19.17 24.06C21.22 23.95 23.06 23.74 23.06 23.74 24.89 23.52 24.67 20.82 22.84 20.93 22.84 20.93 17.34 21.36 13.78 21.36 13.14 21.36 12.39 21.35 11.59 21.32 17.67 12.1 28.12 6 40 6 48.85 6 56.91 9.38 62.96 14.93 62.81 14.92 62.67 14.9 62.52 14.9 59.18 14.9 56.81 17.81 56.81 20.93 56.81 23.74 58.43 26.1 60.15 28.91 61.44 31.17 62.95 34.08 62.95 38.28 62.95 41.2 61.83 44.57 60.37 49.28L56.97 60.61 44.69 24.06ZM40 74C36.66 74 33.44 73.51 30.39 72.62L40.6 42.97 51.05 71.61C51.12 71.78 51.2 71.93 51.29 72.08 47.76 73.32 43.96 74 40 74L40 74ZM6 40C6 35.07 7.06 30.39 8.95 26.16L25.16 70.6C13.82 65.09 6 53.46 6 40L6 40ZM40 0C17.91 0 0 17.91 0 40 0 62.09 17.91 80 40 80 62.09 80 80 62.09 80 40 80 17.91 62.09 0 40 0L40 0Z" id="Fill-1" fill="#0072AC" mask="url(#mask-4)"/></g><use id="input" stroke="#DEDEDE" mask="url(#mask-6)" strokeWidth="2" fill="#FBFBFB" xlinkHref="#path-5"/><use id="input" stroke="#DEDEDE" mask="url(#mask-8)" strokeWidth="2" fill="#FBFBFB" xlinkHref="#path-7"/><use id="checkbox" stroke="#DEDEDE" mask="url(#mask-10)" strokeWidth="2" fill="#FBFBFB" xlinkHref="#path-9"/><g id="btn"><use fill="black" fillOpacity="1" filter="url(#filter-12)" xlinkHref="#path-11"/><use fill="#36A3CA" fill-rule="evenodd" xlinkHref="#path-11"/><use fill="black" fillOpacity="1" filter="url(#filter-13)" xlinkHref="#path-11"/><use stroke="#1075A0" mask="url(#mask-14)" strokeWidth="2" xlinkHref="#path-11"/></g></g><g id="security" transform="translate(428.000000, 275.000000)"><circle id="Oval" fill="#3D596D" cx="75" cy="75" r="75"/><g id="Page-1" transform="translate(48.000000, 37.500000)"><mask id="mask-16" fill="white"><use xlinkHref="#path-15"/></mask><g id="Clip-2"/><path d="M30.38 46.31L30.38 54 23.63 54 23.63 46.31C21.62 45.15 20.25 42.99 20.25 40.5 20.25 36.77 23.27 33.75 27 33.75 30.73 33.75 33.75 36.77 33.75 40.5 33.75 42.99 32.38 45.15 30.38 46.31L30.38 46.31ZM16.88 16.87C16.88 11.29 21.42 6.75 27 6.75 32.58 6.75 37.13 11.29 37.13 16.87L37.13 20.25 16.88 20.25 16.88 16.87ZM47.25 20.25L43.88 20.25 43.88 16.87C43.88 7.57 36.3 0 27 0 17.7 0 10.13 7.57 10.13 16.87L10.13 20.25 6.75 20.25C3.02 20.25 0 23.27 0 27L0 60.75C0 64.48 3.02 67.5 6.75 67.5L47.25 67.5C50.98 67.5 54 64.48 54 60.75L54 27C54 23.27 50.98 20.25 47.25 20.25L47.25 20.25Z" id="Fill-1" fill="#FFFFFF" mask="url(#mask-16)"/></g></g></g></g></g></svg>
							</div>
						</div>
						<div className="jp-landing-plans__clouds jp-clouds-top">
							<img src={ imagePath + '/white-clouds.svg' } alt="" />
						</div>
					</div>
				);
				planCard = (
					<div className="jp-landing__plan-card">
						<div className="jp-landing__plan-card-img">
							<img src={ imagePath + '/plans/plan-free.svg' } className="jp-landing__plan-icon" alt="" />
						</div>
						<div className="jp-landing__plan-card-current">
							<h3 className="jp-landing__plan-features-title">{ __( 'Your site is on the Free Jetpack Plan' ) }</h3>
							<p className="jp-landing__plan-features-text">{ __( 'Upgrade to a paid plan to unlock world-class security, spam protection tools, priority support, SEO and monetization tools.' ) }</p>
						</div>
					</div>
				);
				break;

			case 'is-personal-plan':
				planCard = (
					<div className="jp-landing__plan-card">
						<div className="jp-landing__plan-card-img">
							<img src={ imagePath + '/plans/plan-personal.svg' } className="jp-landing__plan-icon" alt="" />
						</div>
						<div className="jp-landing__plan-card-current">
							<h3 className="jp-landing__plan-features-title">{ __( 'Welcome to Jetpack Personal' ) }</h3>
							<p className="jp-landing__plan-features-text">{ __( 'Security essentials (daily backups, spam filtering), and priority support.' ) }</p>
						</div>
					</div>
				);
				break;

			case 'is-premium-plan':
				planCard = (
					<div className="jp-landing__plan-card">
						<div className="jp-landing__plan-card-img">
							<img src={ imagePath + '/plans/plan-premium.svg' } className="jp-landing__plan-icon" alt="" />
						</div>
						<div className="jp-landing__plan-card-current">
							<h3 className="jp-landing__plan-features-title">{ __( 'Welcome to Jetpack Premium' ) }</h3>
							<p className="jp-landing__plan-features-text">{ __( 'Enhanced security (backups, scanning, spam filtering), marketing automation (social scheduling, ad program), 13Gb video hosting, and priority support.' ) }</p>
						</div>
					</div>
				);
				break;

			case 'is-business-plan':
				planCard = (
					<div className="jp-landing__plan-card">
						<div className="jp-landing__plan-card-img">
							<img src={ imagePath + '/plans/plan-business.svg' } className="jp-landing__plan-icon" alt="" />
						</div>
						<div className="jp-landing__plan-card-current">
							<h3 className="jp-landing__plan-features-title">{ __( 'Welcome to Jetpack Professional' ) }</h3>
							<p className="jp-landing__plan-features-text">{ __( 'Unlimited Premium themes, business class security (backups, scanning, spam filtering), marketing automation (social scheduling, SEO tools, ad program), video hosting, and priority support.' ) }</p>
						</div>
					</div>
				);
				break;

			case 'dev':
				planCard = (
					<div className="jp-landing__plan-card">
						<div className="jp-landing__plan-card-img">
							<img src={ imagePath + '/plans/plan-free.svg' } className="jp-landing__plan-icon" alt="" />
						</div>
						<div className="jp-landing__plan-card-current">
							<h3 className="jp-landing__plan-features-title">{ __( 'Your site is on Development Mode' ) }</h3>
							<p className="jp-landing__plan-features-text">{ __( 'Once you connect, you can upgrade to a paid plan in order to unlock world-class security, spam protection tools, and priority support.' ) }</p>
						</div>
					</div>
				);
				break;

			default:
				planCard = (
					<div className="jp-landing__plan-card">
						<div className="jp-landing__plan-card-img is-placeholder">
						</div>
						<div className="jp-landing__plan-card-current">
							<h3 className="jp-landing__plan-features-title is-placeholder"> </h3>
							<p className="jp-landing__plan-features-text is-placeholder"> </p>
						</div>
					</div>
				);
				break;
		}
		return (
			<div>
				{ starrySky }
				{ planCard	}
			</div>
		);
	}
} );

export default PlanHeader;
