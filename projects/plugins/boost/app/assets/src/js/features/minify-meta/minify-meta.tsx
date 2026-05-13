import { useState } from 'react';
import { Button } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import { Card, CollapsibleCard, Stack } from '@wordpress/ui';
import { type Props, useMetaQuery } from '$lib/stores/minify';
import { recordBoostEvent } from '$lib/utils/analytics';
import styles from './minify-meta.module.scss';
import { useNotices } from '$features/notice/context';
import { useMinifyDefaults } from './lib/stores';

const MetaComponent = ( { buttonText, placeholder, datasyncKey }: Props ) => {
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

	let defaultValue = '';
	if ( minifyDefaults !== undefined ) {
		defaultValue = minifyDefaults.join( ', ' );
	}

	const handleOpenChange = ( open: boolean ) => {
		recordBoostEvent( `concatenate_${ concatenateType }_panel_toggle`, {
			status: open ? 'open' : 'close',
		} );
		if ( ! open ) {
			setInputValue( values.join( ', ' ) );
		}
	};

	function save() {
		recordBoostEvent( `concatenate_${ concatenateType }_exceptions_save_clicked`, {} );

		setNotice( {
			id: noticeId,
			type: 'pending',
			message: __( 'Saving…', 'jetpack-boost' ),
		} );

		updateValues( inputValue );
	}

	const htmlId = `jb-minify-meta-${ datasyncKey }`;

	let summary;
	if ( values.length > 0 ) {
		/* Translators: %s refers to the list of excluded items. */
		summary = sprintf( __( 'Except: %s', 'jetpack-boost' ), values.join( ', ' ) );
	} else {
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
		recordBoostEvent( `minify_${ concatenateType }_exceptions_load_default`, {} );
	}

	return (
		<CollapsibleCard.Root onOpenChange={ handleOpenChange } data-testid={ `meta-${ datasyncKey }` }>
			<CollapsibleCard.Header>
				<Stack direction="column" gap="xs">
					<Card.Title>{ buttonText }</Card.Title>
					<CollapsibleCard.HeaderDescription>{ summary }</CollapsibleCard.HeaderDescription>
				</Stack>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
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
					<div className={ styles.buttons }>
						<Button disabled={ values.join( ', ' ) === inputValue } onClick={ save }>
							{ __( 'Save', 'jetpack-boost' ) }
						</Button>
						<Button
							disabled={ inputValue === defaultValue }
							onClick={ loadDefaultValue }
							variant="link"
						>
							{ __( 'Load default handles', 'jetpack-boost' ) }
						</Button>
					</div>
				</div>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
};

export default MetaComponent;
