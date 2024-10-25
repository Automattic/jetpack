/* global wpcomGlobalStyles */

import { Button, Modal } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import React from 'react';
import { wpcomTrackEvent } from '../../common/tracks';
import { useCanvas } from './use-canvas';

import './modal.scss';

const GlobalStylesModal = () => {
	const isSiteEditor = useSelect( select => !! select( 'core/edit-site' ), [] );
	const { viewCanvasPath } = useCanvas();

	const isVisible = useSelect(
		select => {
			if ( ! isSiteEditor ) {
				return false;
			}

			const currentSidebar =
				select( 'core/interface' ).getActiveComplementaryArea( 'core/edit-site' );

			return select( 'automattic/wpcom-global-styles' ).isModalVisible(
				currentSidebar,
				viewCanvasPath
			);
		},
		[ viewCanvasPath, isSiteEditor ]
	);

	const { dismissModal } = useDispatch( 'automattic/wpcom-global-styles' );
	const { set: setPreference } = useDispatch( 'core/preferences' );

	// Hide the welcome guide modal, so it doesn't conflict with our modal.
	useEffect( () => {
		if ( isSiteEditor ) {
			setPreference( 'core/edit-site', 'welcomeGuideStyles', false );
		}
	}, [ setPreference, isSiteEditor ] );

	useEffect( () => {
		if ( isVisible ) {
			wpcomTrackEvent( 'calypso_global_styles_gating_modal_show', {
				context: 'site-editor',
			} );
		}
	}, [ isVisible ] );

	const closeModal = () => {
		dismissModal();
		wpcomTrackEvent( 'calypso_global_styles_gating_modal_dismiss', {
			context: 'site-editor',
		} );
	};

	if ( ! isSiteEditor || ! isVisible ) {
		return null;
	}

	const planName = wpcomGlobalStyles.planName;
	const description = sprintf(
		/* translators: %s is the short-form Premium plan name */
		__(
			"Change all of your site's fonts, colors and more. Available on the %s plan.",
			'jetpack-mu-wpcom'
		),
		planName
	);

	return (
		<Modal
			className="wpcom-global-styles-modal"
			onRequestClose={ closeModal }
			// set to false so that 1Password's autofill doesn't automatically close the modal
			shouldCloseOnClickOutside={ false }
		>
			<div className="wpcom-global-styles-modal__content">
				<div className="wpcom-global-styles-modal__text">
					<h1 className="wpcom-global-styles-modal__heading">
						{ __( 'A powerful new way to style your site', 'jetpack-mu-wpcom' ) }
					</h1>
					<p className="wpcom-global-styles-modal__description">{ description }</p>
					<div className="wpcom-global-styles-modal__actions">
						<Button variant="secondary" onClick={ closeModal }>
							{ __( 'Try it out', 'jetpack-mu-wpcom' ) }
						</Button>
						<Button
							variant="primary"
							href={ wpcomGlobalStyles.upgradeUrl }
							target="_top"
							onClick={ () =>
								wpcomTrackEvent( 'calypso_global_styles_gating_modal_upgrade_click', {
									context: 'site-editor',
								} )
							}
						>
							{ __( 'Upgrade plan', 'jetpack-mu-wpcom' ) }
						</Button>
					</div>
				</div>
				<div className="wpcom-global-styles-modal__image">
					<img src={ wpcomGlobalStyles.modalImage } alt="" />
				</div>
			</div>
		</Modal>
	);
};

export default GlobalStylesModal;
