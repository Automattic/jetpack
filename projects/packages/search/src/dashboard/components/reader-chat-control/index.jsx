import {
	Button,
	ColorIndicator,
	ColorPalette,
	Dropdown,
	ExternalLink,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
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
const DEFAULT_HELP = __( 'Or type your own question below.', 'jetpack-search-pkg' );
// Keep these defaults aligned with @automattic/agenttic-ui's light theme.
const DEFAULT_APPEARANCE = {
	accent: '#2d5af2',
	background: '#fcfcfc',
	outline: '#e9e9e9',
	fontFamily: 'system',
};
const APPEARANCE_COLOR_FIELDS = [ 'accent', 'background', 'outline' ];
const hasOwn = ( object, key ) => Object.prototype.hasOwnProperty.call( object, key );
const normalizeHexColor = value =>
	typeof value === 'string' && /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test( value )
		? value.toLowerCase()
		: '';
// Keep this WCAG contrast calculation aligned with Site Chat's runtime
// getAccessibleColor() helper in wp-calypso/apps/agents-manager/reader-chat.js.
const getAccessibleTextColor = background => {
	const expanded =
		background.length === 4
			? `#${ background[ 1 ] }${ background[ 1 ] }${ background[ 2 ] }${ background[ 2 ] }${ background[ 3 ] }${ background[ 3 ] }`
			: background;
	const channels = [ 1, 3, 5 ].map(
		offset => parseInt( expanded.slice( offset, offset + 2 ), 16 ) / 255
	);
	const luminance = channels
		.map( channel =>
			channel <= 0.04045 ? channel / 12.92 : ( ( channel + 0.055 ) / 1.055 ) ** 2.4
		)
		.reduce(
			( total, channel, index ) => total + channel * [ 0.2126, 0.7152, 0.0722 ][ index ],
			0
		);

	return ( luminance + 0.05 ) / 0.05 >= 4.5 ? '#000000' : '#ffffff';
};

/**
 * Compact color-picker control for one Site Chat appearance value.
 *
 * @param {object}   props              - Component properties.
 * @param {Array}    props.colors       - Available theme colors.
 * @param {string}   props.defaultValue - Resolved default color.
 * @param {boolean}  props.hasOverride  - Whether the color has a saved override.
 * @param {boolean}  props.isSaving     - Whether settings are currently being saved.
 * @param {string}   props.label        - Color field label.
 * @param {Function} props.onChange     - Called while the selected color changes.
 * @param {Function} props.onReset      - Called when the override is reset.
 * @param {string}   props.value        - Current color value.
 * @return {import('react').Component} Color-picker control.
 */
function AppearanceColorControl( {
	colors,
	defaultValue,
	hasOverride,
	isSaving,
	label,
	onChange,
	onReset,
	value,
} ) {
	const displayValue = value || defaultValue;

	return (
		<Dropdown
			className="jp-reader-chat-control__color"
			popoverProps={ { placement: 'bottom-start' } }
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					aria-expanded={ isOpen }
					aria-label={ sprintf(
						/* translators: %1$s: localized color name (Accent, Background, or Outline). %2$s: hex color value. */
						__( '%1$s color: %2$s', 'jetpack-search-pkg' ),
						label,
						displayValue.toUpperCase()
					) }
					className="jp-reader-chat-control__color-toggle"
					disabled={ isSaving }
					onClick={ onToggle }
				>
					<ColorIndicator colorValue={ displayValue } />
					<span className="jp-reader-chat-control__color-copy">
						<span>{ label }</span>
						<code>{ displayValue.toUpperCase() }</code>
					</span>
				</Button>
			) }
			renderContent={ () => (
				<div className="jp-reader-chat-control__color-popover">
					{ /* The custom picker is portalled outside the disabled fieldset. */ }
					<ColorPalette
						aria-label={ label }
						clearable={ false }
						colors={ colors }
						onChange={ nextColor => ! isSaving && onChange( nextColor ) }
						value={ displayValue }
					/>
					<Button
						aria-label={ sprintf(
							/* translators: %s: localized color name (Accent, Background, or Outline). */
							__( 'Reset %s to default', 'jetpack-search-pkg' ),
							label
						) }
						disabled={ isSaving || ! hasOverride }
						onClick={ onReset }
						variant="link"
					>
						{ __( 'Reset to default', 'jetpack-search-pkg' ) }
					</Button>
				</div>
			) }
		/>
	);
}

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
	const brand = useMemo(
		() => ( {
			name: typeof storedBrand?.name === 'string' ? storedBrand.name : '',
			accent: typeof storedBrand?.accent === 'string' ? storedBrand.accent : '',
			greeting: typeof storedBrand?.greeting === 'string' ? storedBrand.greeting : '',
			help: typeof storedBrand?.help === 'string' ? storedBrand.help : '',
			background: typeof storedBrand?.background === 'string' ? storedBrand.background : '',
			outline: typeof storedBrand?.outline === 'string' ? storedBrand.outline : '',
			fontFamily: typeof storedBrand?.fontFamily === 'string' ? storedBrand.fontFamily : '',
		} ),
		[
			storedBrand?.name,
			storedBrand?.accent,
			storedBrand?.greeting,
			storedBrand?.help,
			storedBrand?.background,
			storedBrand?.outline,
			storedBrand?.fontFamily,
		]
	);
	const brandRef = useRef( brand );
	const pendingAppearanceRef = useRef( {} );

	useEffect( () => {
		brandRef.current = {
			...brand,
			...pendingAppearanceRef.current,
		};
	}, [ brand ] );

	const toggle = useCallback(
		next => {
			updateOptions( { reader_chat: next } );
		},
		[ updateOptions ]
	);

	const persistBrand = useCallback(
		nextBrand => {
			brandRef.current = nextBrand;
			updateOptions( {
				reader_chat_brand: nextBrand,
			} );
		},
		[ updateOptions ]
	);
	// The debounced save outlives renders, so read the latest persistence callback
	// through a ref instead of stranding a changed updateOptions prop.
	const persistBrandRef = useRef( persistBrand );
	useEffect( () => {
		persistBrandRef.current = persistBrand;
	}, [ persistBrand ] );

	// Text fields keep a local draft and only save on blur. `updateOptions`
	// issues a REST save, a re-fetch, and a success notice per call, so saving
	// per keystroke would fire all three on every character. Every other
	// control in this dashboard is a toggle, where that never mattered.
	const [ draft, setDraft ] = useState( {
		name: brand.name,
		greeting: brand.greeting,
		help: brand.help,
	} );
	const committedRef = useRef( {
		name: brand.name,
		greeting: brand.greeting,
		help: brand.help,
	} );
	const resolvedAppearance = useMemo(
		() => ( {
			accent: brand.accent || derivedBrand?.accent || DEFAULT_APPEARANCE.accent,
			background: brand.background || DEFAULT_APPEARANCE.background,
			outline: brand.outline || DEFAULT_APPEARANCE.outline,
			fontFamily: brand.fontFamily || DEFAULT_APPEARANCE.fontFamily,
		} ),
		[ brand, derivedBrand?.accent ]
	);
	const [ appearanceDraft, setAppearanceDraft ] = useState( resolvedAppearance );
	const [ appearanceOverrides, setAppearanceOverrides ] = useState( {
		accent: Boolean( brand.accent ),
		background: Boolean( brand.background ),
		outline: Boolean( brand.outline ),
	} );
	// ColorPalette fires continuously while dragged. Keep that interaction local,
	// then issue one REST save after the controls settle.
	const saveAppearance = useMemo(
		() =>
			debounce( () => {
				pendingAppearanceRef.current = {};
				persistBrandRef.current( brandRef.current );
			}, ACCENT_SAVE_DELAY_MS ),
		[]
	);

	// Re-seed the draft when saved values change from outside this component —
	// the initial settings fetch, or a save returning server-normalized values.
	useEffect( () => {
		if (
			committedRef.current.name !== brand.name ||
			committedRef.current.greeting !== brand.greeting ||
			committedRef.current.help !== brand.help
		) {
			committedRef.current = {
				name: brand.name,
				greeting: brand.greeting,
				help: brand.help,
			};
			setDraft( { name: brand.name, greeting: brand.greeting, help: brand.help } );
		}
	}, [ brand.name, brand.greeting, brand.help ] );

	// Re-seed appearance fields after an external or normalized store update,
	// without replacing fields that still have a local pending change.
	useEffect( () => {
		const pending = pendingAppearanceRef.current;
		setAppearanceDraft( current => ( {
			accent: hasOwn( pending, 'accent' ) ? current.accent : resolvedAppearance.accent,
			background: hasOwn( pending, 'background' )
				? current.background
				: resolvedAppearance.background,
			outline: hasOwn( pending, 'outline' ) ? current.outline : resolvedAppearance.outline,
			fontFamily: hasOwn( pending, 'fontFamily' )
				? current.fontFamily
				: resolvedAppearance.fontFamily,
		} ) );
		setAppearanceOverrides( current => ( {
			accent: hasOwn( pending, 'accent' ) ? current.accent : Boolean( brand.accent ),
			background: hasOwn( pending, 'background' )
				? current.background
				: Boolean( brand.background ),
			outline: hasOwn( pending, 'outline' ) ? current.outline : Boolean( brand.outline ),
		} ) );
	}, [ brand.accent, brand.background, brand.outline, resolvedAppearance ] );

	useEffect( () => () => saveAppearance.flush(), [ saveAppearance ] );

	const commitBrandText = field => {
		const value = draft[ field ];
		if ( value === committedRef.current[ field ] ) {
			return;
		}
		committedRef.current = { ...committedRef.current, [ field ]: value };
		saveAppearance.clear();
		pendingAppearanceRef.current = {};
		persistBrand( { ...brandRef.current, [ field ]: value } );
	};

	const queueAppearance = ( field, value, displayValue = value, hasOverride = true ) => {
		pendingAppearanceRef.current = { ...pendingAppearanceRef.current, [ field ]: value };
		brandRef.current = { ...brandRef.current, [ field ]: value };
		setAppearanceDraft( current => ( { ...current, [ field ]: displayValue } ) );
		if ( APPEARANCE_COLOR_FIELDS.includes( field ) ) {
			setAppearanceOverrides( current => ( { ...current, [ field ]: hasOverride } ) );
		}
		saveAppearance();
	};

	const commitAppearance = ( field, value, displayValue = value, hasOverride = true ) => {
		saveAppearance.clear();
		pendingAppearanceRef.current = {};
		setAppearanceDraft( current => ( { ...current, [ field ]: displayValue } ) );
		if ( APPEARANCE_COLOR_FIELDS.includes( field ) ) {
			setAppearanceOverrides( current => ( { ...current, [ field ]: hasOverride } ) );
		}
		persistBrand( { ...brandRef.current, [ field ]: value } );
	};

	const hasAppearanceOverrides =
		Object.values( appearanceOverrides ).some( Boolean ) ||
		appearanceDraft.fontFamily !== DEFAULT_APPEARANCE.fontFamily;
	const resetAppearance = () => {
		saveAppearance.clear();
		pendingAppearanceRef.current = {};
		setAppearanceDraft( {
			accent: derivedBrand?.accent || DEFAULT_APPEARANCE.accent,
			background: DEFAULT_APPEARANCE.background,
			outline: DEFAULT_APPEARANCE.outline,
			fontFamily: DEFAULT_APPEARANCE.fontFamily,
		} );
		setAppearanceOverrides( {
			accent: false,
			background: false,
			outline: false,
		} );
		persistBrand( {
			...brandRef.current,
			accent: '',
			background: '',
			outline: '',
			fontFamily: '',
		} );
	};
	const previewAccent =
		normalizeHexColor( appearanceDraft.accent ) ||
		normalizeHexColor( derivedBrand?.accent ) ||
		DEFAULT_APPEARANCE.accent;
	const previewBackground =
		normalizeHexColor( appearanceDraft.background ) || DEFAULT_APPEARANCE.background;
	const previewOutline = normalizeHexColor( appearanceDraft.outline ) || DEFAULT_APPEARANCE.outline;
	const previewName = draft.name.trim() || derivedBrand?.name || '';
	// Keep the no-integration fallback aligned with Site Chat's empty view in
	// wp-calypso/packages/agents-manager/src/components/agent-chat/index.tsx.
	const previewGreeting =
		draft.greeting.trim() ||
		derivedBrand?.greeting ||
		__( 'Ask me anything about this blog.', 'jetpack-search-pkg' );
	const previewHelp = draft.help.trim() || DEFAULT_HELP;
	const previewStyle = {
		'--jp-reader-chat-preview-accent': previewAccent,
		'--jp-reader-chat-preview-accent-foreground': getAccessibleTextColor( previewAccent ),
		'--jp-reader-chat-preview-background': previewBackground,
		'--jp-reader-chat-preview-foreground': getAccessibleTextColor( previewBackground ),
		'--jp-reader-chat-preview-outline': previewOutline,
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
							<div className="jp-reader-chat-control__brand-fields">
								<section aria-labelledby="jp-reader-chat-identity-heading">
									<h3 id="jp-reader-chat-identity-heading">
										{ __( 'Identity', 'jetpack-search-pkg' ) }
									</h3>
									<TextControl
										__nextHasNoMarginBottom
										__next40pxDefaultSize
										help={ __(
											'Shown beside your Site Icon when visitors open Site Chat.',
											'jetpack-search-pkg'
										) }
										label={ __( 'Assistant name', 'jetpack-search-pkg' ) }
										maxLength={ 40 }
										onBlur={ () => commitBrandText( 'name' ) }
										onChange={ value => setDraft( prev => ( { ...prev, name: value } ) ) }
										placeholder={ derivedBrand?.name ?? '' }
										value={ draft.name }
									/>
								</section>
								<section aria-labelledby="jp-reader-chat-welcome-heading">
									<h3 id="jp-reader-chat-welcome-heading">
										{ __( 'Welcome message', 'jetpack-search-pkg' ) }
									</h3>
									<p>
										{ __(
											'Shown with starter prompts before a visitor begins chatting.',
											'jetpack-search-pkg'
										) }
									</p>
									<TextControl
										__nextHasNoMarginBottom
										__next40pxDefaultSize
										help={ __(
											'The first line visitors see in an empty chat.',
											'jetpack-search-pkg'
										) }
										label={ __( 'Greeting', 'jetpack-search-pkg' ) }
										maxLength={ 120 }
										onBlur={ () => commitBrandText( 'greeting' ) }
										onChange={ value => setDraft( prev => ( { ...prev, greeting: value } ) ) }
										placeholder={ derivedBrand?.greeting ?? '' }
										value={ draft.greeting }
									/>
									<TextControl
										__nextHasNoMarginBottom
										__next40pxDefaultSize
										help={ __(
											'Guides visitors toward the composer or starter prompts.',
											'jetpack-search-pkg'
										) }
										label={ __( 'Help text', 'jetpack-search-pkg' ) }
										maxLength={ 160 }
										onBlur={ () => commitBrandText( 'help' ) }
										onChange={ value => setDraft( prev => ( { ...prev, help: value } ) ) }
										placeholder={ DEFAULT_HELP }
										value={ draft.help }
									/>
								</section>
								<section aria-labelledby="jp-reader-chat-appearance-heading">
									<h3 id="jp-reader-chat-appearance-heading">
										{ __( 'Appearance', 'jetpack-search-pkg' ) }
									</h3>
									<p>{ __( "Match Site Chat to your site's look.", 'jetpack-search-pkg' ) }</p>
									<fieldset disabled={ isSaving }>
										<legend>{ __( 'Colors', 'jetpack-search-pkg' ) }</legend>
										<div className="jp-reader-chat-control__colors">
											<AppearanceColorControl
												colors={ themePalette }
												defaultValue={ derivedBrand?.accent || DEFAULT_APPEARANCE.accent }
												hasOverride={ appearanceOverrides.accent }
												isSaving={ isSaving }
												label={ __( 'Accent', 'jetpack-search-pkg' ) }
												onChange={ value => queueAppearance( 'accent', value ?? '' ) }
												onReset={ () =>
													commitAppearance(
														'accent',
														'',
														derivedBrand?.accent || DEFAULT_APPEARANCE.accent,
														false
													)
												}
												value={ appearanceDraft.accent }
											/>
											<AppearanceColorControl
												colors={ themePalette }
												defaultValue={ DEFAULT_APPEARANCE.background }
												hasOverride={ appearanceOverrides.background }
												isSaving={ isSaving }
												label={ __( 'Background', 'jetpack-search-pkg' ) }
												onChange={ value => queueAppearance( 'background', value ?? '' ) }
												onReset={ () =>
													commitAppearance( 'background', '', DEFAULT_APPEARANCE.background, false )
												}
												value={ appearanceDraft.background }
											/>
											<AppearanceColorControl
												colors={ themePalette }
												defaultValue={ DEFAULT_APPEARANCE.outline }
												hasOverride={ appearanceOverrides.outline }
												isSaving={ isSaving }
												label={ __( 'Outline', 'jetpack-search-pkg' ) }
												onChange={ value => queueAppearance( 'outline', value ?? '' ) }
												onReset={ () =>
													commitAppearance( 'outline', '', DEFAULT_APPEARANCE.outline, false )
												}
												value={ appearanceDraft.outline }
											/>
										</div>
										<p className="jp-reader-chat-control__contrast-help">
											{ __(
												'Text color is selected automatically for readable contrast.',
												'jetpack-search-pkg'
											) }
										</p>
									</fieldset>
									<SelectControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										disabled={ isSaving }
										help={ __(
											'Uses fonts already available in the visitor’s browser or theme. Site font is applied on your site; this preview uses the dashboard font.',
											'jetpack-search-pkg'
										) }
										label={ __( 'Font', 'jetpack-search-pkg' ) }
										onChange={ value =>
											commitAppearance(
												'fontFamily',
												value === DEFAULT_APPEARANCE.fontFamily ? '' : value,
												value
											)
										}
										options={ [
											{ label: __( 'System default', 'jetpack-search-pkg' ), value: 'system' },
											{ label: __( 'Site font', 'jetpack-search-pkg' ), value: 'site' },
											{ label: __( 'Serif', 'jetpack-search-pkg' ), value: 'serif' },
										] }
										value={ appearanceDraft.fontFamily }
									/>
									<Button
										accessibleWhenDisabled
										className="jp-reader-chat-control__reset-appearance"
										disabled={ isSaving || ! hasAppearanceOverrides }
										onClick={ resetAppearance }
										variant="secondary"
									>
										{ __( 'Reset appearance to defaults', 'jetpack-search-pkg' ) }
									</Button>
								</section>
							</div>
							<aside
								aria-labelledby="jp-reader-chat-preview-heading"
								className="jp-reader-chat-control__preview"
							>
								<h3 id="jp-reader-chat-preview-heading">
									{ __( 'Preview', 'jetpack-search-pkg' ) }
								</h3>
								{ /* Collapse this decorative mock into one accessible preview label. */ }
								<div
									aria-label={ sprintf(
										/* translators: %s: resolved Site Chat assistant or site name. */
										__( 'Site Chat preview for %s', 'jetpack-search-pkg' ),
										previewName || __( 'this site', 'jetpack-search-pkg' )
									) }
									className="jp-reader-chat-control__preview-widget"
									data-font={ appearanceDraft.fontFamily }
									role="img"
									style={ previewStyle }
								>
									<div className="jp-reader-chat-control__preview-header">
										<span aria-hidden="true" className="jp-reader-chat-control__preview-actions">
											<span>⋮</span>
											<span>×</span>
										</span>
									</div>
									<div className="jp-reader-chat-control__preview-body">
										<div className="jp-reader-chat-control__preview-identity">
											<span className="jp-reader-chat-control__preview-logo">
												{ derivedBrand?.logoUrl ? (
													<img alt="" src={ derivedBrand.logoUrl } />
												) : (
													<span aria-hidden="true">✦</span>
												) }
											</span>
											{ previewName && <strong>{ previewName }</strong> }
										</div>
										<p className="jp-reader-chat-control__preview-greeting">{ previewGreeting }</p>
										{ /* Keep these examples aligned with getFallbackSuggestions() in wp-calypso/apps/agents-manager/reader-chat.js. */ }
										<div className="jp-reader-chat-control__preview-prompts">
											<span>{ __( 'Explore recent posts', 'jetpack-search-pkg' ) }</span>
											<span>{ __( 'Learn about this site', 'jetpack-search-pkg' ) }</span>
											<span>{ __( 'Recommend a post', 'jetpack-search-pkg' ) }</span>
										</div>
										<p className="jp-reader-chat-control__preview-help">{ previewHelp }</p>
										<div className="jp-reader-chat-control__preview-composer">
											<span>{ __( 'Ask anything…', 'jetpack-search-pkg' ) }</span>
											<span aria-hidden="true" className="jp-reader-chat-control__preview-send">
												↑
											</span>
										</div>
									</div>
									<p className="jp-reader-chat-control__preview-footer">
										{ __( 'You’re chatting with AI.', 'jetpack-search-pkg' ) }
									</p>
								</div>
							</aside>
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
