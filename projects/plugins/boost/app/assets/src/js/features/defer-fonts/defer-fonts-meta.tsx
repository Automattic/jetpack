import { useModuleSurface } from '$features/module/surface';
import { useEffect, useState } from 'react';
import SaveButton from '$features/ui/save-button/save-button';
import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { __, sprintf } from '@wordpress/i18n';
import { z } from 'zod';
import { recordBoostEvent } from '$lib/utils/analytics';
import styles from '$features/render-blocking-js/render-blocking-js-meta.module.scss';
import CollapsibleMeta from '$features/ui/collapsible-meta/collapsible-meta';
import { useNotices } from '$features/notice/context';

const datasyncKey = 'defer_fonts_excludes';

const DeferFontsMeta = () => {
	const isRow = useModuleSurface() === 'row';
	const noticeId = `defer-fonts-meta-${ datasyncKey }`;
	const htmlId = `jb-defer-fonts-meta-${ datasyncKey }`;
	const { setNotice } = useNotices();

	const [ { data }, { mutate } ] = useDataSync(
		'jetpack_boost_ds',
		datasyncKey,
		z.array( z.string() )
	);
	const values = data || [];
	const serverValue = values.join( ', ' );
	const [ inputValue, setInputValue ] = useState( serverValue );

	// Data Sync resolves after the first render, so sync the field once the saved list arrives.
	useEffect( () => {
		setInputValue( serverValue );
	}, [ serverValue ] );

	function save() {
		recordBoostEvent( 'defer_fonts_exceptions_save_clicked', {} );
		setNotice( { id: noticeId, type: 'pending', message: __( 'Saving…', 'jetpack-boost' ) } );
		mutate(
			inputValue.split( ',' ).map( item => item.trim() ),
			{
				onSuccess: () =>
					setNotice( {
						id: noticeId,
						type: 'success',
						message: __( 'Changes saved', 'jetpack-boost' ),
					} ),
			}
		);
	}

	const summary =
		values.length > 0
			? /* translators: %s is the list of font families that are not deferred. */
				sprintf( __( 'Except: %s', 'jetpack-boost' ), serverValue )
			: __( 'No exceptions.', 'jetpack-boost' );

	return (
		<div className={ styles.wrapper } data-testid={ `meta-${ datasyncKey }` }>
			<CollapsibleMeta
				exceptions={ isRow ? values : undefined }
				headerText={ summary }
				toggleText={ __( 'Exclude icon fonts', 'jetpack-boost' ) }
				tracksEvent="defer_fonts_excludes_panel_toggle"
				onToggleHandler={ isExpanded => ! isExpanded && setInputValue( serverValue ) }
			>
				<div className={ styles.section } data-except-content={ isRow || undefined }>
					{ ! isRow && (
						<div className={ styles.title }>{ __( 'Exceptions', 'jetpack-boost' ) }</div>
					) }
					<div className={ styles[ 'manage-excludes' ] }>
						<label className={ styles[ 'sub-header' ] } htmlFor={ htmlId }>
							{ __( 'Add font family names separated with a comma:', 'jetpack-boost' ) }
						</label>
						{ /* ds-allow: input -- matches the sibling Defer JS and Concatenate exclusion fields, which share these styles. */ }
						<input
							type="text"
							value={ inputValue }
							placeholder={ __( 'e.g. Font Awesome, Material Icons', 'jetpack-boost' ) }
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
								'Fonts whose family name starts with one of these load right away instead of after the page. Use it for icon fonts, which show as empty boxes until they load.',
								'jetpack-boost'
							) }
						</div>
						<SaveButton
							disabled={ serverValue === inputValue }
							className={ styles.button }
							onClick={ save }
						/>
					</div>
				</div>
			</CollapsibleMeta>
		</div>
	);
};

export default DeferFontsMeta;
