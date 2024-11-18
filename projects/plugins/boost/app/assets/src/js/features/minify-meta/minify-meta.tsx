import { useEffect, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { type Props, useMetaQuery } from '$lib/stores/minify';
import styles from './minify-meta.module.scss';
import { Button } from '@automattic/jetpack-components';
import ChevronDown from '$svg/chevron-down';
import ChevronUp from '$svg/chevron-up';

const MetaComponent = ( { buttonText, placeholder, datasyncKey }: Props ) => {
	const [ values, updateValues ] = useMetaQuery( datasyncKey );
	const [ inputValue, setInputValue ] = useState( () => values.join( ', ' ) );
	const [ isExpanded, setIsExpanded ] = useState( false );

	useEffect( () => {
		setInputValue( values.join( ', ' ) );
	}, [ values ] );

	function save() {
		updateValues( inputValue );
		setIsExpanded( false );
	}

	const htmlId = `jb-minify-meta-${ datasyncKey }`;

	return (
		<div className={ styles.wrapper } data-testid={ `meta-${ datasyncKey }` }>
			<div className={ styles[ 'minify-meta' ] }>
				<div className={ styles.summary }>
					{ values.length > 0 && (
						<div className="successes">
							{ sprintf(
								/* Translators: %s refers to the list of excluded items. */
								__( 'Except: %s', 'jetpack-boost' ),
								values.join( ', ' )
							) }
						</div>
					) }
				</div>

				<Button
					variant="link"
					size="small"
					weight="regular"
					className={ styles[ 'edit-button' ] }
					onClick={ () => setIsExpanded( ! isExpanded ) }
					icon={ isExpanded ? <ChevronUp /> : <ChevronDown /> }
				>
					{ isExpanded ? __( 'Hide', 'jetpack-boost' ) : buttonText }
				</Button>
			</div>
			{ isExpanded && (
				<div className={ styles.section }>
					<div className={ styles[ 'manage-excludes' ] }>
						<label htmlFor={ htmlId }>{ __( 'Exceptions', 'jetpack-boost' ) }</label>
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
			) }
		</div>
	);
};

export default MetaComponent;
