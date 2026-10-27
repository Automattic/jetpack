import { useEffect, useId, useLayoutEffect, useRef, useState } from '@wordpress/element';
import { __, getLocaleData } from '@wordpress/i18n';
import { arrowUp } from '@wordpress/icons';
import { IconButton } from '@wordpress/ui';
import { noAutofill } from '../no-autofill';

type Props = {
	value: string;
	busy: boolean;
	onChange: ( value: string ) => void;
	onSubmit: () => void;
};

type Recognition = {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	onresult: ( event: { results: ArrayLike< ArrayLike< { transcript: string } > > } ) => void;
	onend: () => void;
	onerror: () => void;
	start: () => void;
	stop: () => void;
};

const speechApi = (): ( new () => Recognition ) | undefined => {
	const w = window as unknown as Record< string, new () => Recognition >;
	return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

// The ui Icon reads the props of this element, so it must be a plain svg, not a component.
const micIcon = (
	<svg viewBox="0 0 24 24">
		<path
			fill="currentColor"
			d="M12 14.5a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5.5a3 3 0 0 0 3 3Zm5-3a.75.75 0 0 1 1.5 0 6.5 6.5 0 0 1-5.75 6.46v2.04a.75.75 0 0 1-1.5 0v-2.04A6.5 6.5 0 0 1 5.5 11.5a.75.75 0 0 1 1.5 0 5 5 0 0 0 10 0Z"
		/>
	</svg>
);

/** The "What should happen?" bar, pinned above the footer. */
export function PromptBox( { value, busy, onChange, onSubmit }: Props ) {
	const id = useId();
	const field = useRef< HTMLTextAreaElement >( null );
	const recognition = useRef< Recognition | null >( null );
	const [ listening, setListening ] = useState( false );
	const canDictate = !! speechApi();

	// Grow with the text; the CSS max-height takes over with a scrollbar.
	useLayoutEffect( () => {
		const el = field.current;
		if ( ! el ) {
			return;
		}
		el.style.blockSize = 'auto';
		el.style.blockSize = `${ el.scrollHeight + el.offsetHeight - el.clientHeight }px`;
	}, [ value ] );

	useEffect( () => () => recognition.current?.stop(), [] );

	const dictate = () => {
		if ( listening ) {
			recognition.current?.stop();
			return;
		}
		const Api = speechApi();
		if ( ! Api ) {
			return;
		}
		const spoken = new Api();
		const base = value.trim();
		spoken.continuous = true;
		spoken.interimResults = true;
		const header = getLocaleData()?.[ '' ] as { lang?: string } | undefined;
		spoken.lang = ( header?.lang ?? 'en_US' ).replace( '_', '-' );
		spoken.onresult = event => {
			const transcript = Array.from( event.results )
				.map( result => result[ 0 ].transcript )
				.join( '' )
				.trim();
			onChange( base ? `${ base } ${ transcript }` : transcript );
		};
		spoken.onend = () => setListening( false );
		spoken.onerror = () => setListening( false );
		recognition.current = spoken;
		spoken.start();
		setListening( true );
		field.current?.focus();
	};

	const hasText = value.trim() !== '';

	return (
		<div className="jetpack-flow-prompt">
			<div className={ `jetpack-flow-prompt__border${ busy ? ' is-busy' : '' }` }>
				<div className="jetpack-flow-prompt__box">
					<textarea
						{ ...noAutofill }
						id={ id }
						ref={ field }
						className="jetpack-flow-prompt__input"
						aria-label={ __( 'What should happen?', 'jetpack-flow-pkg' ) }
						rows={ 2 }
						value={ value }
						disabled={ busy }
						placeholder={ __( 'What should happen?', 'jetpack-flow-pkg' ) }
						onChange={ event => onChange( event.target.value ) }
						onKeyDown={ event => {
							if ( event.key === 'Enter' && ! event.shiftKey && hasText && ! busy ) {
								event.preventDefault();
								onSubmit();
							}
						} }
					/>
					<div className="jetpack-flow-prompt__actions">
						{ canDictate && (
							<IconButton
								variant="minimal"
								label={
									listening
										? __( 'Stop dictating', 'jetpack-flow-pkg' )
										: __( 'Dictate with your voice', 'jetpack-flow-pkg' )
								}
								icon={ micIcon }
								className={ listening ? 'is-listening' : undefined }
								disabled={ busy }
								onClick={ dictate }
							/>
						) }
						{ hasText && (
							<IconButton
								label={ __( 'Build my flow', 'jetpack-flow-pkg' ) }
								icon={ arrowUp }
								disabled={ busy }
								onClick={ onSubmit }
							/>
						) }
					</div>
				</div>
			</div>
		</div>
	);
}
