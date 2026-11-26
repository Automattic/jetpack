import { useEffect, useState } from 'react';
import SaveButton from '$features/ui/save-button/save-button';
import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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

	const content = (
		<div className={ styles.section } data-except-content>
			<div className={ styles[ 'manage-excludes' ] }>
				<label className={ styles[ 'sub-header' ] } htmlFor={ htmlId }>
					{ __( 'Add URLs or patterns separated with a comma:', 'jetpack-boost' ) }
				</label>
				<input
					type="text"
					value={ inputValue }
					placeholder={ __( 'e.g. checkout, gallery/(.*)', 'jetpack-boost' ) }
					id={ htmlId }
					onChange={ e => setInputValue( e.target.value ) }
					onKeyDown={ e => {
						if ( e.key === 'Enter' || e.key === 'NumpadEnter' ) {
							save();
						}
					} }
				/>
				<div className={ styles.description }>
					{ __( "JavaScript won't be deferred on these pages.", 'jetpack-boost' ) }
					<br />
					{ createInterpolateElement(
						__(
							'Need to exclude a specific script instead? Add <code>data-jetpack-boost="ignore"</code> to its script tag.',
							'jetpack-boost'
						),
						{ code: <code /> }
					) }
				</div>
				<SaveButton
					disabled={ serverValue === inputValue }
					className={ styles.button }
					onClick={ save }
				/>
			</div>
		</div>
	);

	return (
		<div className={ styles.wrapper } data-testid={ `meta-${ datasyncKey }` }>
			<CollapsibleMeta
				exceptions={ values }
				tracksEvent="defer_js_excludes_panel_toggle"
				onToggleHandler={ onToggleHandler }
			>
				{ content }
			</CollapsibleMeta>
		</div>
	);
};

export default RenderBlockingJsMeta;
