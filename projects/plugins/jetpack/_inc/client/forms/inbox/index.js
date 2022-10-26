/**
 * External dependencies
 */
/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalInputControl as InputControl, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
	SelectControl,
} from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { find, includes, map } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import { fetchResponses, getResponses, isFetchingResponses } from 'state/forms';
import JetpackFormsLogo from '../logo';
import FormsInboxList from './list';
import FormsInboxResponse from './response';

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
					<FormsInboxList
						currentResponse={ currentResponse }
						loading={ loading }
						onViewResponse={ setCurrentResponse }
						responses={ responses }
					/>
				</div>
				<div className="jp-forms__inbox-content-column">
					<FormsInboxResponse
						loading={ loading }
						response={ find( responses, { id: currentResponse } ) }
					/>
				</div>
			</div>
		</div>
	);
};

export default FormsInbox;
