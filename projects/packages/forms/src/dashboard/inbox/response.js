import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import classnames from 'classnames';
import { isEmpty, map } from 'lodash';
import { formatFieldName, getDisplayName } from './util';

const InboxResponse = ( { loading, response } ) => {
	const ref = useRef();
	const classes = classnames( 'jp-forms__inbox-response', {
		'has-email': true,
	} );
	const titleClasses = classnames( 'jp-forms__inbox-response-title', {
		'is-email': false,
		'is-ip': false,
		'is-name': true,
	} );

	useEffect( () => {
		if ( ! ref.current ) {
			return;
		}

		ref.current.scrollTop = 0;
	}, [ response ] );

	if ( ! loading && ! response ) {
		return null;
	}

	return (
		<div className={ classes } ref={ ref }>
			<div className="jp-forms__inbox-response-avatar">
				<img
					src="https://gravatar.com/avatar/6e998f49bfee1a92cfe639eabb350bc5?size=68&default=identicon"
					alt={ __( 'Respondent’s gravatar', 'jetpack-forms' ) }
				/>
			</div>

			<h3 className={ titleClasses }>{ getDisplayName( response ) }</h3>
			{ response.author_email && getDisplayName( response ) !== response.author_email && (
				<p className="jp-forms__inbox-response-subtitle">{ response.author_email }</p>
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
					<span className="jp-forms__inbox-response-meta-value">{ response.entry_permalink }</span>
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
				{ map( response.fields, ( value, key ) => {
					return (
						<div key={ key } className="jp-forms__inbox-response-item">
							<div className="jp-forms__inbox-response-data-label">{ formatFieldName( key ) }:</div>
							<div className="jp-forms__inbox-response-data-value">
								{ isEmpty( value ) ? '-' : value }
							</div>
						</div>
					);
				} ) }
			</div>
		</div>
	);
};

export default InboxResponse;
