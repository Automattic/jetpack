import { __ } from '@wordpress/i18n';
import { Button, Field, Stack, Text, Textarea } from '@wordpress/ui';
import { noAutofill } from '../no-autofill';

type Props = {
	value: string;
	busy: boolean;
	onChange: ( value: string ) => void;
	onSubmit: () => void;
};

/**
 *
 * @param root0
 * @param root0.value
 * @param root0.busy
 * @param root0.onChange
 * @param root0.onSubmit
 */
export function PromptBox( { value, busy, onChange, onSubmit }: Props ) {
	return (
		<Stack direction="column" align="center" gap="md" className="jetpack-flow-prompt">
			<Field.Root className="jetpack-flow-prompt__field">
				<Field.Label>
					<Text variant="heading-md">{ __( 'What should happen?', 'jetpack-flow-pkg' ) }</Text>
				</Field.Label>
				<div className={ `jetpack-flow-prompt__border${ busy ? ' is-busy' : '' }` }>
					<Textarea
						{ ...noAutofill }
						rows={ 3 }
						value={ value }
						disabled={ busy }
						placeholder={ __(
							'When someone buys a product, email the shop manager and add them to my MailPoet list…',
							'jetpack-flow-pkg'
						) }
						onValueChange={ onChange }
						onKeyDown={ ( event: React.KeyboardEvent ) => {
							if ( event.key === 'Enter' && ( event.metaKey || event.ctrlKey ) ) {
								event.preventDefault();
								onSubmit();
							}
						} }
					/>
				</div>
			</Field.Root>
			<Stack justify="center">
				<Button onClick={ onSubmit } disabled={ busy || ! value.trim() }>
					{ busy
						? __( 'Connecting the dots…', 'jetpack-flow-pkg' )
						: __( 'Build my flow', 'jetpack-flow-pkg' ) }
				</Button>
			</Stack>
		</Stack>
	);
}
