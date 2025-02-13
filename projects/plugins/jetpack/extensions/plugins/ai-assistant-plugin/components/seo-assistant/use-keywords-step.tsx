import {
	createInterpolateElement,
	useCallback,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useMessages } from './wizard-messages';
import type { Step } from './types';

export const useKeywordsStep = (): Step => {
	const [ value, setValue ] = useState< string >( '' );
	const [ rawInput, setRawInput ] = useState( '' );
	const { messages, addMessage } = useMessages();

	const onStart = useCallback( async () => {
		addMessage( {
			content: __(
				'To start, please enter 1–3 focus keywords that describe your blog post.',
				'jetpack'
			),
			showIcon: true,
		} );
	}, [ addMessage ] );

	useEffect( () => {
		setValue(
			rawInput
				.split( ',' )
				.map( k => k.trim() )
				// remove empty entries
				.filter( v => v )
				// remove duped entries, inefficient but we don't expect a lot of entries here
				.filter( ( v, i, arr ) => arr.indexOf( v ) === i )
				.reduce( ( acc, curr, i, arr ) => {
					if ( arr.length === 1 ) {
						return curr;
					}
					return i === 0 ? curr : `${ acc },${ curr }`;
				}, '' )
		);
	}, [ rawInput ] );

	const handleKeywordsSubmit = useCallback( async () => {
		if ( ! rawInput.trim() ) {
			return '';
		}
		addMessage( { content: rawInput, isUser: true } );

		const keywordsString = await new Promise< string >( resolve =>
			setTimeout( () => {
				const formattedKeywords = value.split( ',' ).reduce( ( acc, curr, i, arr ) => {
					if ( arr.length === 1 ) {
						return curr;
					}
					if ( i === arr.length - 1 ) {
						return `${ acc } </b>&<b> ${ curr }`;
					}
					return i === 0 ? curr : `${ acc }, ${ curr }`;
				}, '' );

				resolve( formattedKeywords );
			}, 500 )
		);

		const message = createInterpolateElement(
			/* Translators: wrapped string is list of keywords user has entered */
			sprintf( __( `Got it! You're targeting <b>%s</b>. ✨✅`, 'jetpack' ), keywordsString ),
			{
				b: <b />,
			}
		);
		addMessage( { content: message } );
		return value;
	}, [ addMessage, rawInput, value ] );

	return {
		id: 'keywords',
		title: __( 'Optimise for SEO', 'jetpack' ),
		label: __( 'Keywords', 'jetpack' ),
		messages,
		type: 'input',
		placeholder: __( 'Photography, plants', 'jetpack' ),
		onSubmit: handleKeywordsSubmit,
		rawInput,
		setRawInput,
		value,
		setValue,
		onStart,
		inputRef: useRef( null ),
	};
};
