/**
 * External dependencies
 */
/**
 * WordPress dependencies
 */
import { dateI18n } from '@wordpress/date';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { map } from 'lodash';
/**
 * Internal dependencies
 */
import { formatFieldName } from './util';

const Placeholder = () => (
	<div className="jp-forms__response is-loading">
		<div className="jp-forms__response-meta">
			<div className="jp-forms__response-meta-item is-avatar" />
			<div className="jp-forms__response-meta-item" />
			<div className="jp-forms__response-meta-item" />
			<div className="jp-forms__response-meta-item is-source" />
		</div>
		<div className="jp-forms__response-fields">
			<div className="jp-forms__response-field-name" />
			<div className="jp-forms__response-field-value" />
			<div className="jp-forms__response-field-name" />
			<div className="jp-forms__response-field-value" />
		</div>
	</div>
);

const FormsInboxResponse = ( { loading, response } ) => {
	if ( ! response && loading ) {
		return <Placeholder />;
	}

	if ( ! response ) {
		return <div className="jp-forms__response" />;
	}

	return (
		<div className="jp-forms__response">
			<div className="jp-forms__response-meta">
				{ response.author_avatar && (
					<div className="jp-forms__response-meta-item is-avatar">
						<img className="jp-forms__response-meta-avatar" src={ response.author_avatar } alt="" />
					</div>
				) }
				{ response.author_name && (
					<div className="jp-forms__response-meta-item is-name">
						<span className="jp-forms__response-meta-label">{ __( 'Name:', 'jetpack' ) }</span>
						<span className="jp-forms__response-meta-value">{ response.author_name }</span>
					</div>
				) }
				{ response.author_email && (
					<div className="jp-forms__response-meta-item is-email">
						<span className="jp-forms__response-meta-label">{ __( 'Email:', 'jetpack' ) }</span>
						<span className="jp-forms__response-meta-value">{ response.author_email }</span>
					</div>
				) }
				<div className="jp-forms__response-meta-item is-date">
					<span className="jp-forms__response-meta-label">{ __( 'Date:', 'jetpack' ) }</span>
					<span className="jp-forms__response-meta-value">
						{ dateI18n( 'F j, Y | g:i A', response.date ) }
					</span>
				</div>
				<div className="jp-forms__response-meta-item is-ip">
					<span className="jp-forms__response-meta-label">{ __( 'IP:', 'jetpack' ) }</span>
					<span className="jp-forms__response-meta-value">{ response.ip }</span>
				</div>
				<div className="jp-forms__response-meta-item is-source">
					<span className="jp-forms__response-meta-label">{ __( 'Source:', 'jetpack' ) }</span>
					<span className="jp-forms__response-meta-value">
						<a href={ response.entry_permalink } target="_blank" rel="noreferrer noopener">
							{ response.entry_permalink }
						</a>
					</span>
				</div>
			</div>
			<div className="jp-forms__response-fields">
				{ map( response.fields, ( value, key ) => (
					<Fragment key={ key }>
						<div className="jp-forms__response-field-name">{ formatFieldName( key ) }</div>
						<div className="jp-forms__response-field-value">{ value }</div>
					</Fragment>
				) ) }
			</div>
		</div>
	);
};

export default FormsInboxResponse;
