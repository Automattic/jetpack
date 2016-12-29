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
import { userCanViewStats, userCanManagePlugins, userCanEditPosts } from 'state/initial-state';

const Apps = ( props ) => {
	let canViewStats = props.userCanViewStats;
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
							<svg className="jp-landing-apps__header-img" width="335" height="233" viewBox="0 0 1005 700" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" aria-labelledby="wpcomThemes" role="img"><title id="wpcomThemes">{ __( 'Image of managing your sites themes on your WordPress.com dashboard' ) }</title><defs><rect id="a" width="1005" height="700" rx="8"/><rect id="b" width="335" height="233" rx="8"/><path id="c" d="M158 125h725v575H158z"/><path id="e" d="M20 9.9998V0H0v19.9996h20z"/></defs><g fill="none" fill-rule="evenodd"><rect fill="#F3F6F8" width="1005" height="700" rx="8"/><use fill="#F3F6F8" xlinkHref="#a"/><rect fill="#E9EFF3" width="1005" height="65" rx="8"/><path d="M27.5 31c-4.1425 0-7.5-3.3575-7.5-7.5s3.3575-7.5 7.5-7.5 7.5 3.3575 7.5 7.5-3.3575 7.5-7.5 7.5zm50 0c-4.1425 0-7.5-3.3575-7.5-7.5s3.3575-7.5 7.5-7.5 7.5 3.3575 7.5 7.5-3.3575 7.5-7.5 7.5zm-25 0c-4.1425 0-7.5-3.3575-7.5-7.5s3.3575-7.5 7.5-7.5 7.5 3.3575 7.5 7.5-3.3575 7.5-7.5 7.5z" fill="#4F748E"/><path fill="#0087BE" d="M0 47h1005v65H0"/><mask id="d" fill="#fff"><use xlinkHref="#c"/></mask><g mask="url(#d)"><path fill="#0087BE" d="M197 245h194v194H197z"/><g transform="translate(355 409)"><mask id="f" fill="#fff"><use xlinkHref="#e"/></mask><path d="M9 15.7676l-4.884-4.884 1.768-1.767L9 12.2326l8.658-8.658C15.823 1.3906 13.075-.0004 10-.0004c-5.523 0-10 4.478-10 10 0 5.523 4.477 10 10 10s10-4.477 10-10c0-1.528-.353-2.971-.966-4.266L9 15.7676z" fill="#FFF" mask="url(#f)"/></g><path fill="#E9EFF3" d="M207 414h100v10H207z"/><path d="M281.5 301.25h39v-9.75h-39v9.75zm29.25 29.25h9.75v-22.75h-9.75v22.75zm-29.25 0h22.75v-22.75H281.5v22.75zm39-45.5h-39c-3.59125 0-6.5 2.90875-6.5 6.5v39c0 3.59125 2.90875 6.5 6.5 6.5h39c3.59125 0 6.5-2.90875 6.5-6.5v-39c0-3.59125-2.90875-6.5-6.5-6.5zm-52 13c-3.59125 0-6.5 2.90875-6.5 6.5v39c0 3.575 2.925 6.5 6.5 6.5h39c3.59125 0 6.5-2.90875 6.5-6.5h-45.5V298z" fill="#FFF"/><g><path fill="#FFF" d="M406 245h194v150H406zM406 399h194v40H406z"/><path fill="#87A6BC" d="M416 414h100v10H416zM490.5 301.25h39v-9.75h-39v9.75zm29.25 29.25h9.75v-22.75h-9.75v22.75zm-29.25 0h22.75v-22.75H490.5v22.75zm39-45.5h-39c-3.59125 0-6.5 2.90875-6.5 6.5v39c0 3.59125 2.90875 6.5 6.5 6.5h39c3.59125 0 6.5-2.90875 6.5-6.5v-39c0-3.59125-2.90875-6.5-6.5-6.5zm-52 13c-3.59125 0-6.5 2.90875-6.5 6.5v39c0 3.575 2.925 6.5 6.5 6.5h39c3.59125 0 6.5-2.90875 6.5-6.5h-45.5V298z"/></g><g><path fill="#FFF" d="M615 245h194v150H615zM615 399h194v40H615z"/><path fill="#87A6BC" d="M625 414h100v10H625zM699.5 301.25h39v-9.75h-39v9.75zm29.25 29.25h9.75v-22.75h-9.75v22.75zm-29.25 0h22.75v-22.75H699.5v22.75zm39-45.5h-39c-3.59125 0-6.5 2.90875-6.5 6.5v39c0 3.59125 2.90875 6.5 6.5 6.5h39c3.59125 0 6.5-2.90875 6.5-6.5v-39c0-3.59125-2.90875-6.5-6.5-6.5zm-52 13c-3.59125 0-6.5 2.90875-6.5 6.5v39c0 3.575 2.925 6.5 6.5 6.5h39c3.59125 0 6.5-2.90875 6.5-6.5h-45.5V298z"/></g></g><g mask="url(#d)"><path fill="#FFF" d="M197 454h194v150H197zM197 608h194v40H197z"/><path fill="#87A6BC" d="M207 623h100v10H207zM281.5 510.25h39v-9.75h-39v9.75zm29.25 29.25h9.75v-22.75h-9.75v22.75zm-29.25 0h22.75v-22.75H281.5v22.75zm39-45.5h-39c-3.59125 0-6.5 2.90875-6.5 6.5v39c0 3.59125 2.90875 6.5 6.5 6.5h39c3.59125 0 6.5-2.90875 6.5-6.5v-39c0-3.59125-2.90875-6.5-6.5-6.5zm-52 13c-3.59125 0-6.5 2.90875-6.5 6.5v39c0 3.575 2.925 6.5 6.5 6.5h39c3.59125 0 6.5-2.90875 6.5-6.5h-45.5V507z"/><g><path fill="#FFF" d="M406 454h194v150H406zM406 608h194v40H406z"/><path fill="#87A6BC" d="M416 623h100v10H416zM490.5 510.25h39v-9.75h-39v9.75zm29.25 29.25h9.75v-22.75h-9.75v22.75zm-29.25 0h22.75v-22.75H490.5v22.75zm39-45.5h-39c-3.59125 0-6.5 2.90875-6.5 6.5v39c0 3.59125 2.90875 6.5 6.5 6.5h39c3.59125 0 6.5-2.90875 6.5-6.5v-39c0-3.59125-2.90875-6.5-6.5-6.5zm-52 13c-3.59125 0-6.5 2.90875-6.5 6.5v39c0 3.575 2.925 6.5 6.5 6.5h39c3.59125 0 6.5-2.90875 6.5-6.5h-45.5V507z"/></g><g><path fill="#FFF" d="M615 454h194v150H615zM615 608h194v40H615z"/><path fill="#87A6BC" d="M625 623h100v10H625zM699.5 510.25h39v-9.75h-39v9.75zm29.25 29.25h9.75v-22.75h-9.75v22.75zm-29.25 0h22.75v-22.75H699.5v22.75zm39-45.5h-39c-3.59125 0-6.5 2.90875-6.5 6.5v39c0 3.59125 2.90875 6.5 6.5 6.5h39c3.59125 0 6.5-2.90875 6.5-6.5v-39c0-3.59125-2.90875-6.5-6.5-6.5zm-52 13c-3.59125 0-6.5 2.90875-6.5 6.5v39c0 3.575 2.925 6.5 6.5 6.5h39c3.59125 0 6.5-2.90875 6.5-6.5h-45.5V507z"/></g></g><g mask="url(#d)"><path fill="#FFF" d="M197 165h614v50H197z"/><path d="M215.7777778 187.7222222c0-3.8291666 3.1152778-6.9444444 6.9444444-6.9444444 3.8291667 0 6.9444445 3.1152778 6.9444445 6.9444444 0 3.8291667-3.1152778 6.9444445-6.9444445 6.9444445-3.8291666 0-6.9444444-3.1152778-6.9444444-6.9444445zm22.2222222 12.5l-7.1583333-7.1583333c1.0111111-1.5333333 1.6027777-3.3680556 1.6027777-5.3416667 0-5.3694444-4.3527777-9.7222222-9.7222222-9.7222222C217.3527778 178 213 182.3527778 213 187.7222222c0 5.3694445 4.3527778 9.7222222 9.7222222 9.7222222 1.9736111 0 3.8083334-.5916666 5.3416667-1.6027777L235.2222222 203 238 200.2222222z" fill="#87A6BC"/></g></g></svg>
					</div>
				</div>
				<div className="jp-landing-apps__clouds jp-clouds-top">
					<img src={ imagePath + '/white-clouds.svg' } />
				</div>
			</div>

			<div className="jp-landing-apps__feature-container">

				{
					// Manage Plugins

					props.userCanManagePlugins
					?	<div className="jp-landing-apps__feature">
							<div className="jp-landing-apps__feature-col jp-landing-apps__feature-img">
								
								<svg width="335" height="233" viewBox="0 0 1005 700" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" aria-labelledby="wpcomPlugins" role="img"><title id="wpcomPlugins">{ __( 'Image of managing your sites plugins on your WordPress.com dashboard' ) }</title><defs><rect id="a" width="1005" height="700" rx="8"/><rect id="b" width="335" height="233" rx="8"/><path id="c" d="M40 19.9996V0H0v39.9992h40z"/><path id="e" d="M40 19.9996V0H0v39.9992h40z"/><path id="g" d="M40 19.9996V0H0v39.9992h40z"/><path id="i" d="M40 19.9996V0H0v39.9992h40z"/><path id="k" d="M40 19.9996V0H0v39.9992h40z"/></defs><g fill="none" fill-rule="evenodd"><g><rect fill="#F3F6F8" width="1005" height="700" rx="8"/><use fill="#F3F6F8" xlinkHref="#a"/></g><g><rect fill="#E9EFF3" width="1005" height="65" rx="8"/><path d="M27.5 31c-4.1425 0-7.5-3.3575-7.5-7.5s3.3575-7.5 7.5-7.5 7.5 3.3575 7.5 7.5-3.3575 7.5-7.5 7.5zm50 0c-4.1425 0-7.5-3.3575-7.5-7.5s3.3575-7.5 7.5-7.5 7.5 3.3575 7.5 7.5-3.3575 7.5-7.5 7.5zm-25 0c-4.1425 0-7.5-3.3575-7.5-7.5s3.3575-7.5 7.5-7.5 7.5 3.3575 7.5 7.5-3.3575 7.5-7.5 7.5z" fill="#4F748E"/></g><path fill="#0087BE" d="M0 47h1005v65H0"/><g><path fill="#FFF" d="M196 176h614v85H196z"/><g transform="translate(740 199)"><mask id="d" fill="#fff"><use xlinkHref="#c"/></mask><path d="M18 31.5352l-9.768-9.768 3.536-3.534L18 24.4652l17.316-17.316c-3.67-4.368-9.166-7.15-15.316-7.15-11.046 0-20 8.956-20 20 0 11.046 8.954 20 20 20s20-8.954 20-20c0-3.056-.706-5.942-1.932-8.532L18 31.5352z" fill="#4AB866" mask="url(#d)"/></g><path fill="#87A6BC" d="M211 191h55v55h-55z"/><path d="M244.5 213v-7.5c0-.828-.672-1.5-1.5-1.5s-1.5.672-1.5 1.5v7.5h-6v-7.5c0-.828-.672-1.5-1.5-1.5s-1.5.672-1.5 1.5v7.5H228v6c0 4.1865 2.4555 7.7895 6 9.4755V234h9v-5.5245c3.5445-1.686 6-5.289 6-9.4755v-6h-4.5z" fill="#FFF"/><path fill="#87A6BC" d="M286 197h225v18H286z"/><path fill="#A8BECE" d="M286 225h165v14H286z"/><g><path fill="#FFF" d="M196 271h614v85H196z"/><g transform="translate(740 294)"><mask id="f" fill="#fff"><use xlinkHref="#e"/></mask><path d="M18 31.5352l-9.768-9.768 3.536-3.534L18 24.4652l17.316-17.316c-3.67-4.368-9.166-7.15-15.316-7.15-11.046 0-20 8.956-20 20 0 11.046 8.954 20 20 20s20-8.954 20-20c0-3.056-.706-5.942-1.932-8.532L18 31.5352z" fill="#4AB866" mask="url(#f)"/></g><path fill="#87A6BC" d="M211 286h55v55h-55z"/><path d="M244.5 308v-7.5c0-.828-.672-1.5-1.5-1.5s-1.5.672-1.5 1.5v7.5h-6v-7.5c0-.828-.672-1.5-1.5-1.5s-1.5.672-1.5 1.5v7.5H228v6c0 4.1865 2.4555 7.7895 6 9.4755V329h9v-5.5245c3.5445-1.686 6-5.289 6-9.4755v-6h-4.5z" fill="#FFF"/><g><path fill="#87A6BC" d="M286 292h225v18H286z"/><path fill="#A8BECE" d="M286 320h165v14H286z"/></g></g><g><path fill="#FFF" d="M196 366h614v85H196z"/><g transform="translate(740 389)"><mask id="h" fill="#fff"><use xlinkHref="#g"/></mask><path d="M18 31.5352l-9.768-9.768 3.536-3.534L18 24.4652l17.316-17.316c-3.67-4.368-9.166-7.15-15.316-7.15-11.046 0-20 8.956-20 20 0 11.046 8.954 20 20 20s20-8.954 20-20c0-3.056-.706-5.942-1.932-8.532L18 31.5352z" fill="#4AB866" mask="url(#h)"/></g><path fill="#87A6BC" d="M211 381h55v55h-55z"/><path d="M244.5 403v-7.5c0-.828-.672-1.5-1.5-1.5s-1.5.672-1.5 1.5v7.5h-6v-7.5c0-.828-.672-1.5-1.5-1.5s-1.5.672-1.5 1.5v7.5H228v6c0 4.1865 2.4555 7.7895 6 9.4755V424h9v-5.5245c3.5445-1.686 6-5.289 6-9.4755v-6h-4.5z" fill="#FFF"/><g><path fill="#87A6BC" d="M286 387h225v18H286z"/><path fill="#A8BECE" d="M286 415h165v14H286z"/></g></g><g><path fill="#FFF" d="M196 461h614v85H196z"/><g transform="translate(740 484)"><mask id="j" fill="#fff"><use xlinkHref="#i"/></mask><path d="M18 31.5352l-9.768-9.768 3.536-3.534L18 24.4652l17.316-17.316c-3.67-4.368-9.166-7.15-15.316-7.15-11.046 0-20 8.956-20 20 0 11.046 8.954 20 20 20s20-8.954 20-20c0-3.056-.706-5.942-1.932-8.532L18 31.5352z" fill="#4AB866" mask="url(#j)"/></g><path fill="#87A6BC" d="M211 476h55v55h-55z"/><path d="M244.5 498v-7.5c0-.828-.672-1.5-1.5-1.5s-1.5.672-1.5 1.5v7.5h-6v-7.5c0-.828-.672-1.5-1.5-1.5s-1.5.672-1.5 1.5v7.5H228v6c0 4.1865 2.4555 7.7895 6 9.4755V519h9v-5.5245c3.5445-1.686 6-5.289 6-9.4755v-6h-4.5z" fill="#FFF"/><g><path fill="#87A6BC" d="M286 482h225v18H286z"/><path fill="#A8BECE" d="M286 510h165v14H286z"/></g></g><g><path fill="#FFF" d="M196 556h614v85H196z"/><g transform="translate(740 579)"><mask id="l" fill="#fff"><use xlinkHref="#k"/></mask><path d="M18 31.5352l-9.768-9.768 3.536-3.534L18 24.4652l17.316-17.316c-3.67-4.368-9.166-7.15-15.316-7.15-11.046 0-20 8.956-20 20 0 11.046 8.954 20 20 20s20-8.954 20-20c0-3.056-.706-5.942-1.932-8.532L18 31.5352z" fill="#4AB866" mask="url(#l)"/></g><path fill="#87A6BC" d="M211 571h55v55h-55z"/><path d="M244.5 593v-7.5c0-.828-.672-1.5-1.5-1.5s-1.5.672-1.5 1.5v7.5h-6v-7.5c0-.828-.672-1.5-1.5-1.5s-1.5.672-1.5 1.5v7.5H228v6c0 4.1865 2.4555 7.7895 6 9.4755V614h9v-5.5245c3.5445-1.686 6-5.289 6-9.4755v-6h-4.5z" fill="#FFF"/><g><path fill="#87A6BC" d="M286 577h225v18H286z"/><path fill="#A8BECE" d="M286 605h165v14H286z"/></g></g></g></g></svg>

							</div>
							<div className="jp-landing-apps__feature-col jp-landing-apps__feature-desc">
								<h3 className="jp-landing__apps-feature-title">{ __( 'Bulk and automatic updates' ) }</h3>
								<p className="jp-landing__apps-feature-text">{ __( 'Most security flaws are found in outdated plugins. Use our Web and Desktop apps to turn on auto-updates or update plugins manually for all your websites in one convenient place.' ) }</p>
								<Button href={ 'https://wordpress.com/plugins/' + props.siteRawUrl }	className="is-primary">
									{ __( 'Manage Plugins' ) }
								</Button>
							</div>
						</div>
					: null
				}

				{
					// Calypso Editor

					props.userCanEditPosts
					?	<div className="jp-landing-apps__feature">
							<div className="jp-landing-apps__feature-col jp-landing-apps__feature-desc">
								<h3 className="jp-landing__apps-feature-title">{ __( 'Focus on your Writing' ) }</h3>
								<p className="jp-landing__apps-feature-text">{ __( 'Our new editor is lightning fast, optimized for writers and eliminates distractions, giving you the ability to focus on your work.' ) }</p>
								<Button href={ 'https://wordpress.com/post/' + props.siteRawUrl }	className="is-primary">
									{ __( 'Try the New Editor' ) }
								</Button>
							</div>
							<div className="jp-landing-apps__feature-col jp-landing-apps__feature-img">
								<svg width="335" height="233" viewBox="0 0 1005 700" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" aria-labelledby="wpcomEditor" role="img"><title id="wpcomEditor">{ __( 'Image of the new post editor on your WordPress.com dashboard' ) }</title><defs><rect id="a" width="1005" height="700" rx="8"/><rect id="b" width="335" height="233" rx="8"/></defs><g fill="none" fill-rule="evenodd"><g><rect fill="#F3F6F8" width="1005" height="700" rx="8"/><use fill="#F3F6F8" xlinkHref="#a"/></g><g><rect fill="#E9EFF3" width="1005" height="65" rx="8"/><path d="M27.5 31c-4.1425 0-7.5-3.3575-7.5-7.5s3.3575-7.5 7.5-7.5 7.5 3.3575 7.5 7.5-3.3575 7.5-7.5 7.5zm50 0c-4.1425 0-7.5-3.3575-7.5-7.5s3.3575-7.5 7.5-7.5 7.5 3.3575 7.5 7.5-3.3575 7.5-7.5 7.5zm-25 0c-4.1425 0-7.5-3.3575-7.5-7.5s3.3575-7.5 7.5-7.5 7.5 3.3575 7.5 7.5-3.3575 7.5-7.5 7.5z" fill="#4F748E"/></g><path fill="#0087BE" d="M0 47h1005v65H0"/><g><g fill="#87A6BC"><path d="M356 450h70v25h-70zM583 450h85v25h-85zM446 450h117v25H446zM196 450h140v25H196z"/></g><g fill="#A8BECE"><path d="M196 498h75v22h-75zM291 498h187v22H291zM498 498h96v22h-96zM614 498h163v22H614z"/></g><g fill="#A8BECE"><path d="M196 545h100v22H196zM316 545h115v22H316zM451 545h58v22h-58zM529 545h180v22H529z"/></g><g fill="#A8BECE"><path d="M196 592h57v22h-57zM270 592h104v22H270zM394 592h167v22H394z"/></g></g><g><path fill="#A8BECE" d="M196 176h614v225H196z"/><path d="M583 229H423v74.44L463 259l58.95 65.5 15.87-18.52c7.98-9.31 22.38-9.31 30.36 0L583 323.27V229zm20 0v120c0 11.05-8.95 20-20 20H423c-11.05 0-20-8.95-20-20V229c0-11.05 8.95-20 20-20h160c11.05 0 20 8.95 20 20zm-90 35c0-8.28 6.72-15 15-15 8.28 0 15 6.72 15 15 0 8.28-6.72 15-15 15-8.28 0-15-6.72-15-15z" fill="#F3F6F8"/></g></g></svg>
							</div>
						</div>
					: null
				}

				{
					// Stats

					canViewStats ? (
						<div className="jp-landing-apps__feature">
							<div className="jp-landing-apps__feature-col jp-landing-apps__feature-img">
								<svg width="335" height="233" viewBox="0 0 1005 700" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" aria-labelledby="wpcomStats" role="img"><title id="wpcomStats">{ __( 'Image of your sites stats on your WordPress.com dashboard' ) }</title><defs><rect id="a" width="1005" height="700" rx="8"/><rect id="b" width="1005" height="700" rx="8"/></defs><g fill="none" fill-rule="evenodd"><g><rect fill="#F3F6F8" width="1005" height="700" rx="8"/><use fill="#F3F6F8" xlinkHref="#a"/></g><g><rect fill="#E9EFF3" width="1005" height="65" rx="8"/><path d="M27.5 31c-4.1425 0-7.5-3.3575-7.5-7.5s3.3575-7.5 7.5-7.5 7.5 3.3575 7.5 7.5-3.3575 7.5-7.5 7.5zm50 0c-4.1425 0-7.5-3.3575-7.5-7.5s3.3575-7.5 7.5-7.5 7.5 3.3575 7.5 7.5-3.3575 7.5-7.5 7.5zm-25 0c-4.1425 0-7.5-3.3575-7.5-7.5s3.3575-7.5 7.5-7.5 7.5 3.3575 7.5 7.5-3.3575 7.5-7.5 7.5z" fill="#4F748E"/></g><path fill="#0087BE" d="M0 47h1005v65H0"/><path fill="#FFF" d="M196 176h614v343H196z"/><g fill="#87A6BC"><path d="M253 329.2941176h58.8235294v152.507707H253zM547.117647 289.5882353h58.8235294v192.641314H547.117647zM694.176471 269h58.8235294v213.235294H694.176471zM326.5294118 345.4705882h58.8235294v136.454264h-58.8235294zM473.588235 321.9411765h58.8235294v160.534429H473.588235zM400.058824 305.7647059h58.8235294v176.587871H400.058824zM620.647059 305.7647059h58.8235294v176.587871H620.647059z"/></g><g><path fill="#FFF" d="M196 529h144v100H196zM352 529h144v100H352zM509 529h144v100H509zM665 529h144v100H665z"/><path fill="#87A6BC" d="M581.5 558l-5.8095 15.642-16.6905.6885 13.0995 10.35225L567.595 600.75l13.905-9.24525 13.905 9.24525-4.5045-16.06725L604 574.3305l-16.6905-.6885M715 562v22.5c0 2.7625 2.2375 5 5 5h22.5V602l13.3125-9.51c2.6275-1.875 4.1875-4.9075 4.1875-8.135V562c0-2.7625-2.2375-5-5-5h-35c-2.7625 0-5 2.2375-5 5M424.5 602s22.5 0 22.5-5.625c0-6.75-10.96875-14.0625-22.5-14.0625S402 589.625 402 596.375C402 602 424.5 602 424.5 602m0-45c6.212812 0 11.25 5.0371875 11.25 11.25s-5.037188 11.25-11.25 11.25-11.25-5.0371875-11.25-11.25S418.287188 557 424.5 557M268.5 589c-9.8575 0-17.315-6.21-20.9475-10 2.6-2.71 7.155-6.6425 13.135-8.6725-1.35 1.705-2.1875 3.83-2.1875 6.1725 0 5.5225 4.4775 10 10 10s10-4.4775 10-10c0-2.3425-.8375-4.4675-2.1875-6.1725 5.9825 2.03 10.54 5.9625 13.135 8.6725-3.6375 3.795-11.0925 10-20.9475 10m0-25c-17.03 0-27.5 15-27.5 15s10.47 15 27.5 15 27.5-15 27.5-15-10.47-15-27.5-15"/></g></g></svg>
							</div>
							<div className="jp-landing-apps__feature-col jp-landing-apps__feature-desc">
								<h2>{ __( 'Connect with your Visitors' ) }</h2>
								<p>{ __( 'Monitor your visitors with advanced stats. Watch for trends, learn what content performs the best and understand your visitors from anywhere in the world.' ) }</p>
								<Button href={ 'https://wordpress.com/stats/' + props.siteRawUrl }	className="is-primary">
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
						// Community

						canViewStats ? (
							''
						) : (
							<div className="jp-landing-apps__feature-col jp-landing-apps__feature-img">
								<svg width="335" height="233" viewBox="0 0 1005 700" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" aria-labelledby="wpcomReader" role="img"><title id="wpcomReader">{ __( 'Image of your WordPress.com reader' ) }</title><defs><rect id="a" width="1005" height="700" rx="8"/><rect id="b" width="335" height="233" rx="8"/><path id="c" d="M158 125h725v575H158z"/></defs><g fill="none" fill-rule="evenodd"><rect fill="#F3F6F8" width="335" height="233" rx="8"/><use fill="#F3F6F8" xlinkHref="#a"/><rect fill="#E9EFF3" width="1005" height="65" rx="8"/><path d="M27.5 31c-4.1425 0-7.5-3.3575-7.5-7.5s3.3575-7.5 7.5-7.5 7.5 3.3575 7.5 7.5-3.3575 7.5-7.5 7.5zm50 0c-4.1425 0-7.5-3.3575-7.5-7.5s3.3575-7.5 7.5-7.5 7.5 3.3575 7.5 7.5-3.3575 7.5-7.5 7.5zm-25 0c-4.1425 0-7.5-3.3575-7.5-7.5s3.3575-7.5 7.5-7.5 7.5 3.3575 7.5 7.5-3.3575 7.5-7.5 7.5z" fill="#4F748E"/><path fill="#0087BE" d="M0 47h1005v65H0"/><mask id="d" fill="#fff"><use xlinkHref="#c"/></mask><g mask="url(#d)"><path fill="#FFF" d="M197 326h614v151H197z"/><g fill="#87A6BC"><path d="M377 346h70v20h-70zM467 346h117v20H467zM217 346h140v20H217z"/></g><g fill="#A8BECE"><path d="M217 388h75v14h-75zM312 388h187v14H312zM519 388h96v14h-96zM635 388h100v14H635z"/></g><g fill="#A8BECE"><path d="M217 415h100v14H217zM337 415h115v14H337zM472 415h58v14h-58zM550 415h200v14H550z"/></g><g fill="#A8BECE"><path d="M217 442h57v14h-57zM291 442h104v14H291zM415 442h167v14H415z"/></g><g><path fill="#A8BECE" d="M197 176h614v150H197z"/><path d="M544 221h-80v37.22L484 236l29.475 32.75 7.935-9.26c3.99-4.655 11.19-4.655 15.18 0l7.41 8.645V221zm10 0v60c0 5.525-4.475 10-10 10h-80c-5.525 0-10-4.475-10-10v-60c0-5.525 4.475-10 10-10h80c5.525 0 10 4.475 10 10zm-45 17.5c0-4.14 3.36-7.5 7.5-7.5 4.14 0 7.5 3.36 7.5 7.5 0 4.14-3.36 7.5-7.5 7.5-4.14 0-7.5-3.36-7.5-7.5z" fill="#FFF"/></g></g><g mask="url(#d)"><path fill="#FFF" d="M197 705h614v151H197z"/><g fill="#87A6BC"><path d="M377 725h70v20h-70zM467 725h117v20H467zM217 725h140v20H217z"/></g><g fill="#A8BECE"><path d="M217 767h75v14h-75zM312 767h187v14H312zM519 767h96v14h-96zM635 767h100v14H635z"/></g><g fill="#A8BECE"><path d="M217 794h100v14H217zM337 794h115v14H337zM472 794h58v14h-58zM550 794h200v14H550z"/></g><g fill="#A8BECE"><path d="M217 821h57v14h-57zM291 821h104v14H291zM415 821h167v14H415z"/></g><g><path fill="#A8BECE" d="M197 555h614v150H197z"/><path d="M544 600h-80v37.22L484 615l29.475 32.75 7.935-9.26c3.99-4.655 11.19-4.655 15.18 0l7.41 8.645V600zm10 0v60c0 5.525-4.475 10-10 10h-80c-5.525 0-10-4.475-10-10v-60c0-5.525 4.475-10 10-10h80c5.525 0 10 4.475 10 10zm-45 17.5c0-4.14 3.36-7.5 7.5-7.5 4.14 0 7.5 3.36 7.5 7.5 0 4.14-3.36 7.5-7.5 7.5-4.14 0-7.5-3.36-7.5-7.5z" fill="#FFF"/></g></g></g></svg>
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
								<svg width="335" height="233" viewBox="0 0 1005 700" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" aria-labelledby="wpcomReader" role="img"><title id="wpcomReader">{ __( 'Image of your WordPress.com reader' ) }</title><defs><rect id="a" width="1005" height="700" rx="8"/><rect id="b" width="335" height="233" rx="8"/><path id="c" d="M158 125h725v575H158z"/></defs><g fill="none" fill-rule="evenodd"><rect fill="#F3F6F8" width="335" height="233" rx="8"/><use fill="#F3F6F8" xlinkHref="#a"/><rect fill="#E9EFF3" width="1005" height="65" rx="8"/><path d="M27.5 31c-4.1425 0-7.5-3.3575-7.5-7.5s3.3575-7.5 7.5-7.5 7.5 3.3575 7.5 7.5-3.3575 7.5-7.5 7.5zm50 0c-4.1425 0-7.5-3.3575-7.5-7.5s3.3575-7.5 7.5-7.5 7.5 3.3575 7.5 7.5-3.3575 7.5-7.5 7.5zm-25 0c-4.1425 0-7.5-3.3575-7.5-7.5s3.3575-7.5 7.5-7.5 7.5 3.3575 7.5 7.5-3.3575 7.5-7.5 7.5z" fill="#4F748E"/><path fill="#0087BE" d="M0 47h1005v65H0"/><mask id="d" fill="#fff"><use xlinkHref="#c"/></mask><g mask="url(#d)"><path fill="#FFF" d="M197 326h614v151H197z"/><g fill="#87A6BC"><path d="M377 346h70v20h-70zM467 346h117v20H467zM217 346h140v20H217z"/></g><g fill="#A8BECE"><path d="M217 388h75v14h-75zM312 388h187v14H312zM519 388h96v14h-96zM635 388h100v14H635z"/></g><g fill="#A8BECE"><path d="M217 415h100v14H217zM337 415h115v14H337zM472 415h58v14h-58zM550 415h200v14H550z"/></g><g fill="#A8BECE"><path d="M217 442h57v14h-57zM291 442h104v14H291zM415 442h167v14H415z"/></g><g><path fill="#A8BECE" d="M197 176h614v150H197z"/><path d="M544 221h-80v37.22L484 236l29.475 32.75 7.935-9.26c3.99-4.655 11.19-4.655 15.18 0l7.41 8.645V221zm10 0v60c0 5.525-4.475 10-10 10h-80c-5.525 0-10-4.475-10-10v-60c0-5.525 4.475-10 10-10h80c5.525 0 10 4.475 10 10zm-45 17.5c0-4.14 3.36-7.5 7.5-7.5 4.14 0 7.5 3.36 7.5 7.5 0 4.14-3.36 7.5-7.5 7.5-4.14 0-7.5-3.36-7.5-7.5z" fill="#FFF"/></g></g><g mask="url(#d)"><path fill="#FFF" d="M197 705h614v151H197z"/><g fill="#87A6BC"><path d="M377 725h70v20h-70zM467 725h117v20H467zM217 725h140v20H217z"/></g><g fill="#A8BECE"><path d="M217 767h75v14h-75zM312 767h187v14H312zM519 767h96v14h-96zM635 767h100v14H635z"/></g><g fill="#A8BECE"><path d="M217 794h100v14H217zM337 794h115v14H337zM472 794h58v14h-58zM550 794h200v14H550z"/></g><g fill="#A8BECE"><path d="M217 821h57v14h-57zM291 821h104v14H291zM415 821h167v14H415z"/></g><g><path fill="#A8BECE" d="M197 555h614v150H197z"/><path d="M544 600h-80v37.22L484 615l29.475 32.75 7.935-9.26c3.99-4.655 11.19-4.655 15.18 0l7.41 8.645V600zm10 0v60c0 5.525-4.475 10-10 10h-80c-5.525 0-10-4.475-10-10v-60c0-5.525 4.475-10 10-10h80c5.525 0 10 4.475 10 10zm-45 17.5c0-4.14 3.36-7.5 7.5-7.5 4.14 0 7.5 3.36 7.5 7.5 0 4.14-3.36 7.5-7.5 7.5-4.14 0-7.5-3.36-7.5-7.5z" fill="#FFF"/></g></g></g></svg>
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

					<img src={ imagePath + '/apps/triple-devices.svg' } className="jp-landing-apps__devices" role="img" alt={ __( 'Example of three devices to use the WordPress apps. An iPhone, Android phone, and a apple laptop computer.' ) } />
				</div>

				<div className="jp-landing-apps__downloads">
					<h3 className="jp-landing-apps__subtitle">{ __( 'In Your Pocket' ) }</h3>
					<p className="jp-landing-apps__sub-description">{ __( 'Publish content, track stats, moderate comments and so much more from anywhere in the world. Our mobile apps are open source, free and available to you on Apple or Android devices.' ) }</p>

					<p className="jp-landing-apps__btn-container">
						<Button href="http://itunes.apple.com/us/app/wordpress/id335703880?mt=8" title={ __( 'WordPress.com in the App Store' ) } className="jp-app-button button-ios">
							<svg width="28" height="28" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" aria-labelledby="wpcomIosbtn" role="img"><title id="wpcomIosbtn">{ __( 'Download the free WordPress app for your iPhone' ) }</title><path d="M74.7,62.2c-3.5-3.2-5.2-7.2-5.3-12.1c-0.1-6.2,2.8-11.1,8.5-14.5c-3.2-4.5-8-7.1-14.4-7.6c-2.4-0.2-5.2,0.3-8.7,1.5
		c-3.6,1.3-5.7,2-6.4,2c-0.8,0-2.8-0.6-5.7-1.7c-3-1.1-5.4-1.7-7.2-1.7c-3.4,0.1-6.5,0.9-9.4,2.6c-2.9,1.7-5.2,4-6.9,7
		C17.1,41.5,16,45.9,16,51c0,4.4,0.8,9,2.4,13.8c1.5,4.4,3.5,8.2,5.8,11.6c2.2,3.1,4,5.3,5.5,6.6c2.3,2.1,4.6,3.2,6.9,3.1
		c1.5-0.1,3.5-0.6,6-1.6c2.5-1,4.8-1.5,6.9-1.5c2,0,4.3,0.5,6.7,1.5c2.4,1,4.5,1.5,6.2,1.5c2.4-0.1,4.7-1,6.8-3
		c1.4-1.2,3.1-3.3,5.3-6.4c1.6-2.2,2.9-4.7,4.1-7.3c0.5-1.1,0.9-2.3,1.3-3.5C78.1,64.9,76.3,63.7,74.7,62.2z M59.8,22.2
		c2.8-3.3,4.2-6.8,4.2-10.6v0c0-0.5,0-1-0.1-1.5c-1.9,0.1-4,0.7-6.1,1.7c-2.2,1.1-4,2.4-5.4,4C49.6,19,48,22.9,48,26.5
		c0,0.5,0,1,0.1,1.4C52.5,28.3,56.5,26.1,59.8,22.2z"></path></svg>
							iOS</Button>
						<Button href="http://play.google.com/store/apps/details?id=org.wordpress.android" title={ __( 'WordPress.com in Google Play' ) } className="jp-app-button button-android">
							<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" aria-labelledby="wpcomAndroidbtn" role="img"><title id="wpcomAndroidbtn">{ __( 'Download the free WordPress app for your Android based phone' ) }</title><path d="M25,34.1c-2.1,0-4,1.7-4,3.7v16.6c0,2,1.9,3.7,4,3.7c2.1,0,4-1.7,4-3.7V37.8C29,35.7,27.1,34.1,25,34.1z M31,35v29.5
		c0,1.1,0.5,2.5,1.6,2.5H37v8.8c0,2,1.9,3.7,4,3.7c2.1,0,4-1.7,4-3.7V67h6v8.8c0,2,1.9,3.7,4,3.7c2.1,0,4-1.7,4-3.7V67h4.4
		c1.2,0,1.6-1.3,1.6-2.5V50V35h-1.6H31z M56.4,20.1l3-4.1c0.1-0.1,0-0.2-0.2-0.3c-0.2-0.1-0.4-0.1-0.4,0l-3.1,4.3
		c-2.1-0.8-4.6-1.3-7.7-1.3c-3.1,0-5.7,0.5-7.8,1.3l-3.1-4.3c-0.1-0.1-0.3-0.1-0.4,0.1c-0.2,0.1-0.3,0.3-0.2,0.4l3,4
		c-8.6,3.8-8.9,13-8.9,13h34.7C65.3,33,65,23.9,56.4,20.1z M40.4,27.8c-1.2,0-2.1-0.9-2.1-2.1c0-1.1,0.9-2.1,2.1-2.1
		c1.2,0,2.1,0.9,2.1,2.1C42.5,26.9,41.5,27.8,40.4,27.8z M55.6,27.8c-1.2,0-2.1-0.9-2.1-2.1c0-1.1,0.9-2.1,2.1-2.1
		c1.2,0,2.1,0.9,2.1,2.1C57.7,26.9,56.8,27.8,55.6,27.8z M71,34.1c-2.1,0-4,1.7-4,3.7v16.6c0,2,1.9,3.7,4,3.7c2.1,0,4-1.7,4-3.7V37.8
		C75,35.7,73.1,34.1,71,34.1z"></path></svg>
							Android</Button>
					</p>

					<h3 className="jp-landing-apps__subtitle">{ __( 'On Your Desktop' ) }</h3>
					<p className="jp-landing-apps__sub-description">{ __( 'A desktop app that gives WordPress a permanent home on your computer. Not to mention the distraction free environment you get writing outside of a web browser.' ) }</p>

					<p className="jp-landing-apps__btn-container">
						<Button href="https://apps.wordpress.com/d/osx" title={ __( 'WordPress.com for Mac OS X' ) } className="jp-app-button button-macosx">
							<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-labelledby="wpcomMaxosxbtn" role="img"><title id="wpcomMacosxbtn">{ __( 'Download the free WordPress app for your apple computer' ) }</title><path d="M24,8C15.163,8,8,15.163,8,24s7.163,16,16,16s16-7.163,16-16S32.837,8,24,8z M31.31,33.849h-0.986
		l-6.31-9.152h-0.058l-6.31,9.152h-0.972l6.817-9.82l-6.846-9.878h0.986l6.339,9.181h0.058l6.353-9.181h0.972l-6.861,9.878
		L31.31,33.849z"></path></svg>
							Mac OS X</Button>
						<Button href="https://apps.wordpress.com/d/windows" title={ __( 'WordPress.com for Windows' ) } className="jp-app-button button-windows">
							<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-labelledby="wpcomWinbtn" role="img"><title id="wpcomWinbtn">{ __( 'Download the free WordPress app for your PC ' ) }</title><path d="M8,35.5l13,2.031V25H8V35.5z M8,24h13V10.172L8,12V24z M22,37.688L40,40.5V25H22V37.688z M22,10.031
		V24h18V7.5L22,10.031z"></path></svg>
							Windows</Button>
						<Button href="https://apps.wordpress.com/d/linux" title={ __( 'WordPress.com for Linux' ) } className="jp-app-button button-linux">
							<svg xmlns="http://www.w3.org/2000/svg" width="21" height="24" viewBox="0 0 21 24" aria-labelledby="wpcomlinuxbtn" role="img"><title id="wpcomLinuxbtn">{ __( 'Download the free WordPress app for your Linux machine' ) }</title><path d="M9.8 5.9C9.8 5.9 9.8 5.9 9.8 5.9L9.7 5.9C9.6 5.9 9.6 5.9 9.5 5.8 9.5 5.8 9.4 5.7 9.4 5.6 9.4 5.5 9.4 5.5 9.5 5.5L9.7 5.6C9.8 5.7 9.8 5.8 9.8 5.9M8.4 5.1C8.4 4.7 8.3 4.4 8 4.4 8 4.4 8 4.5 7.9 4.5L7.9 4.7 8.2 4.7C8.2 4.8 8.3 4.9 8.3 5.1L8.4 5.1M11.2 4.7C11.3 4.7 11.4 4.8 11.5 5.1L11.7 5.1C11.6 5 11.6 4.9 11.6 4.8 11.6 4.8 11.6 4.7 11.5 4.6 11.4 4.5 11.3 4.4 11.3 4.4 11.3 4.4 11.2 4.5 11.1 4.5 11.1 4.6 11.2 4.6 11.2 4.7M8.8 5.9C8.7 5.9 8.7 5.9 8.7 5.9 8.7 5.8 8.7 5.7 8.8 5.6 9 5.6 9.1 5.5 9.1 5.5 9.1 5.5 9.1 5.6 9.1 5.6 9.1 5.7 9.1 5.8 8.9 5.9L8.8 5.9M7.9 5.9C7.6 5.7 7.6 5.5 7.6 5.1 7.6 4.8 7.6 4.7 7.7 4.5 7.8 4.4 7.9 4.3 8.1 4.3 8.3 4.3 8.3 4.4 8.5 4.5 8.6 4.8 8.7 5 8.7 5.2L8.7 5.3 8.7 5.4 8.7 5.4 8.7 5.3C8.8 5.3 8.8 5.2 8.8 4.8 8.8 4.6 8.8 4.4 8.7 4.1 8.5 3.9 8.3 3.7 8 3.7 7.8 3.7 7.6 3.9 7.5 4.1 7.3 4.4 7.3 4.7 7.3 5.1 7.3 5.4 7.4 5.7 7.7 6 7.8 5.9 7.9 5.9 7.9 5.9M17.8 17C17.9 17 17.9 17 17.9 16.9 17.9 16.7 17.8 16.5 17.6 16.3 17.3 16 16.9 15.9 16.5 15.8 16.4 15.8 16.3 15.8 16.3 15.8 16.2 15.8 16.2 15.8 16.2 15.8 16.1 15.8 15.9 15.8 15.8 15.8 16.1 15 16.2 14.4 16.2 13.8 16.2 13 16 12.5 15.7 12 15.4 11.5 15.1 11.3 14.7 11.2 14.6 11.3 14.6 11.3 14.6 11.4 15 11.5 15.4 11.8 15.6 12.3 15.8 12.9 15.9 13.3 15.9 13.9 15.9 14.3 15.8 15 15.5 15.8 15.2 16 14.9 16.3 14.7 16.7 14.7 16.8 14.7 16.8 14.7 16.8 14.7 16.8 14.8 16.8 14.9 16.6 15.1 16.5 15.1 16.3 15.3 16.2 15.5 16.1 15.7 16 15.9 16 16.3 16 16.7 16.1 16.9 16.2 17.3 16.3 17.4 16.4 17.5 16.5 17.6 16.6 17.7 16.7 17.7 16.8 17.7 16.9 17.8 17 17.8 17M10.6 5.5C10.5 5.5 10.5 5.3 10.5 5.2 10.5 4.8 10.5 4.7 10.6 4.4 10.8 4.3 10.9 4.2 11.1 4.2 11.3 4.2 11.5 4.4 11.7 4.5 11.7 4.8 11.8 4.9 11.8 5.2 11.8 5.5 11.7 5.8 11.3 5.9 11.3 5.9 11.4 5.9 11.5 5.9 11.7 5.9 11.7 6 11.9 6.1 12 5.6 12.1 5.3 12.1 4.9 12.1 4.4 12 4.1 11.8 3.9 11.6 3.7 11.3 3.6 11 3.6 10.8 3.6 10.6 3.7 10.3 3.8 10.2 4 10.1 4.2 10.1 4.4 10.1 4.8 10.2 5.2 10.3 5.5 10.4 5.5 10.5 5.5 10.6 5.5M11.5 6.8C10.5 7.5 9.7 7.8 9.1 7.8 8.5 7.8 7.9 7.6 7.5 7.2 7.6 7.4 7.6 7.5 7.7 7.6L8.2 8.1C8.5 8.4 8.9 8.5 9.3 8.5 9.8 8.5 10.5 8.2 11.3 7.7L12 7.2C12.1 7 12.3 6.9 12.3 6.7 12.3 6.6 12.3 6.5 12.2 6.5 12.1 6.3 11.7 6.1 10.9 5.9 10.2 5.5 9.7 5.4 9.4 5.4 9.1 5.4 8.7 5.5 8.2 5.9 7.7 6.2 7.4 6.5 7.4 6.8 7.4 6.8 7.5 6.9 7.6 7 8 7.4 8.5 7.7 9 7.7 9.6 7.7 10.4 7.4 11.4 6.6L11.4 6.7C11.5 6.7 11.5 6.8 11.5 6.8M13.3 22.8C13.6 23.4 14.2 23.7 14.8 23.7 15 23.7 15.1 23.6 15.3 23.6 15.4 23.5 15.6 23.5 15.7 23.4 15.8 23.4 15.8 23.3 15.9 23.3 16.1 23.2 16.1 23.2 16.2 23.1L17.5 22C17.8 21.7 18.1 21.5 18.5 21.3 18.8 21.1 19.2 21 19.3 20.9 19.6 20.8 19.7 20.8 19.9 20.6 19.9 20.5 20 20.4 20 20.2 20 19.9 19.9 19.8 19.7 19.6 19.6 19.5 19.4 19.4 19.2 19.4 19.1 19.3 18.9 19.2 18.7 19 18.5 18.8 18.4 18.5 18.3 18.1L18.2 17.7C18.1 17.4 18.1 17.3 18.1 17.2 18.1 17.2 18.1 17.2 18 17.2 17.9 17.2 17.7 17.2 17.7 17.4 17.5 17.5 17.3 17.7 17.2 17.8 17.1 18 16.9 18.1 16.7 18.3 16.5 18.4 16.2 18.5 16.1 18.5 15.4 18.5 15.1 18.3 14.9 17.9 14.7 17.7 14.7 17.4 14.6 17.1 14.4 16.9 14.3 16.9 14.2 16.9 13.8 16.9 13.6 17.3 13.6 18.1L13.6 18.4 13.6 19.3 13.6 20 13.6 20.3 13.6 20.6C13.6 20.6 13.6 20.8 13.6 21 13.5 21.3 13.5 21.6 13.5 21.9L13.3 22.7 13.3 22.8M1.9 22.3C2.6 22.4 3.4 22.7 4.4 23 5.4 23.4 5.9 23.6 6.2 23.6 6.7 23.6 7.2 23.3 7.5 22.8 7.6 22.7 7.6 22.5 7.6 22.3 7.6 21.6 7.2 20.6 6.3 19.5L5.7 18.7C5.6 18.6 5.5 18.4 5.3 18.1 5.2 17.8 5 17.5 4.9 17.3 4.8 17.2 4.6 17 4.4 16.8 4.2 16.6 4 16.5 3.7 16.4 3.4 16.5 3.1 16.6 3 16.8 2.9 16.9 2.9 17.1 2.8 17.3 2.8 17.4 2.8 17.5 2.7 17.6 2.6 17.6 2.5 17.7 2.3 17.7 2.3 17.7 2.2 17.7 2.1 17.7L1.9 17.7C1.4 17.7 1.2 17.8 1 17.8 0.8 18.1 0.7 18.3 0.7 18.6 0.7 18.7 0.7 19 0.8 19.3 0.9 19.5 0.9 19.8 0.9 19.9 0.9 20.3 0.8 20.6 0.6 20.9 0.4 21.3 0.3 21.5 0.3 21.7 0.4 22 0.9 22.2 1.9 22.3M4.5 15.2C4.5 14.6 4.6 14 4.9 13.3 5.2 12.6 5.5 12.1 5.8 11.8 5.8 11.7 5.7 11.7 5.7 11.7L5.6 11.6C5.3 11.9 5.1 12.4 4.7 13.2 4.4 13.9 4.2 14.6 4.2 15.1 4.2 15.4 4.3 15.7 4.5 16 4.7 16.3 5.1 16.6 5.7 17.1L6.6 17.7C7.5 18.4 7.9 19 7.9 19.3 7.9 19.5 7.9 19.6 7.6 19.8 7.5 20 7.3 20.1 7.1 20.1 7.1 20.1 7 20.1 7 20.1 7 20.2 7.1 20.3 7.3 20.6 7.6 21.1 8.3 21.3 9.3 21.3 11 21.3 12.4 20.6 13.4 19.2 13.4 18.8 13.4 18.5 13.3 18.4L13.3 18.1C13.3 17.6 13.4 17.2 13.5 17 13.7 16.7 13.9 16.6 14.1 16.6 14.3 16.6 14.4 16.7 14.6 16.8 14.6 16.2 14.6 15.6 14.6 15.2 14.6 14.4 14.6 13.9 14.5 13.3 14.4 12.8 14.3 12.4 14.1 12.1 13.9 11.9 13.8 11.6 13.6 11.4 13.5 11.2 13.4 10.9 13.2 10.7 13.1 10.4 13.1 10.1 13.1 9.8 12.8 9.4 12.7 9 12.4 8.6 12.3 8.2 12.1 7.8 12 7.5L11.3 8C10.5 8.6 9.8 8.8 9.3 8.8 8.8 8.8 8.4 8.7 8.2 8.4L7.7 8C7.7 8.3 7.6 8.6 7.5 8.9L7 9.8C6.7 10.4 6.6 10.7 6.6 10.9 6.6 11.1 6.5 11.3 6.5 11.3L5.9 12.4C5.3 13.6 5 14.7 5 15.6 5 15.8 5 16 5 16.2 4.7 15.9 4.5 15.6 4.5 15.2M10.1 22.6C9.1 22.6 8.3 22.8 7.8 23L7.8 23C7.4 23.5 6.9 23.7 6.3 23.7 5.9 23.7 5.3 23.6 4.5 23.3 3.7 23 2.9 22.8 2.3 22.6 2.2 22.6 2.1 22.6 1.9 22.6 1.7 22.5 1.4 22.5 1.3 22.5 1.1 22.4 0.9 22.4 0.7 22.3 0.5 22.2 0.4 22.1 0.2 22 0.1 21.9 0.1 21.8 0.1 21.7 0.1 21.6 0.1 21.4 0.2 21.3 0.2 21.2 0.3 21.1 0.3 21.1 0.4 21 0.4 20.9 0.4 20.8 0.5 20.7 0.5 20.7 0.6 20.6 0.6 20.5 0.6 20.4 0.6 20.4 0.7 20.3 0.7 20.2 0.7 20.1 0.7 20 0.6 19.8 0.6 19.4 0.5 19 0.5 18.7 0.5 18.6 0.5 18.3 0.6 18 0.7 17.8 0.9 17.6 1.1 17.5 1.2 17.5L2.2 17.5C2.2 17.5 2.3 17.4 2.5 17.4 2.6 17.2 2.6 17.1 2.6 17 2.7 16.9 2.7 16.9 2.7 16.8 2.7 16.8 2.7 16.7 2.8 16.7 2.8 16.6 2.8 16.6 2.9 16.5 2.8 16.4 2.8 16.3 2.8 16.2 2.8 16.1 2.8 16 2.8 16 2.8 15.7 2.9 15.3 3.2 14.8L3.5 14.3C3.7 13.9 3.9 13.5 4 13.2 4.2 12.9 4.3 12.4 4.5 11.8 4.6 11.2 4.9 10.7 5.4 10.1L5.9 9.4C6.4 9 6.6 8.6 6.8 8.2 6.9 7.9 7 7.5 7 7.2 7 7.1 7 6.6 6.9 5.8 6.8 5 6.8 4.2 6.8 3.5 6.8 3 6.8 2.6 6.9 2.2 7 1.8 7.2 1.4 7.5 1.1 7.7 0.7 8 0.4 8.5 0.3 9 0.1 9.5 0 10.1 0 10.4 0 10.6 0 10.9 0.1 11.1 0.1 11.4 0.2 11.8 0.4 12.1 0.5 12.4 0.7 12.7 0.9 13 1.1 13.2 1.5 13.5 1.9 13.6 2.4 13.8 2.9 13.9 3.5 13.9 3.9 13.9 4.3 14 4.9 14 5.3 14.1 5.6 14.1 5.9 14.2 6.1 14.2 6.4 14.3 6.8 14.3 7.1 14.4 7.5 14.6 7.7 14.7 8 14.9 8.3 15.1 8.6 15.4 9 15.7 9.4 16 9.9 16.7 10.7 17.3 11.6 17.6 12.4 18 13.2 18.2 14.2 18.2 15.3 18.2 15.9 18.1 16.4 18 16.9 18.1 16.9 18.2 17 18.3 17.1 18.4 17.2 18.4 17.5 18.5 17.8L18.6 18.4C18.7 18.6 18.8 18.7 19 18.9 19.1 19 19.3 19.2 19.5 19.2 19.7 19.3 19.9 19.4 20.1 19.6 20.3 19.7 20.3 19.9 20.3 20.1 20.3 20.3 20.3 20.5 20.1 20.7 19.9 20.8 19.8 21 19.5 21 19.4 21.1 19.1 21.3 18.6 21.5 18.2 21.7 17.8 22 17.4 22.3L16.6 23C16.3 23.3 16 23.5 15.8 23.7 15.5 23.8 15.2 23.9 14.9 23.9L14.3 23.8C13.7 23.7 13.3 23.3 13.1 22.9 11.8 22.7 10.8 22.6 10.1 22.6"/></svg>
							Linux</Button>
					</p>
				</div>
			</div>

		</div>
	);
};

export default connect(
	( state ) => {
		return {
			userCanViewStats: userCanViewStats( state ),
			userCanManagePlugins: userCanManagePlugins( state ),
			userCanEditPosts: userCanEditPosts( state )
		};
	}
)( Apps );
