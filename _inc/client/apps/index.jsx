/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import Button from 'components/button';
import { translate as __ } from 'i18n-calypso';

const Apps = ( props ) => {
	return (
		<div>
			<div className="jp-jetpack-landing__container">
				<div className="jp-jetpack-landing__header">
					<h2 className="jp-jetpack-landing__title" title="Powerful WordPress.com features on every device.">
						{ __( 'Powerful WordPress.com features on every device.' ) }
					</h2>

					<p className="jp-jetpack-landing__description">
						{ __( 'Some secondary headline here for consistency.' ) }
					</p>

					<div className="jp-jetpack-landing__img-text">
						<div className="jp-jetpack-landing__column">
							<h2>{ __( 'Feel the performance' ) }</h2>
							<p>{ __( "All the WordPress apps are built for spped. You'll notice the difference in performance immediately, with near-instant page-loads and less waiting around." ) }</p>
						</div>
						<div className="jp-jetpack-landing__column">
							laptop image
						</div>
					</div>
				</div>

				<div className="jp-jetpack-landing__img-text">
					<div className="jp-jetpack-landing__column">
						secure and manage image
					</div>
					<div className="jp-jetpack-landing__column">
						<h2>{ __( 'Secure & Manage' ) }</h2>
						<p>{ __( 'Most security flaws are found in outdated plugins. Use our Web and Desktop apps to turn on auto-updates or update plugins manually for all your websites in one convenient place.' ) }</p>
						<Button href={ 'https://wordpress.com/plugins/' + window.Initial_State.rawUrl }	className="is-primary">
							{ __( 'Manage on WordPress.com' ) }
						</Button>
					</div>
				</div>

				<div className="jp-jetpack-landing__img-text">
					<div className="jp-jetpack-landing__column">
						<h2>{ __( 'Focus on your Writing' ) }</h2>
						<p>{ __( 'Our new editor is lightning fast, optimized for writers and eliminates distractions, giving you the ability to focus on your work.' ) }</p>
						<Button href={ 'https://wordpress.com/post/' + window.Initial_State.rawUrl }	className="is-primary">
							{ __( 'Write on WordPress.com' ) }
						</Button>
					</div>
					<div className="jp-jetpack-landing__column">
						writing image
					</div>
				</div>

				<div className="jp-jetpack-landing__img-text">
					<div className="jp-jetpack-landing__column">
						connect visitors image
					</div>
					<div className="jp-jetpack-landing__column">
						<h2>{ __( 'Connect with your Visitors' ) }</h2>
						<p>{ __( 'Monitor your visitors with advanced stats. Watch for trends, learn what content performs the best and understand your visitors from anywhere in the world.' ) }</p>
						<Button href={ 'https://wordpress.com/stats/' + window.Initial_State.rawUrl }	className="is-primary">
							{ __( 'View Stats on WordPress.com' ) }
						</Button>
					</div>
				</div>

				<div className="jp-jetpack-landing__img-text">
					<div className="jp-jetpack-landing__column">
						<h2>{ __( 'Connect with the Community' ) }</h2>
						<p>{ __( 'The WordPress apps all have impressively fast and full featured readers so you can catch up with your favorite sites and join the conversation anywhere, any time.' ) }</p>
						<Button href={ 'https://wordpress.com/reader' }	className="is-primary">
							{ __( 'Browse WordPress.com' ) }
						</Button>
					</div>
					<div className="jp-jetpack-landing__column">
						connect community image
					</div>
				</div>

				<div className="jp-jetpack-landing__footer">
					<h2 className="jp-jetpack-landing__title" title="Inspiration strikes any time, anywhere.">
						{ __( 'Inspiration strikes any time, anywhere.' ) }
					</h2>

					<p className="jp-jetpack-landing__description">
						{ __( 'Get WordPress apps for any screen.' ) }
					</p>

					<div className="jp-jetpack-landing__img-text">
						<h3>{ __( 'In your Pocket' ) }</h3>
						<p>{ __( 'Publish content, track stats, moderate comments and so much more from anywhere in the world. Our mobile apps are open source, free and available to you on Apple or Android devices.' ) }</p>
						<Button href="http://itunes.apple.com/us/app/wordpress/id335703880?mt=8" title={ __( 'WordPress.com in the App Store' ) } className="button-app button-ios">
							<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><path d="M74.7,62.2c-3.5-3.2-5.2-7.2-5.3-12.1c-0.1-6.2,2.8-11.1,8.5-14.5c-3.2-4.5-8-7.1-14.4-7.6c-2.4-0.2-5.2,0.3-8.7,1.5
	c-3.6,1.3-5.7,2-6.4,2c-0.8,0-2.8-0.6-5.7-1.7c-3-1.1-5.4-1.7-7.2-1.7c-3.4,0.1-6.5,0.9-9.4,2.6c-2.9,1.7-5.2,4-6.9,7
	C17.1,41.5,16,45.9,16,51c0,4.4,0.8,9,2.4,13.8c1.5,4.4,3.5,8.2,5.8,11.6c2.2,3.1,4,5.3,5.5,6.6c2.3,2.1,4.6,3.2,6.9,3.1
	c1.5-0.1,3.5-0.6,6-1.6c2.5-1,4.8-1.5,6.9-1.5c2,0,4.3,0.5,6.7,1.5c2.4,1,4.5,1.5,6.2,1.5c2.4-0.1,4.7-1,6.8-3
	c1.4-1.2,3.1-3.3,5.3-6.4c1.6-2.2,2.9-4.7,4.1-7.3c0.5-1.1,0.9-2.3,1.3-3.5C78.1,64.9,76.3,63.7,74.7,62.2z M59.8,22.2
	c2.8-3.3,4.2-6.8,4.2-10.6v0c0-0.5,0-1-0.1-1.5c-1.9,0.1-4,0.7-6.1,1.7c-2.2,1.1-4,2.4-5.4,4C49.6,19,48,22.9,48,26.5
	c0,0.5,0,1,0.1,1.4C52.5,28.3,56.5,26.1,59.8,22.2z"></path></svg>
							iOS</Button>
						<Button href="http://play.google.com/store/apps/details?id=org.wordpress.android" title={ __( 'WordPress.com in Google Play' ) } className="button-app button-android">
							<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><path d="M25,34.1c-2.1,0-4,1.7-4,3.7v16.6c0,2,1.9,3.7,4,3.7c2.1,0,4-1.7,4-3.7V37.8C29,35.7,27.1,34.1,25,34.1z M31,35v29.5
	c0,1.1,0.5,2.5,1.6,2.5H37v8.8c0,2,1.9,3.7,4,3.7c2.1,0,4-1.7,4-3.7V67h6v8.8c0,2,1.9,3.7,4,3.7c2.1,0,4-1.7,4-3.7V67h4.4
	c1.2,0,1.6-1.3,1.6-2.5V50V35h-1.6H31z M56.4,20.1l3-4.1c0.1-0.1,0-0.2-0.2-0.3c-0.2-0.1-0.4-0.1-0.4,0l-3.1,4.3
	c-2.1-0.8-4.6-1.3-7.7-1.3c-3.1,0-5.7,0.5-7.8,1.3l-3.1-4.3c-0.1-0.1-0.3-0.1-0.4,0.1c-0.2,0.1-0.3,0.3-0.2,0.4l3,4
	c-8.6,3.8-8.9,13-8.9,13h34.7C65.3,33,65,23.9,56.4,20.1z M40.4,27.8c-1.2,0-2.1-0.9-2.1-2.1c0-1.1,0.9-2.1,2.1-2.1
	c1.2,0,2.1,0.9,2.1,2.1C42.5,26.9,41.5,27.8,40.4,27.8z M55.6,27.8c-1.2,0-2.1-0.9-2.1-2.1c0-1.1,0.9-2.1,2.1-2.1
	c1.2,0,2.1,0.9,2.1,2.1C57.7,26.9,56.8,27.8,55.6,27.8z M71,34.1c-2.1,0-4,1.7-4,3.7v16.6c0,2,1.9,3.7,4,3.7c2.1,0,4-1.7,4-3.7V37.8
	C75,35.7,73.1,34.1,71,34.1z"></path></svg>
							Android</Button>

						<h3>{ __( 'On your Desktop' ) }</h3>
						<p>{ __( 'A desktop app that gives WordPress a permanent home on your computer. Not to mention the distraction free environment you get writing outside of a web browser.' ) }</p>
						<Button href="https://apps.wordpress.com/d/osx" title={ __( 'WordPress.com for Mac OS X' ) } className="button-app button-macosx">
							<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M24,8C15.163,8,8,15.163,8,24s7.163,16,16,16s16-7.163,16-16S32.837,8,24,8z M31.31,33.849h-0.986
	l-6.31-9.152h-0.058l-6.31,9.152h-0.972l6.817-9.82l-6.846-9.878h0.986l6.339,9.181h0.058l6.353-9.181h0.972l-6.861,9.878
	L31.31,33.849z"></path></svg>
							Mac OS X</Button>
						<Button href="https://apps.wordpress.com/d/windows" title={ __( 'WordPress.com for Windows' ) } className="button-app button-windows">
							<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M8,35.5l13,2.031V25H8V35.5z M8,24h13V10.172L8,12V24z M22,37.688L40,40.5V25H22V37.688z M22,10.031
	V24h18V7.5L22,10.031z"></path></svg>
							Windows</Button>
						<Button href="https://apps.wordpress.com/d/linux" title={ __( 'WordPress.com for Linux' ) } className="button-app button-linux">
							<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M24,8.003C15.165,8.003,8.003,15.165,8.003,24S15.165,39.997,24,39.997S39.997,32.835,39.997,24
	S32.835,8.003,24,8.003z M27.589,13.512c0.59-1.021,1.896-1.372,2.917-0.782c1.022,0.59,1.371,1.896,0.781,2.917
	c-0.589,1.021-1.895,1.371-2.917,0.781C27.35,15.839,27,14.533,27.589,13.512z M24,14.722c0.859,0,1.69,0.119,2.479,0.337
	c0.139,0.858,0.648,1.649,1.461,2.118c0.811,0.467,1.749,0.514,2.561,0.208c1.579,1.553,2.607,3.665,2.757,6.018l-3.043,0.045
	c-0.281-3.187-2.955-5.686-6.214-5.686c-0.939,0-1.83,0.209-2.628,0.58l-1.484-2.659C21.128,15.069,22.523,14.722,24,14.722z
	 M13.123,26.136c-1.18,0-2.136-0.956-2.136-2.136s0.956-2.136,2.136-2.136S15.259,22.82,15.259,24
	C15.258,25.18,14.302,26.136,13.123,26.136z M15.016,26.326c0.674-0.55,1.106-1.388,1.106-2.326c0-0.939-0.432-1.776-1.106-2.326
	c0.578-2.236,1.968-4.144,3.837-5.393l1.561,2.615C18.81,20.025,17.762,21.89,17.762,24c0,2.111,1.048,3.975,2.652,5.104
	l-1.561,2.616C16.983,30.471,15.593,28.562,15.016,26.326z M30.507,35.269c-1.021,0.59-2.327,0.24-2.916-0.782
	c-0.59-1.021-0.24-2.326,0.782-2.916c1.021-0.589,2.327-0.239,2.917,0.782C31.878,33.375,31.528,34.68,30.507,35.269z M30.5,30.616
	c-0.812-0.307-1.75-0.261-2.561,0.207c-0.812,0.469-1.321,1.259-1.461,2.118c-0.789,0.219-1.62,0.338-2.479,0.338
	c-1.477,0-2.872-0.347-4.112-0.961l1.484-2.659c0.798,0.371,1.689,0.58,2.628,0.58c3.259,0,5.933-2.498,6.213-5.686l3.044,0.045
	C33.107,26.951,32.08,29.063,30.5,30.616z"></path></svg>
							Linux</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Apps;
