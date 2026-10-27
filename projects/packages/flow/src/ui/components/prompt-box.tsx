import { useId, useLayoutEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';
import { noAutofill } from '../no-autofill';

type Props = {
	value: string;
	busy: boolean;
	onChange: ( value: string ) => void;
	onSubmit: () => void;
};

/** The "What should happen?" bar, pinned above the footer. */
export function PromptBox( { value, busy, onChange, onSubmit }: Props ) {
	const id = useId();
	const field = useRef< HTMLTextAreaElement >( null );

	// Grow with the text; the CSS max-height takes over with a scrollbar.
	useLayoutEffect( () => {
		const el = field.current;
		if ( ! el ) {
			return;
		}
		el.style.blockSize = 'auto';
		el.style.blockSize = `${ el.scrollHeight + el.offsetHeight - el.clientHeight }px`;
	}, [ value ] );

	return (
		<Stack direction="column" align="center" gap="md" className="jetpack-flow-prompt">
			<div className="jetpack-flow-prompt__field">
				<label htmlFor={ id }>
					<Text variant="heading-md">{ __( 'What should happen?', 'jetpack-flow-pkg' ) }</Text>
				</label>
				<div className={ `jetpack-flow-prompt__border${ busy ? ' is-busy' : '' }` }>
					<textarea
						{ ...noAutofill }
						id={ id }
						ref={ field }
						className="jetpack-flow-prompt__input"
						rows={ 2 }
						value={ value }
						disabled={ busy }
						placeholder={ __(
							'When someone buys a product, email the shop manager and add them to my MailPoet list…',
							'jetpack-flow-pkg'
						) }
						onChange={ event => onChange( event.target.value ) }
						onKeyDown={ event => {
							if ( event.key === 'Enter' && ( event.metaKey || event.ctrlKey ) ) {
								event.preventDefault();
								onSubmit();
							}
						} }
					/>
				</div>
			</div>
			<Button onClick={ onSubmit } disabled={ busy || ! value.trim() }>
				{ busy
					? __( 'Connecting the dots…', 'jetpack-flow-pkg' )
					: __( 'Build my flow', 'jetpack-flow-pkg' ) }
			</Button>
		</Stack>
	);
}
