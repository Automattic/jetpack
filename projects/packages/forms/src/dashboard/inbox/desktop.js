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

const DesktopInbox = ( {
	currentResponseId,
	isLoading,
	setCurrentResponseId,
	responses,
} ) => {
	const selectActiveResponse = useCallback( ( id ) => {
		setCurrentResponseId( id );
	}, [ setCurrentResponseId ] );

	const numberOfResponses = sprintf(
		/* translators: %s: Number of responses. */
		_n( '%s response', '%s responses', total, 'jetpack-forms' ),
		total
	);

	return (
		<Layout
			className="jp-forms__inbox"
			title={ __( 'Responses', 'jetpack-forms' ) }
			subtitle={ numberOfResponses }
		>
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

			<div className="jp-forms__inbox-content-wrapper">
				<div className="jp-forms__inbox-content">
					<div className="jp-forms__inbox-content-column">
						<InboxList
							currentResponseId={ currentResponseId }
							setCurrentResponseId={ setCurrentResponseId }
							responses={ responses }
						/>
					</div>

					<div className="jp-forms__inbox-content-column">
						<InboxResponse
							isLoading={ isLoading }
							response={ find( responses, { id: currentResponseId } ) }
						/>
					</div>
				</div>
			</div>
		</Layout>
	);
};

export default DesktopInbox;
