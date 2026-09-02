import { useState } from 'preact/hooks';
import { connect } from './connect';
import { FacebookIcon, GoogleIcon, MailIcon, WordPressIcon } from './icons';
import type { CheckpointProvider } from '../../shared/types';

import './style.scss';

const ICONS: Record< string, () => preact.JSX.Element > = {
	google: GoogleIcon,
	facebook: FacebookIcon,
	wordpress: WordPressIcon,
};

/**
 * Outcomes the reader chose, so nothing to apologise for.
 */
const SILENT = [ 'cancelled', 'access_denied' ];

/**
 * What signing in shares with the site. Rendered by the identity views at the
 * foot of their block, away from the buttons it describes.
 *
 * @return The disclosure line, or nothing when the checkpoint is off.
 */
export const Disclosure = () => {
	const { checkpoint } = JetpackComments;

	if ( ! checkpoint.enabled || checkpoint.providers.length === 0 ) {
		return null;
	}

	return <p className="jetpack-comments__disclosure">{ checkpoint.disclosure }</p>;
};

type ProviderButtonsProps = {
	/** Whether the guest fields the mail button reveals are open. */
	guestOpen?: boolean;
	/** Toggles the guest fields; the mail button only renders when given. */
	onGuestClick?: () => void;
};

/**
 * Returns before any hook runs when the checkpoint is off, so the inner
 * component's hooks stay unconditional.
 *
 * @param props - Component props, passed through to the row.
 * @return The buttons, or nothing when the checkpoint is off.
 */
export const ProviderButtons = ( props: ProviderButtonsProps ) => {
	const { checkpoint } = JetpackComments;

	if ( ! checkpoint.enabled || checkpoint.providers.length === 0 ) {
		return null;
	}

	return <Buttons providers={ checkpoint.providers } { ...props } />;
};

type ButtonsProps = ProviderButtonsProps & {
	providers: CheckpointProvider[];
};

/**
 * A row of round provider buttons, Verbum-style: the label rides in aria-label
 * and title, the glyph carries the meaning visually. The guest fields hide
 * behind a mail button at the end of the row, where the view offers them.
 * connect() sets the page-global identity on success, so onClick only handles
 * failure.
 *
 * @param props              - Component props.
 * @param props.providers    - The providers to offer.
 * @param props.guestOpen    - Whether the guest fields are open.
 * @param props.onGuestClick - Toggles the guest fields.
 * @return The buttons, and any error.
 */
const Buttons = ( { providers, guestOpen, onGuestClick }: ButtonsProps ) => {
	const { strings } = JetpackComments;
	const [ busy, setBusy ] = useState( '' );
	const [ failed, setFailed ] = useState( false );

	const onClick = async ( provider: CheckpointProvider ) => {
		setFailed( false );
		setBusy( provider.id );

		try {
			await connect( provider.id );
		} catch ( error ) {
			if ( ! SILENT.includes( ( error as Error ).message ) ) {
				setFailed( true );
			}
		} finally {
			setBusy( '' );
		}
	};

	return (
		<div className={ 'jetpack-comments__providers' + ( busy ? ' is-connecting' : '' ) }>
			<div className="jetpack-comments__provider-buttons">
				{ providers.map( provider => {
					const Icon = ICONS[ provider.id ];

					return (
						<button
							key={ provider.id }
							type="button"
							className={ `jetpack-comments__provider jetpack-comments__provider--${ provider.id }` }
							disabled={ !! busy }
							aria-busy={ busy === provider.id }
							aria-label={ provider.label }
							title={ provider.label }
							onClick={ () => onClick( provider ) }
						>
							{ Icon ? <Icon /> : provider.label }
						</button>
					);
				} ) }
				{ onGuestClick && (
					<button
						type="button"
						className="jetpack-comments__provider jetpack-comments__provider--mail"
						disabled={ !! busy }
						aria-expanded={ !! guestOpen }
						aria-label={ strings.email }
						title={ strings.email }
						onClick={ onGuestClick }
					>
						<MailIcon />
					</button>
				) }
			</div>
			{ failed && (
				<p className="jetpack-comments__provider-error" role="alert">
					{ strings.loginError }
				</p>
			) }
		</div>
	);
};
