/* global removedCalypsoScreenNoticeConfig */

import { Guide } from '@wordpress/components';
import { createRoot, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	Icon,
	archive,
	category,
	commentContent,
	pages,
	postComments,
	tag,
	verse,
} from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';
import bgPattern from './removed-calypso-screen-bg-pattern.png';

import './removed-calypso-screen-notice.scss';

const Notice = () => {
	const [ isOpen, setIsOpen ] = useState( true );
	const icons = {
		'edit.php': verse,
		'edit.php?post_type=page': pages,
		'edit.php?post_type=jetpack-portfolio': archive,
		'edit.php?post_type=jetpack-testimonial': commentContent,
		'edit-comments.php': postComments,
		'edit-tags.php?taxonomy=category': category,
		'edit-tags.php?taxonomy=post_tag': tag,
	};

	if ( ! Object.keys( icons ).includes( removedCalypsoScreenNoticeConfig.screen ) ) {
		return null;
	}

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
									icon={ icons[ removedCalypsoScreenNoticeConfig.screen ] }
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
