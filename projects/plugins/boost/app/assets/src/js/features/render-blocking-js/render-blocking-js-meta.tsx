import { useEffect, useState } from 'react';
import { Button } from '@automattic/jetpack-components';
import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { z } from 'zod';
import { recordBoostEvent } from '$lib/utils/analytics';
import styles from './render-blocking-js-meta.module.scss';
import CollapsibleMeta from '$features/ui/collapsible-meta/collapsible-meta';
import { useNotices } from '$features/notice/context';

const datasyncKey = 'render_blocking_js_excludes';

const useExcludesQuery = ( onSuccess?: ( newState: string[] ) => void ) => {
	const [ { data }, { mutate } ] = useDataSync(
		'jetpack_boost_ds',
		datasyncKey,
		z.array( z.string() )
	);

	function updateValues( text: string ) {
		mutate(
			text.split( ',' ).map( item => item.trim() ),
			{
				onSuccess: newState => {
					// Run the passed on callbacks after the mutation has been applied
					onSuccess?.( newState );
				},
			}
		);
	}

	return [ data || [], updateValues ] as const;
};

const RenderBlockingJsMeta = () => {
	const noticeId = `render-blocking-js-meta-${ datasyncKey }`;

	const [ values, updateValues ] = useExcludesQuery( newState => {
		setInputValue( newState.join( ', ' ) );
		setNotice( {
			id: noticeId,
			type: 'success',
			message: __( 'Changes saved', 'jetpack-boost' ),
		} );
	} );
	const [ inputValue, setInputValue ] = useState( () => values.join( ', ' ) );
	const { setNotice } = useNotices();

	const serverValue = values.join( ', ' );

	/*
	 * Data Sync resolves asynchronously, so on the first render `values` is empty
	 * and the lazy initializer above seeds `inputValue` with an empty string.
	 * Sync the field once the saved patterns arrive (and after a save) so the
	 * input never shows a stale empty value while the Save button is enabled —
	 * which would otherwise let a stray click overwrite the list with an empty
	 * string. Keyed on the joined string rather than the array reference so it
	 * does not clobber what the user is currently typing.
	 */
	useEffect( () => {
		setInputValue( serverValue );
	}, [ serverValue ] );

	const onToggleHandler = ( isExpanded: boolean ) => {
		if ( ! isExpanded ) {
			setInputValue( serverValue );
		}
	};

	function save() {
		recordBoostEvent( 'defer_js_exceptions_save_clicked', {} );

		// Show saving notice
		setNotice( {
			id: noticeId,
			type: 'pending',
			message: __( 'Saving…', 'jetpack-boost' ),
		} );

		updateValues( inputValue );
	}

	const htmlId = `jb-render-blocking-js-meta-${ datasyncKey }`;

	// Be explicit about this because the optimizer breaks the linter otherwise.
	let summary;
	if ( values.length > 0 ) {
		/* Translators: %s refers to the list of excluded items. */
		summary = sprintf( __( 'Except: %s', 'jetpack-boost' ), values.join( ', ' ) );
	}

	if ( values.length === 0 ) {
		summary = __( 'No exceptions.', 'jetpack-boost' );
	}

	const content = (
		<div className={ styles.section }>
			<div className={ styles.title }>{ __( 'Exceptions', 'jetpack-boost' ) }</div>
			<div className={ styles[ 'manage-excludes' ] }>
				<label className={ styles[ 'sub-header' ] } htmlFor={ htmlId }>
					{ __( 'Exclude URL patterns:', 'jetpack-boost' ) }
				</label>
				<input
					type="text"
					value={ inputValue }
					placeholder={ __(
						'Comma-separated list of URL patterns to exclude, e.g.: checkout, gallery/(.*)',
						'jetpack-boost'
					) }
					id={ htmlId }
					onChange={ e => setInputValue( e.target.value ) }
					onKeyDown={ e => {
						if ( e.key === 'Enter' || e.key === 'NumpadEnter' ) {
							save();
						}
					} }
				/>
				<div className={ styles.description }>
					{ __(
						'JavaScript will not be deferred on pages matching these URL patterns. Use a comma (,) to separate the patterns. Use (.*) to address multiple URLs under a given path.',
						'jetpack-boost'
					) }
					<br />
					{ createInterpolateElement(
						__(
							'To keep a single script in place on every page instead, add the <code>data-jetpack-boost="ignore"</code> attribute to its script tag.',
							'jetpack-boost'
						),
						{
							code: <code />,
						}
					) }
				</div>
				<Button
					disabled={ serverValue === inputValue }
					className={ styles.button }
					onClick={ save }
				>
					{ __( 'Save', 'jetpack-boost' ) }
				</Button>
			</div>
		</div>
	);

	return (
		<div className={ styles.wrapper } data-testid={ `meta-${ datasyncKey }` }>
			<CollapsibleMeta
				headerText={ summary }
				toggleText={ __( 'Exclude URL patterns', 'jetpack-boost' ) }
				tracksEvent="defer_js_excludes_panel_toggle"
				onToggleHandler={ onToggleHandler }
			>
				{ content }
			</CollapsibleMeta>
		</div>
	);
};

export default RenderBlockingJsMeta;
