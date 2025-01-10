import { localizeUrl } from '@automattic/i18n-utils';
import { isComingSoon } from '@automattic/jetpack-shared-extension-utils';
import { ExternalLink } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { getQueryArg } from '@wordpress/url';
import { wpcomTrackEvent } from '../../../../common/tracks';
import { getEditorType } from './get-editor-type';
import type { WpcomStep } from '../../../../common/tour-kit';

interface TourAsset {
	desktop?: { src: string; type: string };
	mobile?: { src: string; type: string };
}

/**
 * Get the tour asset by the key.
 *
 * @param  key - The key of the tour asset.
 * @return {TourAsset | undefined} The requested tour asset, or undefined if not found.
 */
function getTourAssets( key: string ): TourAsset | undefined {
	const CDN_PREFIX = 'https://s0.wp.com/i/editor-welcome-tour';
	const tourAssets = {
		addBlock: {
			desktop: { src: `${ CDN_PREFIX }/slide-add-block.gif`, type: 'image/gif' },
			mobile: { src: `${ CDN_PREFIX }/slide-add-block_mobile.gif`, type: 'image/gif' },
		},
		allBlocks: { desktop: { src: `${ CDN_PREFIX }/slide-all-blocks.gif`, type: 'image/gif' } },
		finish: { desktop: { src: `${ CDN_PREFIX }/slide-finish.png`, type: 'image/gif' } },
		makeBold: { desktop: { src: `${ CDN_PREFIX }/slide-make-bold.gif`, type: 'image/gif' } },
		moreOptions: {
			desktop: { src: `${ CDN_PREFIX }/slide-more-options.gif`, type: 'image/gif' },
			mobile: { src: `${ CDN_PREFIX }/slide-more-options_mobile.gif`, type: 'image/gif' },
		},
		moveBlock: {
			desktop: { src: `${ CDN_PREFIX }/slide-move-block.gif`, type: 'image/gif' },
			mobile: { src: `${ CDN_PREFIX }/slide-move-block_mobile.gif`, type: 'image/gif' },
		},
		findYourWay: {
			desktop: { src: `${ CDN_PREFIX }/slide-find-your-way.gif`, type: 'image/gif' },
		},
		undo: { desktop: { src: `${ CDN_PREFIX }/slide-undo.gif`, type: 'image/gif' } },
		welcome: {
			desktop: { src: `${ CDN_PREFIX }/slide-welcome.png`, type: 'image/png' },
			mobile: { src: `${ CDN_PREFIX }/slide-welcome_mobile.jpg`, type: 'image/jpeg' },
		},
		editYourSite: {
			desktop: {
				src: `https://s.w.org/images/block-editor/edit-your-site.gif?1`,
				type: 'image/gif',
			},
			mobile: {
				src: `https://s.w.org/images/block-editor/edit-your-site.gif?1`,
				type: 'image/gif',
			},
		},
		videomakerWelcome: {
			desktop: { src: `${ CDN_PREFIX }/slide-videomaker-welcome.png`, type: 'image/png' },
		},
		videomakerEdit: {
			desktop: { src: `${ CDN_PREFIX }/slide-videomaker-edit.png`, type: 'image/png' },
		},
	} as { [ key: string ]: TourAsset };

	return tourAssets[ key ];
}

/**
 * Get the steps of the tour
 *
 * @param  localeSlug           - The slug of the locale.
 * @param  referencePositioning - The reference positioning.
 * @param  isSiteEditor         - Whether is the site editor.
 * @param  themeName            - The name of the theme.
 * @param  siteIntent           - The intent of the current site.
 * @return {WpcomStep[]} The steps of the tour.
 */
