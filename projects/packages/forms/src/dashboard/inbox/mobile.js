import { Gridicon } from '@automattic/jetpack-components';
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
import Stack from '../components/stack';
import { STORE_NAME } from '../state';
import InboxList from './list';
import InboxResponse from './response';

import './style.scss';

const MobileInbox = ( {
	currentResponseId,
	isLoading,
	setCurrentResponseId,
	responses,
} ) => {
	const [ view, setView ] = useState( 'list' );

	const handleSelectResponse = ( id ) => {
		if ( ! find( responses, { id } ) ) {
			return;
		}

		setCurrentResponseId( id );
		setView( 'response' );
	};

	const handleGoBack = ( event ) => {
		event.preventDefault();
		setView( 'list' );
	};

	const title = view === 'response'
		? (
			<a onClick={ handleGoBack }>
				<Gridicon icon="arrow-left" />
				{ __( 'View all responses', 'jetpack-forms' ) }
			</a>
		  )
		: __( 'Responses', 'jetpack-forms' );

	return (
		<Layout
			className="jp-forms__inbox"
			title={ title }
		>
			<Stack activeViewKey={ view }>
				<InboxList
					key="list"
					currentResponseId={ -1 }
					setCurrentResponseId={ handleSelectResponse }
					responses={ responses }
				/>

				<InboxResponse
					key="response"
					isLoading={ isLoading }
					response={ find( responses, { id: currentResponseId } ) }
				/>
			</Stack>
		</Layout>
	);

	return (
		<Stack activeViewKey={ view }>
			<Layout
				key="list"
				title={ __( 'Responses', 'jetpack-forms' ) }
				className="jp-forms__inbox"
			>
				<InboxList
					currentResponseId={ -1 }
					setCurrentResponseId={ handleSelectResponse }
					responses={ responses }
				/>
			</Layout>

			<Layout
				key="response"
				title={
					<a onClick={ handleGoBack }>
						<Gridicon icon="arrow-left" />
						{ __( 'View all responses', 'jetpack-forms' ) }
					</a>
				}
				className="jp-forms__inbox"
			>
				<InboxResponse
					isLoading={ isLoading }
					response={ find( responses, { id: currentResponseId } ) }
				/>
			</Layout>
		</Stack>
	);
};

export default MobileInbox;
