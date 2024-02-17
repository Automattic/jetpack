import { getRedirectUrl } from '@automattic/jetpack-components';
import { getSiteFragment, useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import { Modal, Button, CheckboxControl } from '@wordpress/components';
import { usePrevious } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import './editor.scss';

export const name = 'launchpad-save-modal';

const updateHideFSENextStepsModal = async hideFSENextStepsModal => {
	return apiFetch( {
		path: '/wpcom/v2/launchpad',
		method: 'POST',
		data: { hide_fse_next_steps_modal: !! hideFSENextStepsModal },
	} );
};

const LAUNCHPAD_SAVE_MODAL_EDITABLE_PROPS = [ 'hideFSENextStepsModal' ];

const updateLaunchpadSaveModalBrowserConfig = config => {
	if ( ! config || typeof config !== 'object' ) {
		return;
	}

	if ( ! window.Jetpack_LaunchpadSaveModal ) {
		window.Jetpack_LaunchpadSaveModal = {};
	}

	for ( const editableProp of LAUNCHPAD_SAVE_MODAL_EDITABLE_PROPS ) {
		if ( config.hasOwnProperty( editableProp ) ) {
			window.Jetpack_LaunchpadSaveModal[ editableProp ] = config[ editableProp ];
		}
	}
};

export const settings = {
	render: function LaunchpadSaveModal() {
		const { isSavingSite, isSavingPost, isCurrentPostPublished, postLink, postType } = useSelect(
			select => {
				const { __experimentalGetDirtyEntityRecords, isSavingEntityRecord } = select( coreStore );
				const dirtyEntityRecords = __experimentalGetDirtyEntityRecords();

				return {
					// Align the “Save” behavior in the editor.
					// See https://github.com/WordPress/gutenberg/blob/96305e952948653e2921147492556d09ee9d3c17/packages/edit-site/src/components/save-button/index.js#L43
					isSavingSite: dirtyEntityRecords.some( record =>
						isSavingEntityRecord( record.kind, record.name, record.key )
					),
					isSavingPost: select( editorStore ).isSavingPost(),
					isCurrentPostPublished: select( editorStore ).isCurrentPostPublished(),
					postLink: select( editorStore ).getPermalink(),
					postType: select( editorStore ).getCurrentPostType(),
				};
			}
		);

		const prevIsSavingSite = usePrevious( isSavingSite );
		const prevIsSavingPost = usePrevious( isSavingPost );

		// We use this state as a flag to manually handle the modal close on first post publish
		const [ isInitialPostPublish, setIsInitialPostPublish ] = useState( false );

		const {
			launchpadScreenOption,
			hasNeverPublishedPostOption,
			hideFSENextStepsModal,
			siteIntentOption,
		} = window?.Jetpack_LaunchpadSaveModal || {};

		const hideFSENextStepsModalBool = !! hideFSENextStepsModal;

		const [ isModalOpen, setIsModalOpen ] = useState( false );
		const [ dontShowAgain, setDontShowAgain ] = useState( hideFSENextStepsModalBool );
		const [ isChecked, setIsChecked ] = useState( hideFSENextStepsModalBool );

		const isInsideSiteEditor = document.getElementById( 'site-editor' ) !== null;
		const isInsidePostEditor = document.querySelector( '.block-editor' ) !== null;
		const initialHideFSENextStepsModal = useRef( hideFSENextStepsModalBool );

		const siteFragment = getSiteFragment();
		const launchPadUrl = getRedirectUrl( 'wpcom-launchpad-setup', {
			path: siteIntentOption,
			query: `siteSlug=${ siteFragment }`,
		} );
		const { tracks } = useAnalytics();

		const recordTracksEvent = eventName =>
			tracks.recordEvent( eventName, {
				site_intent: siteIntentOption,
				launchpad_screen: launchpadScreenOption,
				dont_show_again: isChecked,
				editor_type: isInsideSiteEditor ? 'site' : 'post',
			} );

		function getModalContent() {
			const modalContent = {
				title: __( 'Great progress!', 'jetpack' ),
				body: __(
					'You are one step away from bringing your site to life. Check out the next steps that will help you to launch your site.',
					'jetpack'
				),
				actionButtonHref: launchPadUrl,
				actionButtonTracksEvent: 'jetpack_launchpad_save_modal_next_steps',
				actionButtonText: __( 'Next Steps', 'jetpack' ),
			};

			if ( siteIntentOption === 'newsletter' ) {
				if ( postType === 'post' ) {
					modalContent.title = __( 'Your first post is published!', 'jetpack' );
					modalContent.body = __(
						'Congratulations! You did it. View your post to see how it will look on your site.',
						'jetpack'
					);
					modalContent.actionButtonHref = postLink;
					modalContent.actionButtonTracksEvent = 'jetpack_launchpad_save_modal_view_post';
					modalContent.actionButtonText = __( 'View Post', 'jetpack' );
				} else {
					modalContent.body = __(
						'You are one step away from bringing your site to life. Check out the next steps that will help you to setup your newsletter.',
						'jetpack'
					);
				}
			}

			return modalContent;
		}

		useEffect( () => {
			// We want to prevent the launchpad modal from rendering on top of the first
			// post published modal that exists in the editing toolkit. The following
			// conditional is a stopgap solution for the time being, and the end goal is
			// to migrate the first post published modal logic into jetpack, abstract code from
			// both modals and their rendering behavior, and remove this solution afterwards.
			if (
				// Previously, we would check whether the post is publishing (as opposed to saving)
				// but publish and isPublishingPost and isSavingPost were updated in different render cycles
				// so we were unable to meaningfully compare them in an IF statement here.
				hasNeverPublishedPostOption &&
				siteIntentOption === 'write' &&
				isInsidePostEditor
			) {
				setIsModalOpen( false );
				return;
			} else if (
				( prevIsSavingSite === true && isSavingSite === false ) ||
				( prevIsSavingPost === true && isSavingPost === false )
			) {
				setIsModalOpen( true );
			}
		}, [
			isSavingSite,
			hasNeverPublishedPostOption,
			prevIsSavingSite,
			isSavingPost,
			prevIsSavingPost,
			siteIntentOption,
			isInsidePostEditor,
		] );

		useEffect( () => {
			// if the isCurrentPostPublished is ever false it means this current post hasn't been published yet so we set the initialPostPublish state
			if ( isCurrentPostPublished === false ) {
				setIsInitialPostPublish( true );
			}
		}, [ isCurrentPostPublished ] );

		const { title, body, actionButtonHref, actionButtonTracksEvent, actionButtonText } =
			getModalContent();

		const showModal =
			( ( isInsidePostEditor && isCurrentPostPublished ) || isInsideSiteEditor ) &&
			launchpadScreenOption === 'full' &&
			! dontShowAgain &&
			isModalOpen;

		const handleDontShowAgainSetting = shouldHide => {
			setDontShowAgain( shouldHide );
			updateLaunchpadSaveModalBrowserConfig( { hideFSENextStepsModal: shouldHide } );
			if ( shouldHide !== initialHideFSENextStepsModal.current ) {
				updateHideFSENextStepsModal( shouldHide );
			}
		};

		return (
			showModal && (
				<Modal
					isDismissible={ true }
					className="launchpad__save-modal"
					onRequestClose={ () => {
						handleDontShowAgainSetting( isChecked );
						// bypass the onRequestClose function the first time it's called when you publish a post because it closes the modal immediately
						if ( isInitialPostPublish ) {
							setIsInitialPostPublish( false );
							return;
						}
						setIsModalOpen( false );
						recordTracksEvent( 'jetpack_launchpad_save_modal_close' );
					} }
				>
					<div className="launchpad__save-modal-body">
						<div className="launchpad__save-modal-text">
							<h1 className="launchpad__save-modal-heading">{ title }</h1>
							<p className="launchpad__save-modal-message">{ body }</p>
						</div>
						<div className="launchpad__save-modal-controls">
							<CheckboxControl
								label={ __( "Don't show this again.", 'jetpack' ) }
								checked={ isChecked }
								onChange={ () => setIsChecked( ! isChecked ) }
							/>
							<div className="launchpad__save-modal-buttons">
								<Button
									variant="secondary"
									onClick={ () => {
										handleDontShowAgainSetting( isChecked );
										setIsModalOpen( false );
										recordTracksEvent( 'jetpack_launchpad_save_modal_back_to_edit' );
									} }
								>
									{ __( 'Back to Edit', 'jetpack' ) }
								</Button>
								<Button
									variant="primary"
									href={ actionButtonHref }
									target="_top"
									onClick={ () => {
										handleDontShowAgainSetting( isChecked );
										recordTracksEvent( actionButtonTracksEvent );
									} }
								>
									{ actionButtonText }
								</Button>
							</div>
						</div>
					</div>
				</Modal>
			)
		);
	},
};
