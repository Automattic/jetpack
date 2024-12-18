/* global removedCalypsoScreenNoticeConfig */

import { Guide } from '@wordpress/components';
import { createRoot, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import './removed-calypso-screen-notice.scss';

const Notice = () => {
	const [ isOpen, setIsOpen ] = useState( true );
	const [ isImageLoading, setIsImageLoading ] = useState( true );

	if ( ! isOpen ) {
		return null;
	}

	const dismiss = () => {
		setIsOpen( false );
		fetch(
			addQueryArgs( removedCalypsoScreenNoticeConfig.ajaxUrl, {
				action: 'wpcom_dismiss_removed_calypso_screen_notice',
				_ajax_nonce: removedCalypsoScreenNoticeConfig.dismissNonce,
				screen: removedCalypsoScreenNoticeConfig.screen,
			} )
		);
	};

	const title = sprintf(
		// translators: %s: page name
		__( 'A better %s view for everyone', 'jetpack-mu-wpcom' ),
		removedCalypsoScreenNoticeConfig.title
	);

	return (
		<Guide
			className={ `removed-calypso-screen-notice ${ isImageLoading ? 'is-loading' : '' }` }
			contentLabel={ title }
			finishButtonText={ __( 'Got it', 'jetpack-mu-wpcom' ) }
			onFinish={ dismiss }
			pages={ [
				{
					image: (
						<div className="removed-calypso-screen-notice__image">
							<img
								alt=""
								src={ removedCalypsoScreenNoticeConfig.imageUrl }
								onLoad={ () => setIsImageLoading( false ) }
							/>
						</div>
					),
					content: (
						<>
							<h1>{ title }</h1>
							<p>
								{ sprintf(
									// translators: %s: page name
									__(
										"We've switched to the standard WordPress %s view to bring you improvements that also benefit the entire WordPress community.",
										'jetpack-mu-wpcom'
									),
									removedCalypsoScreenNoticeConfig.title
								) }
							</p>
						</>
					),
				},
			] }
		/>
	);
};

const container = document.createElement( 'div' );
document.body.appendChild( container );
const root = createRoot( container );
root.render( <Notice /> );
