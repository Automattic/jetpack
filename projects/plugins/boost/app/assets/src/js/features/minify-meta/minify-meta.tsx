import { useEffect, useState } from 'react';
import { Button } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import { type Props, useMetaQuery } from '$lib/stores/minify';
import { recordBoostEvent } from '$lib/utils/analytics';
import styles from './minify-meta.module.scss';
import CollapsibleMeta from '$features/ui/collapsible-meta/collapsible-meta';
import { useMinifyDefaults } from './lib/stores';

const MetaComponent = ( { buttonText, placeholder, datasyncKey }: Props ) => {
	const [ values, updateValues ] = useMetaQuery( datasyncKey );
	const [ inputValue, setInputValue ] = useState( () => values.join( ', ' ) );
	const minifyDefaults = useMinifyDefaults( datasyncKey );

	const concatenateType = datasyncKey === 'minify_js_excludes' ? 'js' : 'css';
	const togglePanelTracksEvent = 'concatenate_' + concatenateType + '_panel_toggle'; // possible events: concatenate_js_panel_toggle, concatenate_css_panel_toggle

	let defaultValue = '';
	if ( minifyDefaults !== undefined ) {
		defaultValue = minifyDefaults.join( ', ' );
	}

	useEffect( () => {
		setInputValue( values.join( ', ' ) );
	}, [ values ] );

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

		updateValues( inputValue );
	}

	const htmlId = `jb-minify-meta-${ datasyncKey }`;

	// Be explicit about this because the optimizer breaks the linter otherwise.
	let summary;
	if ( values.length > 0 ) {
		/* Translators: %s refers to the list of excluded items. */
		summary = sprintf( __( 'Except: %s', 'jetpack-boost' ), values.join( ', ' ) );
	}

	if ( values.length === 0 ) {
		summary = __( 'No exceptions.', 'jetpack-boost' );
	}

	let subHeaderText = '';
	if ( datasyncKey === 'minify_js_excludes' ) {
		subHeaderText = __( 'Exclude JS handles:', 'jetpack-boost' );
	}

	if ( datasyncKey === 'minify_css_excludes' ) {
		subHeaderText = __( 'Exclude CSS handles:', 'jetpack-boost' );
	}

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
			<div className={ styles.section }>
				<div className={ styles.title }>{ __( 'Exceptions', 'jetpack-boost' ) }</div>
				<div className={ styles[ 'manage-excludes' ] }>
					<label className={ styles[ 'sub-header' ] } htmlFor={ htmlId }>
						{ subHeaderText }
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
						{ __( 'Use a comma (,) to separate the handles.', 'jetpack-boost' ) }
					</div>
					<Button
						disabled={ values.join( ', ' ) === inputValue }
						className={ styles.button }
						onClick={ save }
					>
						{ __( 'Save', 'jetpack-boost' ) }
					</Button>
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
				headerText={ summary }
				toggleText={ buttonText }
				tracksEvent={ togglePanelTracksEvent }
				onToggleHandler={ onToggleHandler }
			>
				{ content }
			</CollapsibleMeta>
		</div>
	);
};

export default MetaComponent;
