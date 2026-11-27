import { useState } from 'react';
import { Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { type Props, useMetaQuery } from '$lib/stores/minify';
import { recordBoostEvent } from '$lib/utils/analytics';
import styles from './minify-meta.module.scss';
import CollapsibleMeta from '$features/ui/collapsible-meta/collapsible-meta';
import SaveButton from '$features/ui/save-button/save-button';
import { useNotices } from '$features/notice/context';
import { useMinifyDefaults } from './lib/stores';

const MetaComponent = ( { placeholder, datasyncKey }: Props ) => {
	const scriptHelp = __(
		'Scripts listed here will be excluded from concatenation and minification. They continue loading separately.',
		'jetpack-boost'
	);
	const styleHelp = __(
		'Styles listed here will be excluded from concatenation and minification. They continue loading separately.',
		'jetpack-boost'
	);
	const noticeId = `minify-meta-${ datasyncKey }`;

	const [ values, updateValues ] = useMetaQuery( datasyncKey, newState => {
		setInputValue( newState.join( ', ' ) );
		setNotice( {
			id: noticeId,
			type: 'success',
			message: __( 'Changes saved', 'jetpack-boost' ),
		} );
	} );
	const [ inputValue, setInputValue ] = useState( () => values.join( ', ' ) );
	const { setNotice } = useNotices();
	const minifyDefaults = useMinifyDefaults( datasyncKey );

	const concatenateType = datasyncKey === 'minify_js_excludes' ? 'js' : 'css';
	const togglePanelTracksEvent = 'concatenate_' + concatenateType + '_panel_toggle'; // possible events: concatenate_js_panel_toggle, concatenate_css_panel_toggle

	let defaultValue = '';
	if ( minifyDefaults !== undefined ) {
		defaultValue = minifyDefaults.join( ', ' );
	}

	const onToggleHandler = ( isExpanded: boolean ) => {
		if ( ! isExpanded ) {
			setInputValue( values.join( ', ' ) );
		}
	};

	function save() {
		/*
		 * Possible Events:
		 * concatenate_js_exceptions_save_clicked
		 * concatenate_css_exceptions_save_clicked
		 */
		recordBoostEvent( 'concatenate_' + concatenateType + '_exceptions_save_clicked', {} );

		// Show saving notice
		setNotice( {
			id: noticeId,
			type: 'pending',
			message: __( 'Saving…', 'jetpack-boost' ),
		} );

		updateValues( inputValue );
	}

	const htmlId = `jb-minify-meta-${ datasyncKey }`;

	function loadDefaultValue() {
		setInputValue( defaultValue );
		/*
		 * Possible Events:
		 * minify_js_exceptions_load_default
		 * minify_css_exceptions_load_default
		 */
		recordBoostEvent( 'minify_' + concatenateType + '_exceptions_load_default', {} );
	}

	const content = (
		<div className={ styles.body }>
			<div className={ styles.section } data-except-content>
				<div className={ styles[ 'manage-excludes' ] }>
					<label className={ styles[ 'sub-header' ] } htmlFor={ htmlId }>
						{ __( 'Add handles separated with a comma:', 'jetpack-boost' ) }
					</label>
					<input
						type="text"
						value={ inputValue }
						placeholder={ placeholder }
						id={ htmlId }
						onChange={ e => setInputValue( e.target.value ) }
						onKeyDown={ e => {
							if ( e.key === 'Enter' || e.key === 'NumpadEnter' ) {
								save();
							}
						} }
					/>
					<div className={ styles.description }>
						{ datasyncKey === 'minify_js_excludes' ? scriptHelp : styleHelp }
					</div>
					<SaveButton
						disabled={ values.join( ', ' ) === inputValue }
						className={ styles.button }
						onClick={ save }
					/>
					<Button
						disabled={ inputValue === defaultValue }
						onClick={ loadDefaultValue }
						className={ styles.button }
						variant="link"
					>
						{ __( 'Load default handles', 'jetpack-boost' ) }
					</Button>
				</div>
			</div>
		</div>
	);

	return (
		<div className={ styles.wrapper } data-testid={ `meta-${ datasyncKey }` }>
			<CollapsibleMeta
				exceptions={ values }
				tracksEvent={ togglePanelTracksEvent }
				onToggleHandler={ onToggleHandler }
			>
				{ content }
			</CollapsibleMeta>
		</div>
	);
};

export default MetaComponent;
