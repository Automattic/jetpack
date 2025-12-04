/* eslint-disable react-hooks/rules-of-hooks */
/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import {
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
	ExternalLink,
	Spinner,
	Button,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { useCallback } from '@wordpress/element';
import { useSearch, useNavigate } from '@wordpress/route';

/**
 * Get display name from response.
 *
 * @param {object} response - The form response object.
 * @return {string} The display name.
 */
const getDisplayName = response => {
	const { author_name, author_email, author_url, ip } = response;
	return decodeEntities( author_name || author_email || author_url || ip || 'Anonymous' );
};

/**
 * Single response view component.
 *
 * @param {object} props            - Component props.
 * @param {number} props.responseId - The ID of the response to display.
 * @return {JSX.Element} The response view component.
 */
function SingleResponseView( { responseId } ) {
	const { response, isLoading } = useSelect(
		select => {
			if ( ! responseId ) {
				return { response: null, isLoading: false };
			}
			return {
				response: select( coreStore ).getEntityRecord( 'postType', 'feedback', responseId ),
				isLoading: select( coreStore ).isResolving( 'getEntityRecord', [
					'postType',
					'feedback',
					responseId,
				] ),
			};
		},
		[ responseId ]
	);

	if ( isLoading ) {
		return (
			<div style={ { display: 'flex', justifyContent: 'center', padding: '40px' } }>
				<Spinner />
			</div>
		);
	}

	if ( ! response ) {
		return (
			<div style={ { padding: '20px' } }>
				<p>{ __( 'Response not found.', 'jetpack-forms' ) }</p>
			</div>
		);
	}

	const displayName = getDisplayName( response );
	const dateSettings = getDateSettings();

	return (
		<div className="jp-forms__inspector-response">
			<div className="jp-forms__inspector-header" style={ { marginBottom: '20px' } }>
				<HStack alignment="topLeft" spacing="3">
					<VStack spacing="0">
						<h3 style={ { margin: 0 } }>{ displayName }</h3>
						{ response.author_email && displayName !== response.author_email && (
							<p style={ { margin: '4px 0 0', color: '#666' } }>
								<a href={ `mailto:${ response.author_email }` }>{ response.author_email }</a>
							</p>
						) }
					</VStack>
				</HStack>
			</div>

			<div className="jp-forms__inspector-meta" style={ { marginBottom: '20px' } }>
				<table style={ { width: '100%', borderCollapse: 'collapse' } }>
					<tbody>
						<tr>
							<th
								style={ {
									textAlign: 'left',
									padding: '4px 8px 4px 0',
									fontWeight: 'normal',
									color: '#666',
								} }
							>
								{ __( 'Date:', 'jetpack-forms' ) }
							</th>
							<td style={ { padding: '4px 0' } }>
								{ sprintf(
									/* Translators: %1$s is the date, %2$s is the time. */
									__( '%1$s at %2$s', 'jetpack-forms' ),
									dateI18n( dateSettings.formats.date, response.date ),
									dateI18n( dateSettings.formats.time, response.date )
								) }
							</td>
						</tr>
						<tr>
							<th
								style={ {
									textAlign: 'left',
									padding: '4px 8px 4px 0',
									fontWeight: 'normal',
									color: '#666',
								} }
							>
								{ __( 'Source:', 'jetpack-forms' ) }
							</th>
							<td style={ { padding: '4px 0' } }>
								{ response.entry_permalink ? (
									<ExternalLink href={ response.entry_permalink }>
										{ decodeEntities( response.entry_title ) || response.entry_permalink }
									</ExternalLink>
								) : (
									decodeEntities( response.entry_title ) || __( 'Unknown', 'jetpack-forms' )
								) }
							</td>
						</tr>
						{ response.ip && (
							<tr>
								<th
									style={ {
										textAlign: 'left',
										padding: '4px 8px 4px 0',
										fontWeight: 'normal',
										color: '#666',
									} }
								>
									{ __( 'IP address:', 'jetpack-forms' ) }
								</th>
								<td style={ { padding: '4px 0' } }>{ response.ip }</td>
							</tr>
						) }
					</tbody>
				</table>
			</div>

			{ response.fields && Object.keys( response.fields ).length > 0 && (
				<div className="jp-forms__inspector-fields">
					{ Object.entries( response.fields ).map( ( [ key, value ] ) => (
						<div
							key={ key }
							style={ {
								marginBottom: '16px',
								paddingBottom: '16px',
								borderBottom: '1px solid #eee',
							} }
						>
							<div
								style={ {
									fontWeight: '600',
									marginBottom: '4px',
									color: '#1e1e1e',
								} }
							>
								{ key.endsWith( '?' ) ? key : `${ key }:` }
							</div>
							<div style={ { color: '#3c434a' } }>{ renderFieldValue( value ) }</div>
						</div>
					) ) }
				</div>
			) }
		</div>
	);
}

/**
 * Render a field value, handling different types.
 *
 * @param {*} value - The field value to render.
 * @return {JSX.Element|string} The rendered value.
 */
function renderFieldValue( value ) {
	if ( value === null || value === undefined ) {
		return '-';
	}

	if ( value && typeof value === 'object' && 'files' in value ) {
		return (
			<ul style={ { margin: 0, paddingLeft: '20px' } }>
				{ value.files.map( ( file, index ) => (
					<li key={ index }>
						<ExternalLink href={ file.url }>{ decodeEntities( file.name ) }</ExternalLink>
					</li>
				) ) }
			</ul>
		);
	}

	if ( Array.isArray( value ) ) {
		return value.join( ', ' );
	}

	if ( typeof value === 'object' ) {
		return JSON.stringify( value );
	}

	const emailRegEx = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
	if ( typeof value === 'string' && emailRegEx.test( value ) ) {
		return <a href={ `mailto:${ value }` }>{ value }</a>;
	}

	return String( value );
}

/**
 * Inspector component for viewing response details.
 *
 * @return {JSX.Element|null} The inspector component.
 */
export function inspector() {
	const searchParams = useSearch( { from: '/responses/$view' } );
	const navigate = useNavigate();
	const responseIds = searchParams?.responseIds || [];

	if ( ! responseIds.length ) {
		return null;
	}

	const isBulk = responseIds.length > 1;

	const handleClose = useCallback( () => {
		navigate( {
			search: {
				...searchParams,
				responseIds: undefined,
			},
		} );
	}, [ navigate, searchParams ] );

	return (
		<Page
			title={
				isBulk
					? sprintf(
							/* Translators: %d is the number of selected responses */
							__( '%d Responses Selected', 'jetpack-forms' ),
							responseIds.length
					  )
					: __( 'Response Details', 'jetpack-forms' )
			}
			actions={
				<Button
					icon={ close }
					label={ __( 'Close', 'jetpack-forms' ) }
					onClick={ handleClose }
					size="compact"
				/>
			}
			showSidebarToggle={ false }
		>
			{ isBulk ? (
				<div style={ { padding: '20px' } }>
					<p>
						{ sprintf(
							/* Translators: %d is the number of selected responses */
							__(
								'%d responses selected. Select a single response to view details.',
								'jetpack-forms'
							),
							responseIds.length
						) }
					</p>
				</div>
			) : (
				<SingleResponseView responseId={ Number( responseIds[ 0 ] ) } />
			) }
		</Page>
	);
}
