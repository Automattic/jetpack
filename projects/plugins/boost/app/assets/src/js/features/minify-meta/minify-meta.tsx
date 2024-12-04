import { useEffect, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { type Props, useMetaQuery } from '$lib/stores/minify';
import { recordBoostEvent } from '$lib/utils/analytics';
import styles from './minify-meta.module.scss';
import CollapsibleMeta from '$features/ui/collapsible-meta/collapsible-meta';

const MetaComponent = ( { buttonText, placeholder, datasyncKey }: Props ) => {
	const [ values, updateValues ] = useMetaQuery( datasyncKey );
	const [ inputValue, setInputValue ] = useState( () => values.join( ', ' ) );

	const concatenateType = datasyncKey === 'minify_js_excludes' ? 'js' : 'css';
	const togglePanelTracksEvent = 'concatenate_' + concatenateType + '_panel_toggle'; // possible events: concatenate_js_panel_toggle, concatenate_css_panel_toggle

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

	const summary =
		values.length > 0
			? /* Translators: %s refers to the list of excluded items. */
			  sprintf( __( 'Except: %s', 'jetpack-boost' ), values.join( ', ' ) )
			: '';

	// Be explicit about this because the optimizer breaks the linter otherwise.
	let subHeaderText = '';
	if ( datasyncKey === 'minify_js_excludes' ) {
		subHeaderText = __( 'Exclude JS Strings:', 'jetpack-boost' );
	}

	if ( datasyncKey === 'minify_css_excludes' ) {
		subHeaderText = __( 'Exclude CSS Strings:', 'jetpack-boost' );
	}

	const content = (
		<div className={ styles.body }>
			<div className={ styles.section }>
				<div className={ styles.title }>{ __( 'Exceptions', 'jetpack-boost' ) }</div>
				<div className={ styles[ 'manage-excludes' ] }>
					<span className={ styles[ 'sub-header' ] }>{ subHeaderText }</span>
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
					<span className={ styles.help }>
						{ __( 'Use a comma (,) to separate the strings.', 'jetpack-boost' ) }
					</span>
					<div className={ styles[ 'buttons-container' ] }>
						<button disabled={ values.join( ', ' ) === inputValue } onClick={ save }>
							{ __( 'Save', 'jetpack-boost' ) }
						</button>
					</div>
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
