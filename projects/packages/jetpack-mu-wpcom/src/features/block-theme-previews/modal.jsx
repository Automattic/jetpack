import { Button, Modal } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import React from 'react';
import { getPreviewedThemeStylesheet } from './utils';

import './modal.scss';

/**
 * The modal that shows in the Site Editor the first time a user previews a block theme.
 *
 * @return {JSX.Element|null} The modal component if visible and in the Site Editor, otherwise null.
 */
export default function BlockThemePreviewsModal() {
	const stylesheet = getPreviewedThemeStylesheet();
	const theme = useSelect( select => select( 'core' ).getTheme( stylesheet ), [ stylesheet ] );

	const isInSiteEditor = useSelect( select => !! select( 'core/edit-site' ), [] );
	const isModalVisible = useSelect(
		select => select( 'automattic/wpcom-block-theme-previews' ).isModalVisible(),
		[]
	);
	const { dismissModal } = useDispatch( 'automattic/wpcom-block-theme-previews' );

	if ( ! isInSiteEditor || ! isModalVisible ) {
		return null;
	}
	return (
		<Modal
			className="wpcom-block-theme-previews-modal"
			onRequestClose={ dismissModal }
			shouldCloseOnClickOutside={ false }
		>
			<div className="wpcom-block-theme-previews-modal__content">
				<div className="wpcom-block-theme-previews-modal__text">
					<h1 className="wpcom-block-theme-previews-modal__heading">
						{ sprintf(
							// translators: %s: theme name
							__( 'You’re previewing %s', 'jetpack-mu-wpcom' ),
							theme?.name?.rendered || stylesheet
						) }
					</h1>
					<div className="wpcom-block-theme-previews-modal__description">
						<p>
							{ __(
								'Changes you make in the editor won’t be applied to your site until you activate the theme.',
								'jetpack-mu-wpcom'
							) }
						</p>
						<p>
							{ __(
								'Try customizing your theme styles to get your site looking just right.',
								'jetpack-mu-wpcom'
							) }
						</p>
					</div>
					<div className="wpcom-block-theme-previews-modal__actions">
						<Button variant="primary" onClick={ dismissModal }>
							{ __( 'Start customizing', 'jetpack-mu-wpcom' ) }
						</Button>
					</div>
				</div>
				<div className="wpcom-block-theme-previews-modal__video">
					<video autoPlay loop muted>
						<source
							src="https://videos.files.wordpress.com/gTXUlIAB/wpcom-block-theme-previews-modal.mp4"
							type="video/mp4"
						/>
					</video>
				</div>
			</div>
		</Modal>
	);
}