function useTourSteps(
	localeSlug: string,
	referencePositioning = false,
	isSiteEditor = false,
	themeName: string | null = null,
	siteIntent: string | undefined = undefined
): WpcomStep[] {
	const isVideoMaker = 'videomaker' === ( themeName ?? '' );
	const isPatternAssembler = !! getQueryArg( window.location.href, 'assembler' );
	const isMobile = useViewportMatch( 'mobile', '<' );
	const siteEditorCourseUrl = `https://wordpress.com/home/${ window.location.hostname }?courseSlug=site-editor-quick-start`;
	const editorType = getEditorType();
	const onSiteEditorCourseLinkClick = () => {
		wpcomTrackEvent( 'calypso_editor_wpcom_tour_site_editor_course_link_click', {
			is_pattern_assembler: isPatternAssembler,
			intent: siteIntent,
			editor_type: editorType,
		} );
	};

	return [
		{
			slug: 'welcome',
			meta: {
				heading: isPatternAssembler
					? __( 'Nice job! Your new page is set up.', 'jetpack-mu-wpcom' )
					: _x( 'Welcome to WordPress!', 'workaround', 'jetpack-mu-wpcom' ),
				descriptions: {
					desktop: ( () => {
						if ( isPatternAssembler ) {
							return createInterpolateElement(
								__(
									'This is the Site Editor, where you can change everything about your site, including adding content to your homepage. <link_to_site_editor_course>Watch these short videos</link_to_site_editor_course> and take this tour to get started.',
									'jetpack-mu-wpcom'
								),
								{
									link_to_site_editor_course: (
										<ExternalLink
											href={ siteEditorCourseUrl }
											onClick={ onSiteEditorCourseLinkClick }
											children={ null }
										/>
									),
								}
							);
						}

						return isSiteEditor
							? __(
									'Take this short, interactive tour to learn the fundamentals of the WordPress Site Editor.',
									'jetpack-mu-wpcom'
							  )
							: _x(
									'Take this short, interactive tour to learn the fundamentals of the WordPress editor.',
									'workaround',
									'jetpack-mu-wpcom'
							  );
					} )(),
					mobile: null,
				},
				imgSrc: getTourAssets( isVideoMaker ? 'videomakerWelcome' : 'welcome' ),
				imgLink: isPatternAssembler
					? {
							href: siteEditorCourseUrl,
							playable: true,
							onClick: onSiteEditorCourseLinkClick,
					  }
					: undefined,
			},
			options: {
				classNames: {
					desktop: 'wpcom-editor-welcome-tour__step',
					mobile: [ 'is-with-extra-padding', 'calypso_editor_wpcom_draft_post_modal_show' ],
				},
			},
		},
		{
			slug: 'everything-is-a-block',
			meta: {
				heading: __( 'Everything is a block', 'jetpack-mu-wpcom' ),
				descriptions: {
					desktop: __(
						'In the WordPress Editor, paragraphs, images, and videos are all blocks.',
						'jetpack-mu-wpcom'
					),
					mobile: null,
				},
				imgSrc: getTourAssets( 'allBlocks' ),
			},
			options: {
				classNames: {
					desktop: 'wpcom-editor-welcome-tour__step',
					mobile: 'wpcom-editor-welcome-tour__step',
				},
			},
		},
		{
			slug: 'add-block',
			...( referencePositioning && {
				referenceElements: {
					mobile:
						'.edit-post-header .edit-post-header__toolbar .components-button.edit-post-header-toolbar__inserter-toggle',
					desktop:
						'.edit-post-header .edit-post-header__toolbar .components-button.edit-post-header-toolbar__inserter-toggle',
				},
			} ),
			meta: {
				heading: __( 'Adding a new block', 'jetpack-mu-wpcom' ),
				descriptions: {
					desktop: __(
						'Click + to open the inserter. Then click the block you want to add.',
						'jetpack-mu-wpcom'
					),
					mobile: __(
						'Tap + to open the inserter. Then tap the block you want to add.',
						'jetpack-mu-wpcom'
					),
				},
				imgSrc: getTourAssets( 'addBlock' ),
			},
			options: {
				classNames: {
					desktop: 'wpcom-editor-welcome-tour__step',
					mobile: [ 'is-with-extra-padding', 'wpcom-editor-welcome-tour__step' ],
				},
			},
		},
		{
			slug: 'settings',
			...( referencePositioning && {
				referenceElements: {
					mobile:
						'.edit-post-header .edit-post-header__settings .interface-pinned-items > button:nth-child(1)',
					desktop:
						'.edit-post-header .edit-post-header__settings .interface-pinned-items > button:nth-child(1)',
				},
			} ),
			meta: {
				heading: __( 'More Options', 'jetpack-mu-wpcom' ),
				descriptions: {
					desktop: __( 'Click the settings icon to see even more options.', 'jetpack-mu-wpcom' ),
					mobile: __( 'Tap the settings icon to see even more options.', 'jetpack-mu-wpcom' ),
				},
				imgSrc: getTourAssets( 'moreOptions' ),
			},
			options: {
				classNames: {
					desktop: 'wpcom-editor-welcome-tour__step',
					mobile: [ 'is-with-extra-padding', 'wpcom-editor-welcome-tour__step' ],
				},
			},
		},
		...( ! isMobile
			? [
					{
						slug: 'find-your-way',
						meta: {
							heading: __( 'Find your way', 'jetpack-mu-wpcom' ),
							descriptions: {
								desktop: __(
									"Use List View to see all the blocks you've added. Click and drag any block to move it around.",
									'jetpack-mu-wpcom'
								),
								mobile: null,
							},
							imgSrc: getTourAssets( 'findYourWay' ),
						},
						options: {
							classNames: {
								desktop: [ 'is-with-extra-padding', 'wpcom-editor-welcome-tour__step' ],
								mobile: 'wpcom-editor-welcome-tour__step',
							},
						},
					},
			  ]
			: [] ),
		{
			slug: 'payment-block',
			meta: {
				heading: __( 'The Payments block', 'jetpack-mu-wpcom' ),
				descriptions: {
					desktop: (
						<>
							{ __(
								'The Payments block allows you to accept payments for one-time, monthly recurring, or annual payments on your website',
								'jetpack-mu-wpcom'
							) }
							<br />
							<ExternalLink
								href={ localizeUrl(
									'https://wordpress.com/support/video-tutorials-add-payments-features-to-your-site-with-our-guides/#how-to-use-the-payments-block-video',
									localeSlug
								) }
								rel="noopener noreferrer"
							>
								{ __( 'Learn more', 'jetpack-mu-wpcom' ) }
							</ExternalLink>
						</>
					),
					mobile: null,
				},
				imgSrc: getTourAssets( 'welcome' ),
			},
			options: {
				classNames: {
					desktop: 'wpcom-editor-welcome-tour__step',
					mobile: 'wpcom-editor-welcome-tour__step',
				},
			},
		},
		...( isSiteEditor
			? [
					{
						slug: 'edit-your-site',
						meta: {
							heading: __( 'Edit your site', 'jetpack-mu-wpcom' ),
							descriptions: {
								desktop: createInterpolateElement(
									__(
										'Design everything on your site - from the header right down to the footer - in the Site Editor. <link_to_fse_docs>Learn more</link_to_fse_docs>',
										'jetpack-mu-wpcom'
									),
									{
										link_to_fse_docs: (
											<ExternalLink
												href={ localizeUrl(
													'https://wordpress.com/support/full-site-editing/',
													localeSlug
												) }
												children={ null }
											/>
										),
									}
								),
								mobile: __(
									'Design everything on your site - from the header right down to the footer - in the Site Editor.',
									'jetpack-mu-wpcom'
								),
							},
							imgSrc: getTourAssets( 'editYourSite' ),
						},
						options: {
							classNames: {
								desktop: 'wpcom-editor-welcome-tour__step',
								mobile: [ 'is-with-extra-padding', 'wpcom-editor-welcome-tour__step' ],
							},
						},
					},
			  ]
			: [] ),
		{
			slug: 'congratulations',
			meta: {
				heading: __( 'Congratulations!', 'jetpack-mu-wpcom' ),
				descriptions: {
					desktop: isComingSoon()
						? createInterpolateElement(
								__(
									"You've learned the basics. Remember, your site is private until you <link_to_launch_site_docs>decide to launch</link_to_launch_site_docs>. View the <link_to_editor_docs>block editing docs</link_to_editor_docs> to learn more.",
									'jetpack-mu-wpcom'
								),
								{
									link_to_launch_site_docs: (
										<ExternalLink
											href={ localizeUrl(
												'https://wordpress.com/support/settings/privacy-settings/#launch-your-site',
												localeSlug
											) }
											children={ null }
										/>
									),
									link_to_editor_docs: (
										<ExternalLink
											href={ localizeUrl(
												'https://wordpress.com/support/wordpress-editor/',
												localeSlug
											) }
											children={ null }
										/>
									),
								}
						  )
						: createInterpolateElement(
								__(
									"You've learned the basics. View the <link_to_editor_docs>block editing docs</link_to_editor_docs> to learn more.",
									'jetpack-mu-wpcom'
								),
								{
									link_to_editor_docs: (
										<ExternalLink
											href={ localizeUrl(
												'https://wordpress.com/support/wordpress-editor/',
												localeSlug
											) }
											children={ null }
										/>
									),
								}
						  ),
					mobile: null,
				},
				imgSrc: getTourAssets( 'finish' ),
			},
			options: {
				classNames: {
					desktop: 'wpcom-editor-welcome-tour__step',
					mobile: 'wpcom-editor-welcome-tour__step',
				},
			},
		},
	];
}

export default useTourSteps;
