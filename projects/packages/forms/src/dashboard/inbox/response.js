/**
 * External dependencies
 */
import { useHovercards } from '@gravatar-com/hovercards/react';
import '@gravatar-com/hovercards/dist/style.css';
import {
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	Button,
	ExternalLink,
} from '@wordpress/components';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useEffect, useRef } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import sha256 from 'js-sha256';
import { map } from 'lodash';
import CopyClipboardButton from './copy-clipboard-button';
import { getPath } from './utils';

/**
 * Internal dependencies
 */

const getDisplayName = response => {
	const { author_name, author_email, author_url, ip } = response;
	return decodeEntities( author_name || author_email || author_url || ip );
};

const isFileUploadField = value => {
	return value && typeof value === 'object' && 'files' in value && 'field_id' in value;
};

const renderEmail = email => {
	return (
		<span className="email-field">
			<a href={ `mailto:${ email }` }>{ email }</a>
			<CopyClipboardButton text={ email } />
		</span>
	);
};

const renderFieldValue = value => {
	// Files
	if ( isFileUploadField( value ) ) {
		return (
			<div className="file-field">
				{ value.files?.length
					? value.files.map( ( file, index ) => {
							return (
								<div key={ index } className="file-field__item">
									<Button variant="link" href={ file.url } target="_blank">
										{ decodeEntities( file.name ) } | { file.size }
									</Button>
								</div>
							);
					  } )
					: '-' }
			</div>
		);
	}

	// Emails
	const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
	if ( emailRegex.test( value ) ) {
		return renderEmail( value );
	}

	return value;
};

const Gravatar = ( { email, displayName } ) => {
	const { attach } = useHovercards( {
		// @see https://github.com/Automattic/gravatar/tree/trunk/web/packages/hovercards#translations
		i18n: {
			'Edit your profile →': __( 'Edit your profile →', 'jetpack-forms' ),
			'View profile →': __( 'View profile →', 'jetpack-forms' ),
			Contact: __( 'Contact', 'jetpack-forms' ),
			'Send money': __( 'Send money', 'jetpack-forms' ),
			'Sorry, we are unable to load this Gravatar profile.': __(
				'Sorry, we are unable to load this Gravatar profile.',
				'jetpack-forms'
			),
			'Gravatar not found.': __( 'Gravatar not found.', 'jetpack-forms' ),
			'Too Many Requests.': __( 'Too many requests.', 'jetpack-forms' ),
			'Internal Server Error.': __( 'Internal server error.', 'jetpack-forms' ),
			'Is this you?': __( 'Is this you?', 'jetpack-forms' ),
			'Claim your free profile.': __( 'Claim your free profile.', 'jetpack-forms' ),
			Email: __( 'Email', 'jetpack-forms' ),
			'Home Phone': __( 'Home phone', 'jetpack-forms' ),
			'Work Phone': __( 'Work phone', 'jetpack-forms' ),
			'Cell Phone': __( 'Cell phone', 'jetpack-forms' ),
			'Contact Form': __( 'Contact form', 'jetpack-forms' ),
			Calendar: __( 'Calendar', 'jetpack-forms' ),
		},
	} );

	const imgRef = useRef();

	useEffect( () => {
		if ( imgRef.current ) {
			attach( imgRef.current );
		}
	}, [ attach ] );

	const hashedEmail = sha256( email );

	return (
		<img
			alt=""
			className="jp-forms__inbox-response-gravatar"
			ref={ imgRef }
			src={ `https://0.gravatar.com/avatar/${ hashedEmail }?d=initials&name=${ displayName }` }
		/>
	);
};

const InboxResponse = ( { loading, response } ) => {
	const ref = useRef( undefined );

	useEffect( () => {
		if ( ! ref.current ) {
			return;
		}

		ref.current.scrollTop = 0;
	}, [ response ] );

	if ( ! loading && ! response ) {
		return null;
	}

	const titleClasses = clsx( 'jp-forms__inbox-response-title', {
		'is-email': response && ! response.author_name && response.author_email,
		'is-ip': response && ! response.author_name && ! response.author_email,
		'is-name': response && response.author_name,
	} );

	return (
		<div ref={ ref } className="jp-forms__inbox-response">
			<div className="jp-forms__inbox-response-header">
				<HStack alignment="topLeft" spacing="3">
					{ response.author_email && (
						<Gravatar email={ response.author_email } displayName={ getDisplayName( response ) } />
					) }
					<VStack spacing="0" className="jp-forms__inbox-response-header-name">
						<h3 className={ titleClasses }>{ getDisplayName( response ) }</h3>
						{ response.author_email && getDisplayName( response ) !== response.author_email && (
							<span className="jp-forms__inbox-response-subtitle">
								{ renderEmail( response.author_email ) }
							</span>
						) }
					</VStack>
				</HStack>
			</div>

			<div className="jp-forms__inbox-response-meta">
				<div className="jp-forms__inbox-response-meta-label">
					<span className="jp-forms__inbox-response-meta-key">
						{ __( 'Date:', 'jetpack-forms' ) }&nbsp;
					</span>
					<span className="jp-forms__inbox-response-meta-value">
						{ sprintf(
							/* Translators: %1$s is the date, %2$s is the time. */
							__( '%1$s at %2$s', 'jetpack-forms' ),
							dateI18n( getDateSettings().formats.date, response.date ),
							dateI18n( getDateSettings().formats.time, response.date )
						) }
					</span>
				</div>
				<div className="jp-forms__inbox-response-meta-label">
					<span className="jp-forms__inbox-response-meta-key">
						{ __( 'Source:', 'jetpack-forms' ) }&nbsp;
					</span>
					<span className="jp-forms__inbox-response-meta-value">
						<ExternalLink href={ response.entry_permalink }>
							{ decodeEntities( response.entry_title ) || getPath( response ) }
						</ExternalLink>
					</span>
				</div>
				<div className="jp-forms__inbox-response-meta-label">
					<span className="jp-forms__inbox-response-meta-key	">
						{ __( 'IP address:', 'jetpack-forms' ) }&nbsp;
					</span>
					<span className="jp-forms__inbox-response-meta-value">{ response.ip }</span>
				</div>
			</div>

			<div className="jp-forms__inbox-response-data">
				{ map( response.fields, ( value, key ) => (
					<div key={ key } className="jp-forms__inbox-response-item">
						<Text className="jp-forms__inbox-response-data-label" weight="bold">
							{ key.endsWith( '?' ) ? key : `${ key }:` }
						</Text>
						<Text className="jp-forms__inbox-response-data-value">
							{ renderFieldValue( value ) }
						</Text>
					</div>
				) ) }
			</div>
		</div>
	);
};

export default InboxResponse;
