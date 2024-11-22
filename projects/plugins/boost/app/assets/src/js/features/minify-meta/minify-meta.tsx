import { useEffect, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { type Props, useMetaQuery } from '$lib/stores/minify';
import { recordBoostEvent } from '$lib/utils/analytics';
import styles from './minify-meta.module.scss';
import CollapsibleMeta from '$features/ui/collapsible-meta/collapsible-meta';

const MetaComponent = ( { buttonText, placeholder, datasyncKey }: Props ) => {
	const [ values, updateValues ] = useMetaQuery( datasyncKey );
	const [ inputValue, setInputValue ] = useState( () => values.join( ', ' ) );
	const [ isExpanded, setIsExpanded ] = useState( false );

	const concatenateType = datasyncKey === 'minify_js_excludes' ? 'js' : 'css';
	const togglePanelTracksEvent = 'concatenate_' + concatenateType + '_panel_toggle'; // possible events: concatenate_js_panel_toggle, concatenate_css_panel_toggle

	useEffect( () => {
		setInputValue( values.join( ', ' ) );
	}, [ values, isExpanded ] );

	function save() {
		/*
		 * Possible Events:
		 * concatenate_js_exceptions_save_clicked
		 * concatenate_css_exceptions_save_clicked
		 */
		recordBoostEvent( 'concatenate_' + concatenateType + '_exceptions_save_clicked', {} );

		updateValues( inputValue );
		setIsExpanded( false );
	}

	const htmlId = `jb-minify-meta-${ datasyncKey }`;

	const summary = values.length > 0 && (
		<div className="successes">
			{ sprintf(
				/* Translators: %s refers to the list of excluded items. */
				__( 'Except: %s', 'jetpack-boost' ),
				values.join( ', ' )
			) }
		</div>
	);

	const Header = () => (
		<div className={ styles[ 'section-title' ] }>
			<h4>{ __( 'Exceptions', 'jetpack-boost' ) }</h4>
		</div>
	);

	const content = (
		<div className={ styles.wrapper } data-testid={ `meta-${ datasyncKey }` }>
			<div className={ styles.section }>
				<div className={ styles[ 'manage-excludes' ] }>
					<span className={ styles[ 'sub-header' ] }>
						{ sprintf(
							/* Translators: %s refers to the type of script. */
							__( 'Exclude the following %s scripts:', 'jetpack-boost' ),
							datasyncKey === 'minify_js_excludes' ? 'JS' : 'CSS'
						) }
					</span>
					<input
						type="text"
						value={ inputValue }
						placeholder={ placeholder }
						id={ htmlId }
						onChange={ e => setInputValue( e.target.value ) }
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
		<CollapsibleMeta
			isExpandedExternal={ isExpanded }
			setIsExpandedExternal={ setIsExpanded }
			header={ <Header /> }
			summary={ summary }
			editText={ buttonText }
			tracksEvent={ togglePanelTracksEvent }
		>
			{ content }
		</CollapsibleMeta>
	);
};

export default MetaComponent;
