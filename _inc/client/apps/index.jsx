/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import Button from 'components/button';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { imagePath } from 'constants';

const Apps = ( props ) => {
	let canViewStats = 'object' === typeof window.Initial_State.userData && window.Initial_State.userData.currentUser && window.Initial_State.userData.currentUser.permissions && window.Initial_State.userData.currentUser.permissions.view_stats;
	return (
		<div className="jp-landing__apps dops-card">
			<div className="jp-landing-apps__header">
				<h2 className="jp-landing-apps__title">
					{ __( 'Powerful WordPress.com features on every device.' ) }
				</h2>

				<p className="jp-landing-apps__description">
					{ __( 'Manage all your sites from a single dashboard.' ) }
				</p>

				<div className="jp-landing-apps__header-img-container">
					<div className="jp-landing-apps__header-col-left">
						<h3 className="jp-landing-apps__subtitle">{ __( 'Feel the performance' ) }</h3>
						<p className="jp-landing-apps__sub-description">{ __( "All the WordPress apps are built for speed. You'll notice the difference in performance immediately, with near-instant page-loads and less waiting around." ) }</p>
					</div>
					<div className="jp-landing-apps__header-col-right">
						<img src={ imagePath + '/apps/laptop-90deg-themes.png' } className="jp-landing-apps__header-img" />
					</div>
				</div>
				<div className="jp-landing-apps__clouds jp-clouds-top">
					<img src={ imagePath + '/white-clouds.svg' } />
				</div>
			</div>

			<div className="jp-landing-apps__feature-container">
				<div className="jp-landing-apps__feature">
					<div className="jp-landing-apps__feature-col jp-landing-apps__feature-img">
						<img src={ imagePath + '/apps/manage2x.png' } />
					</div>
					<div className="jp-landing-apps__feature-col jp-landing-apps__feature-desc">
						<h3 className="jp-landing__apps-feature-title">{ __( 'Bulk and automatic updates' ) }</h3>
						<p className="jp-landing__apps-feature-text">{ __( 'Most security flaws are found in outdated plugins. Use our Web and Desktop apps to turn on auto-updates or update plugins manually for all your websites in one convenient place.' ) }</p>
						<Button href={ 'https://wordpress.com/plugins/' + window.Initial_State.rawUrl }	className="is-primary">
							{ __( 'Manage Plugins' ) }
						</Button>
					</div>
				</div>

				<div className="jp-landing-apps__feature">
					<div className="jp-landing-apps__feature-col jp-landing-apps__feature-desc">
						<h3 className="jp-landing__apps-feature-title">{ __( 'Focus on your Writing' ) }</h3>
						<p className="jp-landing__apps-feature-text">{ __( 'Our new editor is lightning fast, optimized for writers and eliminates distractions, giving you the ability to focus on your work.' ) }</p>
						<Button href={ 'https://wordpress.com/post/' + window.Initial_State.rawUrl }	className="is-primary">
							{ __( 'Try the New Editor' ) }
						</Button>
					</div>
					<div className="jp-landing-apps__feature-col jp-landing-apps__feature-img">
						<img src={ imagePath + '/apps/editor2x.png' } />
					</div>
				</div>

				{
					canViewStats ? (
						<div className="jp-landing-apps__feature">
							<div className="jp-landing-apps__feature-col jp-landing-apps__feature-img">
								<img src={ imagePath + '/apps/stats2x.png' } />
							</div>
							<div className="jp-landing-apps__feature-col jp-landing-apps__feature-desc">
								<h2>{ __( 'Connect with your Visitors' ) }</h2>
								<p>{ __( 'Monitor your visitors with advanced stats. Watch for trends, learn what content performs the best and understand your visitors from anywhere in the world.' ) }</p>
								<Button href={ 'https://wordpress.com/stats/' + window.Initial_State.rawUrl }	className="is-primary">
									{ __( 'View Your Stats' ) }
								</Button>
							</div>
						</div>
					) : (
						''
					)
				}

				<div className="jp-landing-apps__feature">
					{
						canViewStats ? (
							''
						) : (
							<div className="jp-landing-apps__feature-col jp-landing-apps__feature-img">
								<img src={ imagePath + '/apps/community2x.png' } />
							</div>
						)
					}
					<div className="jp-landing-apps__feature-col jp-landing-apps__feature-desc">
						<h2>{ __( 'Connect with the Community' ) }</h2>
						<p>{ __( 'The WordPress apps all have impressively fast and full featured readers so you can catch up with your favorite sites and join the conversation anywhere, any time.' ) }</p>
						<Button href={ 'https://wordpress.com/reader' }	className="is-primary">
							{ __( 'Launch Reader' ) }
						</Button>
					</div>
					{
						canViewStats ? (
							<div className="jp-landing-apps__feature-col jp-landing-apps__feature-img">
								<img src={ imagePath + '/apps/community2x.png' } />
							</div>
						) : (
							''
						)
					}
				</div>

			</div>

			<div className="jp-landing-apps__footer">
				<div className="jp-landing-apps__clouds jp-clouds-bottom">
					<img src={ imagePath + '/white-clouds-reverse.svg' } />
				</div>
				<div className="jp-landing-apps__footer-top">
					<h2 className="jp-landing-apps__title">
						{ __( 'Inspiration strikes any time, anywhere.' ) }
					</h2>

					<p className="jp-landing-apps__description">
						{ __( 'Get WordPress apps for any screen.' ) }
					</p>

					<img src={ imagePath + '/apps/triple-devices.svg' } className="jp-landing-apps__devices" />
				</div>

				<div className="jp-landing-apps__downloads">
					<h3 className="jp-landing-apps__subtitle">{ __( 'In your Pocket' ) }</h3>
					<p className="jp-landing-apps__sub-description">{ __( 'Publish content, track stats, moderate comments and so much more from anywhere in the world. Our mobile apps are open source, free and available to you on Apple or Android devices.' ) }</p>

					<p className="jp-landing-apps__btn-container">
						<Button href="http://itunes.apple.com/us/app/wordpress/id335703880?mt=8" title={ __( 'WordPress.com in the App Store' ) } className="jp-app-button button-ios">
							<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><path d="M74.7,62.2c-3.5-3.2-5.2-7.2-5.3-12.1c-0.1-6.2,2.8-11.1,8.5-14.5c-3.2-4.5-8-7.1-14.4-7.6c-2.4-0.2-5.2,0.3-8.7,1.5
		c-3.6,1.3-5.7,2-6.4,2c-0.8,0-2.8-0.6-5.7-1.7c-3-1.1-5.4-1.7-7.2-1.7c-3.4,0.1-6.5,0.9-9.4,2.6c-2.9,1.7-5.2,4-6.9,7
		C17.1,41.5,16,45.9,16,51c0,4.4,0.8,9,2.4,13.8c1.5,4.4,3.5,8.2,5.8,11.6c2.2,3.1,4,5.3,5.5,6.6c2.3,2.1,4.6,3.2,6.9,3.1
		c1.5-0.1,3.5-0.6,6-1.6c2.5-1,4.8-1.5,6.9-1.5c2,0,4.3,0.5,6.7,1.5c2.4,1,4.5,1.5,6.2,1.5c2.4-0.1,4.7-1,6.8-3
		c1.4-1.2,3.1-3.3,5.3-6.4c1.6-2.2,2.9-4.7,4.1-7.3c0.5-1.1,0.9-2.3,1.3-3.5C78.1,64.9,76.3,63.7,74.7,62.2z M59.8,22.2
		c2.8-3.3,4.2-6.8,4.2-10.6v0c0-0.5,0-1-0.1-1.5c-1.9,0.1-4,0.7-6.1,1.7c-2.2,1.1-4,2.4-5.4,4C49.6,19,48,22.9,48,26.5
		c0,0.5,0,1,0.1,1.4C52.5,28.3,56.5,26.1,59.8,22.2z"></path></svg>
							iOS</Button>
						<Button href="http://play.google.com/store/apps/details?id=org.wordpress.android" title={ __( 'WordPress.com in Google Play' ) } className="jp-app-button button-android">
							<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><path d="M25,34.1c-2.1,0-4,1.7-4,3.7v16.6c0,2,1.9,3.7,4,3.7c2.1,0,4-1.7,4-3.7V37.8C29,35.7,27.1,34.1,25,34.1z M31,35v29.5
		c0,1.1,0.5,2.5,1.6,2.5H37v8.8c0,2,1.9,3.7,4,3.7c2.1,0,4-1.7,4-3.7V67h6v8.8c0,2,1.9,3.7,4,3.7c2.1,0,4-1.7,4-3.7V67h4.4
		c1.2,0,1.6-1.3,1.6-2.5V50V35h-1.6H31z M56.4,20.1l3-4.1c0.1-0.1,0-0.2-0.2-0.3c-0.2-0.1-0.4-0.1-0.4,0l-3.1,4.3
		c-2.1-0.8-4.6-1.3-7.7-1.3c-3.1,0-5.7,0.5-7.8,1.3l-3.1-4.3c-0.1-0.1-0.3-0.1-0.4,0.1c-0.2,0.1-0.3,0.3-0.2,0.4l3,4
		c-8.6,3.8-8.9,13-8.9,13h34.7C65.3,33,65,23.9,56.4,20.1z M40.4,27.8c-1.2,0-2.1-0.9-2.1-2.1c0-1.1,0.9-2.1,2.1-2.1
		c1.2,0,2.1,0.9,2.1,2.1C42.5,26.9,41.5,27.8,40.4,27.8z M55.6,27.8c-1.2,0-2.1-0.9-2.1-2.1c0-1.1,0.9-2.1,2.1-2.1
		c1.2,0,2.1,0.9,2.1,2.1C57.7,26.9,56.8,27.8,55.6,27.8z M71,34.1c-2.1,0-4,1.7-4,3.7v16.6c0,2,1.9,3.7,4,3.7c2.1,0,4-1.7,4-3.7V37.8
		C75,35.7,73.1,34.1,71,34.1z"></path></svg>
							Android</Button>
					</p>

					<h3 className="jp-landing-apps__subtitle">{ __( 'On your Desktop' ) }</h3>
					<p className="jp-landing-apps__sub-description">{ __( 'A desktop app that gives WordPress a permanent home on your computer. Not to mention the distraction free environment you get writing outside of a web browser.' ) }</p>

					<p className="jp-landing-apps__btn-container">
						<Button href="https://apps.wordpress.com/d/osx" title={ __( 'WordPress.com for Mac OS X' ) } className="jp-app-button button-macosx">
							<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M24,8C15.163,8,8,15.163,8,24s7.163,16,16,16s16-7.163,16-16S32.837,8,24,8z M31.31,33.849h-0.986
		l-6.31-9.152h-0.058l-6.31,9.152h-0.972l6.817-9.82l-6.846-9.878h0.986l6.339,9.181h0.058l6.353-9.181h0.972l-6.861,9.878
		L31.31,33.849z"></path></svg>
							Mac OS X</Button>
						<Button href="https://apps.wordpress.com/d/windows" title={ __( 'WordPress.com for Windows' ) } className="jp-app-button button-windows">
							<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M8,35.5l13,2.031V25H8V35.5z M8,24h13V10.172L8,12V24z M22,37.688L40,40.5V25H22V37.688z M22,10.031
		V24h18V7.5L22,10.031z"></path></svg>
							Windows</Button>
						<Button href="https://apps.wordpress.com/d/linux" title={ __( 'WordPress.com for Linux' ) } className="jp-app-button button-linux">
							<svg xmlns="http://www.w3.org/2000/svg" width="21" height="24" viewBox="0 0 21 24"><path d="M9.8 5.9C9.8 5.9 9.8 5.9 9.8 5.9L9.7 5.9C9.6 5.9 9.6 5.9 9.5 5.8 9.5 5.8 9.4 5.7 9.4 5.6 9.4 5.5 9.4 5.5 9.5 5.5L9.7 5.6C9.8 5.7 9.8 5.8 9.8 5.9M8.4 5.1C8.4 4.7 8.3 4.4 8 4.4 8 4.4 8 4.5 7.9 4.5L7.9 4.7 8.2 4.7C8.2 4.8 8.3 4.9 8.3 5.1L8.4 5.1M11.2 4.7C11.3 4.7 11.4 4.8 11.5 5.1L11.7 5.1C11.6 5 11.6 4.9 11.6 4.8 11.6 4.8 11.6 4.7 11.5 4.6 11.4 4.5 11.3 4.4 11.3 4.4 11.3 4.4 11.2 4.5 11.1 4.5 11.1 4.6 11.2 4.6 11.2 4.7M8.8 5.9C8.7 5.9 8.7 5.9 8.7 5.9 8.7 5.8 8.7 5.7 8.8 5.6 9 5.6 9.1 5.5 9.1 5.5 9.1 5.5 9.1 5.6 9.1 5.6 9.1 5.7 9.1 5.8 8.9 5.9L8.8 5.9M7.9 5.9C7.6 5.7 7.6 5.5 7.6 5.1 7.6 4.8 7.6 4.7 7.7 4.5 7.8 4.4 7.9 4.3 8.1 4.3 8.3 4.3 8.3 4.4 8.5 4.5 8.6 4.8 8.7 5 8.7 5.2L8.7 5.3 8.7 5.4 8.7 5.4 8.7 5.3C8.8 5.3 8.8 5.2 8.8 4.8 8.8 4.6 8.8 4.4 8.7 4.1 8.5 3.9 8.3 3.7 8 3.7 7.8 3.7 7.6 3.9 7.5 4.1 7.3 4.4 7.3 4.7 7.3 5.1 7.3 5.4 7.4 5.7 7.7 6 7.8 5.9 7.9 5.9 7.9 5.9M17.8 17C17.9 17 17.9 17 17.9 16.9 17.9 16.7 17.8 16.5 17.6 16.3 17.3 16 16.9 15.9 16.5 15.8 16.4 15.8 16.3 15.8 16.3 15.8 16.2 15.8 16.2 15.8 16.2 15.8 16.1 15.8 15.9 15.8 15.8 15.8 16.1 15 16.2 14.4 16.2 13.8 16.2 13 16 12.5 15.7 12 15.4 11.5 15.1 11.3 14.7 11.2 14.6 11.3 14.6 11.3 14.6 11.4 15 11.5 15.4 11.8 15.6 12.3 15.8 12.9 15.9 13.3 15.9 13.9 15.9 14.3 15.8 15 15.5 15.8 15.2 16 14.9 16.3 14.7 16.7 14.7 16.8 14.7 16.8 14.7 16.8 14.7 16.8 14.8 16.8 14.9 16.6 15.1 16.5 15.1 16.3 15.3 16.2 15.5 16.1 15.7 16 15.9 16 16.3 16 16.7 16.1 16.9 16.2 17.3 16.3 17.4 16.4 17.5 16.5 17.6 16.6 17.7 16.7 17.7 16.8 17.7 16.9 17.8 17 17.8 17M10.6 5.5C10.5 5.5 10.5 5.3 10.5 5.2 10.5 4.8 10.5 4.7 10.6 4.4 10.8 4.3 10.9 4.2 11.1 4.2 11.3 4.2 11.5 4.4 11.7 4.5 11.7 4.8 11.8 4.9 11.8 5.2 11.8 5.5 11.7 5.8 11.3 5.9 11.3 5.9 11.4 5.9 11.5 5.9 11.7 5.9 11.7 6 11.9 6.1 12 5.6 12.1 5.3 12.1 4.9 12.1 4.4 12 4.1 11.8 3.9 11.6 3.7 11.3 3.6 11 3.6 10.8 3.6 10.6 3.7 10.3 3.8 10.2 4 10.1 4.2 10.1 4.4 10.1 4.8 10.2 5.2 10.3 5.5 10.4 5.5 10.5 5.5 10.6 5.5M11.5 6.8C10.5 7.5 9.7 7.8 9.1 7.8 8.5 7.8 7.9 7.6 7.5 7.2 7.6 7.4 7.6 7.5 7.7 7.6L8.2 8.1C8.5 8.4 8.9 8.5 9.3 8.5 9.8 8.5 10.5 8.2 11.3 7.7L12 7.2C12.1 7 12.3 6.9 12.3 6.7 12.3 6.6 12.3 6.5 12.2 6.5 12.1 6.3 11.7 6.1 10.9 5.9 10.2 5.5 9.7 5.4 9.4 5.4 9.1 5.4 8.7 5.5 8.2 5.9 7.7 6.2 7.4 6.5 7.4 6.8 7.4 6.8 7.5 6.9 7.6 7 8 7.4 8.5 7.7 9 7.7 9.6 7.7 10.4 7.4 11.4 6.6L11.4 6.7C11.5 6.7 11.5 6.8 11.5 6.8M13.3 22.8C13.6 23.4 14.2 23.7 14.8 23.7 15 23.7 15.1 23.6 15.3 23.6 15.4 23.5 15.6 23.5 15.7 23.4 15.8 23.4 15.8 23.3 15.9 23.3 16.1 23.2 16.1 23.2 16.2 23.1L17.5 22C17.8 21.7 18.1 21.5 18.5 21.3 18.8 21.1 19.2 21 19.3 20.9 19.6 20.8 19.7 20.8 19.9 20.6 19.9 20.5 20 20.4 20 20.2 20 19.9 19.9 19.8 19.7 19.6 19.6 19.5 19.4 19.4 19.2 19.4 19.1 19.3 18.9 19.2 18.7 19 18.5 18.8 18.4 18.5 18.3 18.1L18.2 17.7C18.1 17.4 18.1 17.3 18.1 17.2 18.1 17.2 18.1 17.2 18 17.2 17.9 17.2 17.7 17.2 17.7 17.4 17.5 17.5 17.3 17.7 17.2 17.8 17.1 18 16.9 18.1 16.7 18.3 16.5 18.4 16.2 18.5 16.1 18.5 15.4 18.5 15.1 18.3 14.9 17.9 14.7 17.7 14.7 17.4 14.6 17.1 14.4 16.9 14.3 16.9 14.2 16.9 13.8 16.9 13.6 17.3 13.6 18.1L13.6 18.4 13.6 19.3 13.6 20 13.6 20.3 13.6 20.6C13.6 20.6 13.6 20.8 13.6 21 13.5 21.3 13.5 21.6 13.5 21.9L13.3 22.7 13.3 22.8M1.9 22.3C2.6 22.4 3.4 22.7 4.4 23 5.4 23.4 5.9 23.6 6.2 23.6 6.7 23.6 7.2 23.3 7.5 22.8 7.6 22.7 7.6 22.5 7.6 22.3 7.6 21.6 7.2 20.6 6.3 19.5L5.7 18.7C5.6 18.6 5.5 18.4 5.3 18.1 5.2 17.8 5 17.5 4.9 17.3 4.8 17.2 4.6 17 4.4 16.8 4.2 16.6 4 16.5 3.7 16.4 3.4 16.5 3.1 16.6 3 16.8 2.9 16.9 2.9 17.1 2.8 17.3 2.8 17.4 2.8 17.5 2.7 17.6 2.6 17.6 2.5 17.7 2.3 17.7 2.3 17.7 2.2 17.7 2.1 17.7L1.9 17.7C1.4 17.7 1.2 17.8 1 17.8 0.8 18.1 0.7 18.3 0.7 18.6 0.7 18.7 0.7 19 0.8 19.3 0.9 19.5 0.9 19.8 0.9 19.9 0.9 20.3 0.8 20.6 0.6 20.9 0.4 21.3 0.3 21.5 0.3 21.7 0.4 22 0.9 22.2 1.9 22.3M4.5 15.2C4.5 14.6 4.6 14 4.9 13.3 5.2 12.6 5.5 12.1 5.8 11.8 5.8 11.7 5.7 11.7 5.7 11.7L5.6 11.6C5.3 11.9 5.1 12.4 4.7 13.2 4.4 13.9 4.2 14.6 4.2 15.1 4.2 15.4 4.3 15.7 4.5 16 4.7 16.3 5.1 16.6 5.7 17.1L6.6 17.7C7.5 18.4 7.9 19 7.9 19.3 7.9 19.5 7.9 19.6 7.6 19.8 7.5 20 7.3 20.1 7.1 20.1 7.1 20.1 7 20.1 7 20.1 7 20.2 7.1 20.3 7.3 20.6 7.6 21.1 8.3 21.3 9.3 21.3 11 21.3 12.4 20.6 13.4 19.2 13.4 18.8 13.4 18.5 13.3 18.4L13.3 18.1C13.3 17.6 13.4 17.2 13.5 17 13.7 16.7 13.9 16.6 14.1 16.6 14.3 16.6 14.4 16.7 14.6 16.8 14.6 16.2 14.6 15.6 14.6 15.2 14.6 14.4 14.6 13.9 14.5 13.3 14.4 12.8 14.3 12.4 14.1 12.1 13.9 11.9 13.8 11.6 13.6 11.4 13.5 11.2 13.4 10.9 13.2 10.7 13.1 10.4 13.1 10.1 13.1 9.8 12.8 9.4 12.7 9 12.4 8.6 12.3 8.2 12.1 7.8 12 7.5L11.3 8C10.5 8.6 9.8 8.8 9.3 8.8 8.8 8.8 8.4 8.7 8.2 8.4L7.7 8C7.7 8.3 7.6 8.6 7.5 8.9L7 9.8C6.7 10.4 6.6 10.7 6.6 10.9 6.6 11.1 6.5 11.3 6.5 11.3L5.9 12.4C5.3 13.6 5 14.7 5 15.6 5 15.8 5 16 5 16.2 4.7 15.9 4.5 15.6 4.5 15.2M10.1 22.6C9.1 22.6 8.3 22.8 7.8 23L7.8 23C7.4 23.5 6.9 23.7 6.3 23.7 5.9 23.7 5.3 23.6 4.5 23.3 3.7 23 2.9 22.8 2.3 22.6 2.2 22.6 2.1 22.6 1.9 22.6 1.7 22.5 1.4 22.5 1.3 22.5 1.1 22.4 0.9 22.4 0.7 22.3 0.5 22.2 0.4 22.1 0.2 22 0.1 21.9 0.1 21.8 0.1 21.7 0.1 21.6 0.1 21.4 0.2 21.3 0.2 21.2 0.3 21.1 0.3 21.1 0.4 21 0.4 20.9 0.4 20.8 0.5 20.7 0.5 20.7 0.6 20.6 0.6 20.5 0.6 20.4 0.6 20.4 0.7 20.3 0.7 20.2 0.7 20.1 0.7 20 0.6 19.8 0.6 19.4 0.5 19 0.5 18.7 0.5 18.6 0.5 18.3 0.6 18 0.7 17.8 0.9 17.6 1.1 17.5 1.2 17.5L2.2 17.5C2.2 17.5 2.3 17.4 2.5 17.4 2.6 17.2 2.6 17.1 2.6 17 2.7 16.9 2.7 16.9 2.7 16.8 2.7 16.8 2.7 16.7 2.8 16.7 2.8 16.6 2.8 16.6 2.9 16.5 2.8 16.4 2.8 16.3 2.8 16.2 2.8 16.1 2.8 16 2.8 16 2.8 15.7 2.9 15.3 3.2 14.8L3.5 14.3C3.7 13.9 3.9 13.5 4 13.2 4.2 12.9 4.3 12.4 4.5 11.8 4.6 11.2 4.9 10.7 5.4 10.1L5.9 9.4C6.4 9 6.6 8.6 6.8 8.2 6.9 7.9 7 7.5 7 7.2 7 7.1 7 6.6 6.9 5.8 6.8 5 6.8 4.2 6.8 3.5 6.8 3 6.8 2.6 6.9 2.2 7 1.8 7.2 1.4 7.5 1.1 7.7 0.7 8 0.4 8.5 0.3 9 0.1 9.5 0 10.1 0 10.4 0 10.6 0 10.9 0.1 11.1 0.1 11.4 0.2 11.8 0.4 12.1 0.5 12.4 0.7 12.7 0.9 13 1.1 13.2 1.5 13.5 1.9 13.6 2.4 13.8 2.9 13.9 3.5 13.9 3.9 13.9 4.3 14 4.9 14 5.3 14.1 5.6 14.1 5.9 14.2 6.1 14.2 6.4 14.3 6.8 14.3 7.1 14.4 7.5 14.6 7.7 14.7 8 14.9 8.3 15.1 8.6 15.4 9 15.7 9.4 16 9.9 16.7 10.7 17.3 11.6 17.6 12.4 18 13.2 18.2 14.2 18.2 15.3 18.2 15.9 18.1 16.4 18 16.9 18.1 16.9 18.2 17 18.3 17.1 18.4 17.2 18.4 17.5 18.5 17.8L18.6 18.4C18.7 18.6 18.8 18.7 19 18.9 19.1 19 19.3 19.2 19.5 19.2 19.7 19.3 19.9 19.4 20.1 19.6 20.3 19.7 20.3 19.9 20.3 20.1 20.3 20.3 20.3 20.5 20.1 20.7 19.9 20.8 19.8 21 19.5 21 19.4 21.1 19.1 21.3 18.6 21.5 18.2 21.7 17.8 22 17.4 22.3L16.6 23C16.3 23.3 16 23.5 15.8 23.7 15.5 23.8 15.2 23.9 14.9 23.9L14.3 23.8C13.7 23.7 13.3 23.3 13.1 22.9 11.8 22.7 10.8 22.6 10.1 22.6"/></svg>
							Linux</Button>
					</p>
				</div>
			</div>

		</div>
	);
};

export default Apps;
