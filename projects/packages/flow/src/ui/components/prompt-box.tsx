import { __ } from '@wordpress/i18n';
import { Button, Field, Stack, Text, Textarea } from '@wordpress/ui';
import { BrandStrip } from './brand-strip';

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
		<Stack direction="column" gap="md" className="jetpack-flow-prompt">
			<BrandStrip />
			<Field.Root>
				<Field.Label>
					<Text variant="heading-md">{ __( 'What should happen?', 'jetpack-flow-pkg' ) }</Text>
				</Field.Label>
				<Textarea
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
				<Field.Description>
					{ __(
						'Describe it in your own words, or drag cards from below. Press Cmd/Ctrl + Enter to build.',
						'jetpack-flow-pkg'
					) }
				</Field.Description>
			</Field.Root>
			<Stack justify="flex-end">
				<Button onClick={ onSubmit } disabled={ busy || ! value.trim() }>
					{ busy
						? __( 'Connecting the dots…', 'jetpack-flow-pkg' )
						: __( 'Build my flow', 'jetpack-flow-pkg' ) }
				</Button>
			</Stack>
		</Stack>
	);
}
