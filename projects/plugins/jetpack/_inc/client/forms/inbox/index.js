/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalInputControl as InputControl, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
	SelectControl,
} from '@wordpress/components';
import { dateI18n } from '@wordpress/date';
import { Fragment, useCallback, useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { find, includes, map } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import { fetchResponses, getResponses, isFetchingResponses } from 'state/forms';
import JetpackFormsLogo from '../logo';

const getDisplayName = response => {
	if ( response.author_name ) {
		return response.author_name;
	}

	if ( response.author_email ) {
		return response.author_email;
	}

	return response.ip;
};

const getPath = response => {
	const url = new URL( response.entry_permalink );

	return url.pathname;
};

const formatFieldName = fieldName => {
	const match = fieldName.match( /^(\d+_)?(.*)/i );

	if ( match ) {
		return match[ 2 ];
	}

	return fieldName;
};

const FormsInboxResponseList = ( { onViewResponse, responses } ) => {
	const viewResponse = responseId => () => onViewResponse( responseId );

	return (
		<div className="jp-forms__inbox-list">
			<div className="jp-forms__inbox-list-header">
				<div className="jp-forms__inbox-list-cell">
					<input type="checkbox" className="jp-forms__inbox-list-checkbox" />
				</div>
				<div className="jp-forms__inbox-list-cell">{ 'From' }</div>
				<div className="jp-forms__inbox-list-cell">{ 'Source' }</div>
				<div className="jp-forms__inbox-list-cell">{ 'Date' }</div>
			</div>
			{ map( responses, response => (
				<div key={ response.uid } className="jp-forms__inbox-list-row">
					<div className="jp-forms__inbox-list-cell">
						<input type="checkbox" className="jp-forms__inbox-list-checkbox" />
					</div>
					<div className="jp-forms__inbox-list-cell is-strong">
						<a href={ `#forms` } onClick={ viewResponse( response.id ) }>
							{ getDisplayName( response ) }
						</a>
					</div>
					<div className="jp-forms__inbox-list-cell">
						<a href={ response.entry_permalink } target="_blank" rel="noreferrer noopener">
							{ getPath( response ) }
						</a>
					</div>
					<div className="jp-forms__inbox-list-cell">{ dateI18n( 'F j, Y', response.date ) }</div>
				</div>
			) ) }
		</div>
	);
};

const FormsInboxResponseView = ( { response } ) => {
	if ( ! response ) {
		return null;
	}

	return (
		<div className="jp-forms__response">
			<div className="jp-forms__response-meta">
				{ response.author_avatar && (
					<div className="jp-forms__response-meta-item is-avatar">
						2{ ' ' }
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

const FormsInbox = () => {
	const [ currentResponse, setCurrentResponse ] = useState( -1 );
	const [ showResponseView, setShowResponseView ] = useState( false );
	const [ searchText, setSearchText ] = useState( '' );

	const dispatch = useDispatch();

	const [ loading, responses ] = useSelector( state => [
		isFetchingResponses( state ),
		getResponses( state ),
	] );

	useEffect( () => {
		fetchResponses( {} )( dispatch );
	}, [] );

	useEffect( () => {
		if ( responses.length === 0 || includes( map( responses, 'id' ), currentResponse ) ) {
			return;
		}

		setCurrentResponse( responses[ 0 ].id );
	}, [ responses ] );

	const handleSearch = useCallback(
		event => {
			event.preventDefault();
			fetchResponses( { search: searchText } )( dispatch );
		},
		[ searchText ]
	);

	const numberOfResponses = sprintf(
		/* translators: %s: Number of responses. */
		_n( '%s response', '%s responses', responses.length, 'jetpack' ),
		responses.length
	);

	return (
		<div>
			<div className="jp-forms__header">
				<JetpackFormsLogo />
				<h2 className="jp-forms__header-text">{ __( 'Form Responses', 'jetpack' ) }</h2>
				<p className="jp-forms__header-subtext">{ numberOfResponses }</p>
			</div>

			<div className="jp-forms__actions">
				<form className="jp-forms__actions-form">
					<SelectControl
						options={ [
							{ label: __( 'Bulk actions', 'jetpack' ), value: '' },
							{ label: __( 'Trash', 'jetpack' ), value: 'trash' },
							{ label: __( 'Move to spam', 'jetpack' ), value: 'spam' },
						] }
					/>
					<Button variant="secondary">{ __( 'Apply', 'jetpack' ) }</Button>
				</form>
				<form className="jp-forms__actions-form" onSubmit={ handleSearch }>
					<InputControl onChange={ setSearchText } value={ searchText } />
					<Button type="submit" variant="secondary">
						{ __( 'Search', 'jetpack' ) }
					</Button>
				</form>
			</div>
			<div className="jp-forms__inbox-content">
				<div className="jp-forms__inbox-content-column">
					<FormsInboxResponseList onViewResponse={ setCurrentResponse } responses={ responses } />
				</div>
				<div className="jp-forms__inbox-content-column">
					<FormsInboxResponseView response={ find( responses, { id: currentResponse } ) } />
				</div>
			</div>
		</div>
	);
};

export default FormsInbox;
