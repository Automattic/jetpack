/* global removedCalypsoScreenNoticeConfig */

import { Guide } from '@wordpress/components';
import { createRoot, useState } from '@wordpress/element';
import { __, hasTranslation as _hasTranslation, sprintf } from '@wordpress/i18n';
import {
	Icon,
	archive,
	category,
	commentContent,
	gallery,
	pages,
	postComments,
	tag,
	verse,
	settings,
	page,
} from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';

import './removed-calypso-screen-notice.scss';

const hasTranslation = text => {
	const currentLanguage = document.querySelector( 'html' )?.getAttribute( 'lang' );

	if ( currentLanguage?.startsWith( 'en' ) ) {
		return true;
	}

	return _hasTranslation( text, undefined, 'jetpack-mu-wpcom' );
};

const Notice = () => {
	const [ isOpen, setIsOpen ] = useState( true );

	const titleFallback = sprintf(
		// translators: %s: page name
		__( 'The %s view just got better', 'jetpack-mu-wpcom' ),
		removedCalypsoScreenNoticeConfig.title
	);

	const descriptionFallback = sprintf(
		// translators: %s: page name
		__(
			"We've adopted WordPress's main %s view to bring improvements to you and millions of WordPress users worldwide.",
			'jetpack-mu-wpcom'
		),
		removedCalypsoScreenNoticeConfig.title
	);

	const config = {
		'edit.php': {
			icon: verse,
			title: hasTranslation( 'The Posts view just got an update' )
				? __( 'The Posts view just got an update', 'jetpack-mu-wpcom' )
				: titleFallback,
			description: hasTranslation(
				"We've adopted WordPress' main Posts view to bring improvements to you and millions of WordPress users worldwide."
			)
				? __(
						"We've adopted WordPress' main Posts view to bring improvements to you and millions of WordPress users worldwide.",
						'jetpack-mu-wpcom'
				  )
				: descriptionFallback,
		},
		'edit.php?post_type=page': {
			icon: pages,
			title: hasTranslation( 'The Pages view just got an update' )
				? __( 'The Pages view just got an update', 'jetpack-mu-wpcom' )
				: titleFallback,
			description: hasTranslation(
				"We've adopted WordPress' main Pages view to bring improvements to you and millions of WordPress users worldwide."
			)
				? __(
						"We've adopted WordPress' main Pages view to bring improvements to you and millions of WordPress users worldwide.",
						'jetpack-mu-wpcom'
				  )
				: descriptionFallback,
		},
		'edit.php?post_type=jetpack-portfolio': {
			icon: archive,
			title: hasTranslation( 'The Portfolio Projects view just got an update' )
				? __( 'The Portfolio Projects view just got an update', 'jetpack-mu-wpcom' )
				: titleFallback,
			description: hasTranslation(
				"We've adopted WordPress' main Portfolio Projects view to bring improvements to you and millions of WordPress users worldwide."
			)
				? __(
						"We've adopted WordPress' main Portfolio Projects view to bring improvements to you and millions of WordPress users worldwide.",
						'jetpack-mu-wpcom'
				  )
				: descriptionFallback,
		},
		'edit.php?post_type=jetpack-testimonial': {
			icon: commentContent,
			title: hasTranslation( 'The Testimonials view just got an update' )
				? __( 'The Testimonials view just got an update', 'jetpack-mu-wpcom' )
				: titleFallback,
			description: hasTranslation(
				"We've adopted WordPress' main Testimonials view to bring improvements to you and millions of WordPress users worldwide."
			)
				? __(
						"We've adopted WordPress' main Testimonials view to bring improvements to you and millions of WordPress users worldwide.",
						'jetpack-mu-wpcom'
				  )
				: descriptionFallback,
		},
		'edit-comments.php': {
			icon: postComments,
			title: hasTranslation( 'The Comments view just got an update' )
				? __( 'The Comments view just got an update', 'jetpack-mu-wpcom' )
				: titleFallback,
			description: hasTranslation(
				"We've adopted WordPress' main Comments view to bring improvements to you and millions of WordPress users worldwide."
			)
				? __(
						"We've adopted WordPress' main Comments view to bring improvements to you and millions of WordPress users worldwide.",
						'jetpack-mu-wpcom'
				  )
				: descriptionFallback,
		},
		'edit-tags.php?taxonomy=category': {
			icon: category,
			title: hasTranslation( 'The Categories view just got an update' )
				? __( 'The Categories view just got an update', 'jetpack-mu-wpcom' )
				: titleFallback,
			description: hasTranslation(
				"We've adopted WordPress' main Categories view to bring improvements to you and millions of WordPress users worldwide."
			)
				? __(
						"We've adopted WordPress' main Categories view to bring improvements to you and millions of WordPress users worldwide.",
						'jetpack-mu-wpcom'
				  )
				: descriptionFallback,
		},
		'edit-tags.php?taxonomy=post_tag': {
			icon: tag,
			title: hasTranslation( 'The Tags view just got an update' )
				? __( 'The Tags view just got an update', 'jetpack-mu-wpcom' )
				: titleFallback,
			description: hasTranslation(
				"We've adopted WordPress' main Tags view to bring improvements to you and millions of WordPress users worldwide."
			)
				? __(
						"We've adopted WordPress' main Tags view to bring improvements to you and millions of WordPress users worldwide.",
						'jetpack-mu-wpcom'
				  )
				: descriptionFallback,
		},
		'options-general.php': {
			icon: settings,
			title: hasTranslation( 'General Settings just got an update' )
				? __( 'General Settings just got an update', 'jetpack-mu-wpcom' )
				: titleFallback,
			description: hasTranslation(
				"We've adopted WordPress' main General Settings view to bring improvements to you and millions of WordPress users worldwide."
			)
				? __(
						"We've adopted WordPress' main General Settings view to bring improvements to you and millions of WordPress users worldwide.",
						'jetpack-mu-wpcom'
				  )
				: descriptionFallback,
		},
		'options-writing.php': {
			icon: verse,
			title: hasTranslation( 'Writing Settings just got an update' )
				? __( 'Writing Settings just got an update', 'jetpack-mu-wpcom' )
				: titleFallback,
			description: hasTranslation(
				"We've adopted WordPress' main Writing Settings view to bring improvements to you and millions of WordPress users worldwide."
			)
				? __(
						"We've adopted WordPress' main Writing Settings view to bring improvements to you and millions of WordPress users worldwide.",
						'jetpack-mu-wpcom'
				  )
				: descriptionFallback,
		},
		'options-reading.php': {
			icon: page,
			title: hasTranslation( 'Reading Settings just got an update' )
				? __( 'Reading Settings just got an update', 'jetpack-mu-wpcom' )
				: titleFallback,
			description: hasTranslation(
				"We've adopted WordPress' main Reading Settings view to bring improvements to you and millions of WordPress users worldwide."
			)
				? __(
						"We've adopted WordPress' main Reading Settings view to bring improvements to you and millions of WordPress users worldwide.",
						'jetpack-mu-wpcom'
				  )
				: descriptionFallback,
		},
		'options-discussion.php': {
			icon: postComments,
			title: hasTranslation( 'Discussion Settings just got an update' )
				? __( 'Discussion Settings just got an update', 'jetpack-mu-wpcom' )
				: titleFallback,
			description: hasTranslation(
				"We've adopted WordPress' main Discussion Settings view to bring improvements to you and millions of WordPress users worldwide."
			)
				? __(
						"We've adopted WordPress' main Discussion Settings view to bring improvements to you and millions of WordPress users worldwide.",
						'jetpack-mu-wpcom'
				  )
				: descriptionFallback,
		},
		'upload.php': {
			icon: gallery,
			title: hasTranslation( 'The Media Library just got an update' )
				? __( 'The Media Library just got an update', 'jetpack-mu-wpcom' )
				: titleFallback,
			description: hasTranslation(
				"We've adopted WordPress' main Media Library to bring improvements to you and millions of WordPress users worldwide."
			)
				? __(
						"We've adopted WordPress' main Media Library to bring improvements to you and millions of WordPress users worldwide.",
						'jetpack-mu-wpcom'
				  )
				: descriptionFallback,
		},
	};

	if ( ! Object.keys( config ).includes( removedCalypsoScreenNoticeConfig.screen ) ) {
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

	return (
		<Guide
			className="removed-calypso-screen-notice"
			contentLabel={ config[ removedCalypsoScreenNoticeConfig.screen ].title }
			finishButtonText={ __( 'Got it', 'jetpack-mu-wpcom' ) }
			onFinish={ dismiss }
			pages={ [
				{
					image: (
						<div className="removed-calypso-screen-notice__image">
							<Icon
								icon={ config[ removedCalypsoScreenNoticeConfig.screen ].icon }
								className="removed-calypso-screen-notice__icon"
							></Icon>
						</div>
					),
					content: (
						<>
							<h1>{ config[ removedCalypsoScreenNoticeConfig.screen ].title }</h1>
							<p>
								{ config[ removedCalypsoScreenNoticeConfig.screen ].description }&nbsp;
								<a
									href="https://wordpress.com/blog/2025/01/22/interface-update/"
									target="_blank"
									rel="noreferrer"
								>
									{ __( 'Learn more ↗', 'jetpack-mu-wpcom' ) }
								</a>
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
