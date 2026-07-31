import {
	Button,
	ColorPalette,
	ExternalLink,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Badge } from '@wordpress/ui';
import debounce from 'debounce';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { STORE_ID } from 'store';
import './style.scss';

const READER_CHAT_DESCRIPTION = __(
	'Let visitors ask your site questions and get answers from your content.',
	'jetpack-search-pkg'
);
const ACCENT_SAVE_DELAY_MS = 500;

/**
 * Reader Chat opt-in control. Reads and writes the reader_chat option
 * through the Search dashboard settings store.
 *
 * @param {object}   props               - Component properties.
 * @param {boolean}  props.isAvailable   - Whether Reader Chat can be shown for this site.
 * @param {boolean}  props.isEnabled     - Whether Reader Chat is enabled.
 * @param {boolean}  props.isSaving      - Whether settings are being saved.
 * @param {string}   props.guidelinesUrl - Guidelines admin URL, when available.
 * @param {Function} props.updateOptions - Function to update settings.
 * @return {import('react').Component} Reader Chat settings component.
 */
export default function ReaderChatControl( {
	isAvailable,
	isEnabled,
	isSaving,
	guidelinesUrl,
	updateOptions,
} ) {
	const storedBrand = useSelect( select => select( STORE_ID ).getReaderChatBrand() );
	const derivedBrand = useSelect( select => select( STORE_ID ).getReaderChatBrandDefaults() );
	const themePalette = useSelect( select => select( STORE_ID ).getReaderChatBrandPalette() );
	const brand = {
		name: typeof storedBrand?.name === 'string' ? storedBrand.name : '',
		accent: typeof storedBrand?.accent === 'string' ? storedBrand.accent : '',
		greeting: typeof storedBrand?.greeting === 'string' ? storedBrand.greeting : '',
	};
	const brandRef = useRef( brand );
	const pendingAccentRef = useRef( null );

	useEffect( () => {
		brandRef.current = {
			name: brand.name,
			accent: pendingAccentRef.current ?? brand.accent,
			greeting: brand.greeting,
		};
	}, [ brand.name, brand.accent, brand.greeting ] );

	const toggle = useCallback(
		next => {
			updateOptions( { reader_chat: next } );
		},
		[ updateOptions ]
	);

	const updateBrand = useCallback(
		( field, value ) => {
			const nextBrand = {
				...brandRef.current,
				[ field ]: value ?? '',
			};
			brandRef.current = nextBrand;
			updateOptions( {
				reader_chat_brand: nextBrand,
			} );
		},
		[ updateOptions ]
	);
	// The debounced save outlives renders, so read the latest update callback
	// through a ref instead of stranding a changed updateOptions prop.
	const updateBrandRef = useRef( updateBrand );
	useEffect( () => {
		updateBrandRef.current = updateBrand;
	}, [ updateBrand ] );

	// Text fields keep a local draft and only save on blur. `updateOptions`
	// issues a REST save, a re-fetch, and a success notice per call, so saving
	// per keystroke would fire all three on every character. Every other
	// control in this dashboard is a toggle, where that never mattered.
	const [ draft, setDraft ] = useState( { name: brand.name, greeting: brand.greeting } );
	const committedRef = useRef( { name: brand.name, greeting: brand.greeting } );
	const resolvedAccent = brand.accent || derivedBrand?.accent || '';
	const [ accentDraft, setAccentDraft ] = useState( resolvedAccent );
	const [ hasAccentOverride, setHasAccentOverride ] = useState( Boolean( brand.accent ) );
	// ColorPalette fires continuously while its custom picker is dragged. Keep
	// that interaction local, then issue one REST save after the color settles.
	const saveAccent = useMemo(
		() =>
			debounce( value => {
				pendingAccentRef.current = null;
				updateBrandRef.current( 'accent', value );
			}, ACCENT_SAVE_DELAY_MS ),
		[]
	);

	// Re-seed the draft when saved values change from outside this component —
	// the initial settings fetch, or a save returning server-normalized values.
	useEffect( () => {
		if (
			committedRef.current.name !== brand.name ||
			committedRef.current.greeting !== brand.greeting
		) {
			committedRef.current = { name: brand.name, greeting: brand.greeting };
			setDraft( { name: brand.name, greeting: brand.greeting } );
		}
	}, [ brand.name, brand.greeting ] );

	// Re-seed the displayed accent after an external or normalized store update.
	useEffect( () => {
		if ( null === pendingAccentRef.current ) {
			setAccentDraft( resolvedAccent );
			setHasAccentOverride( Boolean( brand.accent ) );
		}
	}, [ brand.accent, resolvedAccent ] );

	useEffect( () => () => saveAccent.flush(), [ saveAccent ] );

	const commitBrandText = field => {
		const value = draft[ field ];
		if ( value === committedRef.current[ field ] ) {
			return;
		}
		committedRef.current = { ...committedRef.current, [ field ]: value };
		updateBrand( field, value );
	};

	const updateAccent = value => {
		const nextAccent = value ?? '';
		pendingAccentRef.current = nextAccent;
		brandRef.current = { ...brandRef.current, accent: nextAccent };
		setAccentDraft( nextAccent || derivedBrand?.accent || '' );
		setHasAccentOverride( true );
		saveAccent( nextAccent );
	};

	const resetAccent = () => {
		saveAccent.clear();
		pendingAccentRef.current = null;
		setAccentDraft( derivedBrand?.accent || '' );
		setHasAccentOverride( false );
		updateBrand( 'accent', '' );
	};

	// Hide the control when this site should not expose Reader Chat settings.
	if ( ! isAvailable ) {
		return null;
	}

	return (
		<div className="jp-form-search-settings-group__toggle is-reader-chat jp-search-dashboard-wrap">
			<div className="jp-search-dashboard-row">
				<ToggleControl
					checked={ Boolean( isEnabled ) }
					disabled={ isSaving }
					onChange={ toggle }
					className="jp-search-dashboard-toggle lg-col-span-12 md-col-span-8 sm-col-span-4"
					label={
						<>
							{ __( 'Enable Site Chat', 'jetpack-search-pkg' ) }
							<Badge intent="informational" className="jp-reader-chat-control__preview-badge">
								{ __( 'Preview', 'jetpack-search-pkg' ) }
							</Badge>
						</>
					}
					__nextHasNoMarginBottom
				/>
			</div>
			<div className="jp-search-dashboard-row">
				<div className="jp-form-search-settings-group__toggle-description lg-col-span-12 md-col-span-8 sm-col-span-4">
					<p className="jp-form-search-settings-group__toggle-explanation">
						{ READER_CHAT_DESCRIPTION }
					</p>
					{ isEnabled && (
						<div className="jp-reader-chat-control__brand">
							<TextControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								label={ __( 'Assistant name', 'jetpack-search-pkg' ) }
								maxLength={ 40 }
								onBlur={ () => commitBrandText( 'name' ) }
								onChange={ value => setDraft( prev => ( { ...prev, name: value } ) ) }
								placeholder={ derivedBrand?.name ?? '' }
								value={ draft.name }
							/>
							<TextControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								label={ __( 'Greeting', 'jetpack-search-pkg' ) }
								maxLength={ 120 }
								onBlur={ () => commitBrandText( 'greeting' ) }
								onChange={ value => setDraft( prev => ( { ...prev, greeting: value } ) ) }
								placeholder={ derivedBrand?.greeting ?? '' }
								value={ draft.greeting }
							/>
							<fieldset disabled={ isSaving }>
								<legend>{ __( 'Accent color', 'jetpack-search-pkg' ) }</legend>
								<ColorPalette
									aria-label={ __( 'Accent color', 'jetpack-search-pkg' ) }
									clearable={ false }
									colors={ themePalette }
									onChange={ updateAccent }
									value={ accentDraft }
								/>
								<Button
									disabled={ isSaving || ! hasAccentOverride }
									onClick={ resetAccent }
									variant="link"
								>
									{ __( 'Reset to theme', 'jetpack-search-pkg' ) }
								</Button>
							</fieldset>
						</div>
					) }
					{ isEnabled && guidelinesUrl && (
						<p className="jp-form-search-settings-group__toggle-explanation">
							<ExternalLink href={ guidelinesUrl }>
								{ __( 'Set guidelines', 'jetpack-search-pkg' ) }
							</ExternalLink>
						</p>
					) }
				</div>
			</div>
		</div>
	);
}
