/* global removedCalypsoScreenNoticeConfig */

import { Guide } from '@wordpress/components';
import { createRoot, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, check } from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';
import bgPattern from './removed-calypso-screen-bg-pattern.png';

import './removed-calypso-screen-notice.scss';

const Notice = () => {
	const [ isOpen, setIsOpen ] = useState( true );

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
		__( 'The %s view just got better', 'jetpack-mu-wpcom' ),
		removedCalypsoScreenNoticeConfig.title
	);

	return (
		<Guide
			className="removed-calypso-screen-notice"
			contentLabel={ title }
			finishButtonText={ __( 'Got it', 'jetpack-mu-wpcom' ) }
			onFinish={ dismiss }
			pages={ [
				{
					image: (
						<>
							<div
								className="removed-calypso-screen-notice__image"
								style={ { backgroundImage: `url(${ bgPattern })` } }
							>
								<Icon
									icon={ check }
									size={ 72 }
									className="removed-calypso-screen-notice__icon"
								></Icon>
							</div>
						</>
					),
					content: (
						<>
							<h1>{ title }</h1>
							<p>
								{ sprintf(
									// translators: %s: page name
									__(
										"We've adopted WordPress's main %s view to bring improvements to you and millions of WordPress users worldwide.",
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
