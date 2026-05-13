import { useState } from 'react';
import { TextControl } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Badge, Button, Card, CollapsibleCard, Stack } from '@wordpress/ui';
import { type Props, useMetaQuery } from '$lib/stores/minify';
import { recordBoostEvent } from '$lib/utils/analytics';
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

	const summary =
		values.length > 0
			? sprintf(
					/* translators: %d is the number of exception handles configured. */
					_n( '%d exception', '%d exceptions', values.length, 'jetpack-boost' ),
					values.length
			  )
			: __( 'No exceptions', 'jetpack-boost' );

	let subHeaderText = '';
	if ( datasyncKey === 'minify_js_excludes' ) {
		subHeaderText = __( 'Exclude JS handles', 'jetpack-boost' );
	}
	if ( datasyncKey === 'minify_css_excludes' ) {
		subHeaderText = __( 'Exclude CSS handles', 'jetpack-boost' );
	}

	function loadDefaultValue() {
		setInputValue( defaultValue );
		recordBoostEvent( `minify_${ concatenateType }_exceptions_load_default`, {} );
	}

	return (
		<CollapsibleCard.Root onOpenChange={ handleOpenChange } data-testid={ `meta-${ datasyncKey }` }>
			<CollapsibleCard.Header>
				<Stack direction="row" justify="space-between" align="center">
					<Card.Title>{ buttonText }</Card.Title>
					<Badge intent="none">{ summary }</Badge>
				</Stack>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<Stack direction="column" gap="md">
					<TextControl
						__next40pxDefaultSize
						label={ subHeaderText }
						help={ __( 'Use a comma (,) to separate the handles.', 'jetpack-boost' ) }
						value={ inputValue }
						placeholder={ placeholder }
						onChange={ setInputValue }
						onKeyDown={ ( e: React.KeyboardEvent< HTMLInputElement > ) => {
							if ( e.key === 'Enter' || e.key === 'NumpadEnter' ) {
								save();
							}
						} }
					/>
					<Stack direction="row" gap="sm" align="center">
						<Button size="compact" disabled={ values.join( ', ' ) === inputValue } onClick={ save }>
							{ __( 'Save', 'jetpack-boost' ) }
						</Button>
						<Button
							variant="minimal"
							tone="neutral"
							size="compact"
							disabled={ inputValue === defaultValue }
							onClick={ loadDefaultValue }
						>
							{ __( 'Load default handles', 'jetpack-boost' ) }
						</Button>
					</Stack>
				</Stack>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
};

export default MetaComponent;
