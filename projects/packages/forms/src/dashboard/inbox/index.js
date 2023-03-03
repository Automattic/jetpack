import {
	Button,
	__experimentalInputControl as InputControl, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
	SelectControl,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import classnames from 'classnames';
import { find } from 'lodash';
import Layout from '../components/layout';
import { STORE_NAME } from '../state';
import InboxList from './list';
import InboxResponse from './response';

import './style.scss';

const Inbox = () => {
	const [ currentResponseId, setCurrentResponseId ] = useState( -1 );
	const [ searchText, setSearchText ] = useState( '' );

	const [ loading, responses, total ] = useSelect(
		select => {
			const stateSelector = select( STORE_NAME );
			return [
				stateSelector.isFetchingResponses(),
				stateSelector.getResponses( searchText ),
				stateSelector.getTotalResponses(),
			];
		},
		[ searchText ]
	);

	useEffect( () => {
		setCurrentResponseId( responses.length > 0 ? responses[ 0 ].id : -1 );
	}, [ responses ] );

	const handleSearch = useCallback( event => {
		event.preventDefault();
		// this only needs to actually set a searchText (called differently) so we put as dependency on the useSelect
		// currently the search is being triggered every time searchText changes
	}, [] );

	const numberOfResponses = sprintf(
		/* translators: %s: Number of responses. */
		_n( '%s response', '%s responses', total, 'jetpack-forms' ),
		total
	);

	const contentClasses = classnames( 'jp-forms__inbox-content', {
		'show-response': currentResponseId >= 0,
	} );

	return (
		<Layout title={ __( 'Responses', 'jetpack-forms' ) } subtitle={ numberOfResponses }>
			<div className="jp-forms__actions">
				<form className="jp-forms__actions-form">
					<SelectControl
						options={ [
							{ label: __( 'Bulk actions', 'jetpack-forms' ), value: '' },
							{ label: __( 'Trash', 'jetpack-forms' ), value: 'trash' },
							{ label: __( 'Move to spam', 'jetpack-forms' ), value: 'spam' },
						] }
					/>
					<Button variant="secondary">{ __( 'Apply', 'jetpack-forms' ) }</Button>
				</form>
				<form className="jp-forms__actions-form" onSubmit={ handleSearch }>
					<InputControl onChange={ setSearchText } value={ searchText } />
					<Button type="submit" variant="secondary">
						{ __( 'Search', 'jetpack-forms' ) }
					</Button>
				</form>
			</div>

			<div className={ contentClasses }>
				<div className="jp-forms__inbox-content-column">
					<InboxList
						currentResponseId={ currentResponseId }
						setCurrentResponseId={ setCurrentResponseId }
						responses={ responses }
					/>
				</div>

				<div className="jp-forms__inbox-content-column">
					<InboxResponse
						isLoading={ loading }
						response={ find( responses, { id: currentResponseId } ) }
					/>
				</div>
			</div>
		</Layout>
	);
};

export default Inbox;
