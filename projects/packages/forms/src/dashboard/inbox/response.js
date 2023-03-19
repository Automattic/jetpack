import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { Fragment, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import classnames from 'classnames';
import { map } from 'lodash';
import { formatFieldName, getDisplayName, getPath } from './util';

const InboxResponse = ( { loading, response } ) => {
	const [ responseStyle, setResponseStyle ] = useState( {} );

	useEffect( () => {
		const content = document.querySelector( '#wpbody-content' );
		const topOffset = content?.getBoundingClientRect()?.top;

		if ( ! topOffset ) {
			return;
		}

		setResponseStyle( { '--wp-content-offset-top': `${ topOffset }px` } );
	}, [] );

	const classes = classnames( 'jp-forms__inbox-response', {
		'has-email': true,
	} );
	const titleClasses = classnames( 'jp-forms__inbox-response-title', {
		'is-email': false,
		'is-ip': false,
		'is-name': true,
	} );

	if ( ! loading && ! response ) {
		return null;
	}

	return (
		<div className={ classes } style={ responseStyle }>
			<div className="jp-forms__inbox-response-avatar">
				<img
					src="https://gravatar.com/avatar/6e998f49bfee1a92cfe639eabb350bc5?size=68&default=identicon"
					alt={ __( 'Respondent’s gravatar', 'jetpack-forms' ) }
				/>
			</div>

			<h3 className={ titleClasses }>{ getDisplayName( response ) }</h3>
			<p className="jp-forms__inbox-response-subtitle">{ response.author_email }</p>

			<div className="jp-forms__inbox-response-meta">
				<div className="jp-forms__inbox-response-meta-label">
					{ __( 'Added on', 'jetpack-forms' ) }&nbsp;
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
					{ __( 'Source:', 'jetpack-forms' ) }&nbsp;
					<span className="jp-forms__inbox-response-meta-value">{ getPath( response ) }</span>
				</div>
				<div className="jp-forms__inbox-response-meta-label">
					{ __( 'IP address:', 'jetpack-forms' ) }&nbsp;
					<span className="jp-forms__inbox-response-meta-value">{ response.ip }</span>
				</div>
			</div>

			<div className="jp-forms__inbox-response-separator" />

			<div className="jp-forms__inbox-response-data">
				{ map( response.fields, ( value, key ) => {
					return (
						<Fragment key={ key }>
							<div className="jp-forms__inbox-response-data-label">{ formatFieldName( key ) }</div>
							<div className="jp-forms__inbox-response-data-value">{ value }</div>
						</Fragment>
					);
				} ) }
			</div>
		</div>
	);
};

export default InboxResponse;
