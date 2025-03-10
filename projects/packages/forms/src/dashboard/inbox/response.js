/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import { map } from 'lodash';

const getDisplayName = response => {
	const { author_name, author_email, author_url, ip } = response;
	return decodeEntities( author_name || author_email || author_url || ip );
};

const InboxResponse = ( { loading, response } ) => {
	const [ emailCopied, setEmailCopied ] = useState( false );

	const ref = useRef( undefined );

	useEffect( () => {
		if ( ! ref.current ) {
			return;
		}

		ref.current.scrollTop = 0;
	}, [ response ] );

	const copyEmail = useCallback( async () => {
		await window.navigator.clipboard.writeText( response.author_email );
		setEmailCopied( true );
		setTimeout( () => setEmailCopied( false ), 3000 );
	}, [ response, setEmailCopied ] );

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
			<div className="jp-forms__inbox-response-avatar">
				<img
					src="https://gravatar.com/avatar/6e998f49bfee1a92cfe639eabb350bc5?size=68&default=identicon"
					alt={ __( 'Respondent’s gravatar', 'jetpack-forms' ) }
				/>
			</div>

			<h3 className={ titleClasses }>{ getDisplayName( response ) }</h3>
			{ response.author_email && getDisplayName( response ) !== response.author_email && (
				<p className="jp-forms__inbox-response-subtitle">
					{ response.author_email }
					<Button variant="secondary" onClick={ copyEmail }>
						{ ! emailCopied && __( 'Copy', 'jetpack-forms' ) }
						{ emailCopied && __( '✓ Copied', 'jetpack-forms' ) }
					</Button>
				</p>
			) }

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
						<Button variant="link" href={ response.entry_permalink }>
							{ response.entry_permalink }
						</Button>
					</span>
				</div>
				<div className="jp-forms__inbox-response-meta-label">
					<span className="jp-forms__inbox-response-meta-key	">
						{ __( 'IP address:', 'jetpack-forms' ) }&nbsp;
					</span>
					<span className="jp-forms__inbox-response-meta-value">{ response.ip }</span>
				</div>
			</div>

			<div className="jp-forms__inbox-response-separator" />

			<div className="jp-forms__inbox-response-data">
				{ map( response.fields, ( value, key ) => (
					<div key={ key } className="jp-forms__inbox-response-item">
						<div className="jp-forms__inbox-response-data-label">{ key }:</div>
						<div className="jp-forms__inbox-response-data-value">{ value }</div>
					</div>
				) ) }
			</div>
		</div>
	);
};

export default InboxResponse;
