/**
 * External dependencies
 */
/**
 * WordPress dependencies
 */
import { dateI18n } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import { map, times } from 'lodash';
/**
 * Internal dependencies
 */
import { getDisplayName, getPath } from './util';

const FormsInboxResponse = ( { currentResponse, loading, onViewResponse, responses } ) => {
	const viewResponse = responseId => () => onViewResponse( responseId );

	return (
		<div className="jp-forms__inbox-list">
			<div className="jp-forms__inbox-list-header">
				<div className="jp-forms__inbox-list-cell is-checkbox">
					<input type="checkbox" className="jp-forms__inbox-list-checkbox" />
				</div>
				<div className="jp-forms__inbox-list-cell">{ __( 'From', 'jetpack' ) }</div>
				<div className="jp-forms__inbox-list-cell">{ __( 'Source', 'jetpack' ) }</div>
				<div className="jp-forms__inbox-list-cell">{ __( 'Date', 'jetpack' ) }</div>
			</div>
			{ map( responses, response => {
				const classes = classnames( 'jp-forms__inbox-list-row', {
					'is-selected': currentResponse && currentResponse === response.id,
				} );

				return (
					<div key={ response.uid } className={ classes }>
						<div className="jp-forms__inbox-list-cell is-checkbox">
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
				);
			} ) }

			{ loading &&
				times( 8, n => (
					<div key={ n } className="jp-forms__inbox-list-row is-loading">
						<div className="jp-forms__inbox-list-cell is-checkbox">
							<input type="checkbox" className="jp-forms__inbox-list-checkbox" disabled />
						</div>
						<div className="jp-forms__inbox-list-cell" />
						<div className="jp-forms__inbox-list-cell" />
						<div className="jp-forms__inbox-list-cell" />
					</div>
				) ) }
		</div>
	);
};

export default FormsInboxResponse;
