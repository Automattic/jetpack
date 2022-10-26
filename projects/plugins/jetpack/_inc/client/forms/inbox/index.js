/**
 * External dependencies
 */
import { JetpackFooter } from '@automattic/jetpack-components';
import {
	Button,
	__experimentalInputControl as InputControl, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
	SelectControl,
} from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { find, includes, map } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
/**
 * WordPress dependencies
 */
/**
 * Internal dependencies
 */
import { fetchResponses, getResponses, getTotalResponses, isFetchingResponses } from 'state/forms';
import JetpackFormsLogo from '../logo';
import { RESPONSES_PER_PAGE } from './constants';
import FormsInboxList from './list';
import FormsInboxResponse from './response';

const FormsInbox = () => {
	const [ currentResponse, setCurrentResponse ] = useState( -1 );
	const [ showResponseView, setShowResponseView ] = useState( false );
	const [ searchText, setSearchText ] = useState( '' );

	const dispatch = useDispatch();

	const [ loading, responses, total ] = useSelector( state => [
		isFetchingResponses( state ),
		getResponses( state ),
		getTotalResponses( state ),
	] );

	useEffect( () => {
		fetchResponses( {}, RESPONSES_PER_PAGE )( dispatch );
	}, [] );

	useEffect( () => {
		if ( responses.length === 0 || includes( map( responses, 'id' ), currentResponse ) ) {
			return;
		}

		setCurrentResponse( responses[ 0 ].id );
	}, [ responses ] );

	const handleLoadMore = useCallback( () => {
		fetchResponses( { search: searchText }, RESPONSES_PER_PAGE, responses.length )( dispatch );
	}, [ searchText, responses ] );

	const handleSearch = useCallback(
		event => {
			event.preventDefault();
			fetchResponses( { search: searchText }, RESPONSES_PER_PAGE )( dispatch );
		},
		[ searchText ]
	);

	const numberOfResponses = sprintf(
		/* translators: %s: Number of responses. */
		_n( '%s response', '%s responses', total, 'jetpack' ),
		total
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
						hasMore={ responses.length < total }
						loading={ loading }
						onLoadMore={ handleLoadMore }
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
			<JetpackFooter className="jp-forms__footer" moduleName={ __( 'Jetpack Forms', 'jetpack' ) } />
		</div>
	);
};

export default FormsInbox;
