import { useState } from 'preact/hooks';
import { connect } from './connect';
import type { CheckpointProvider } from '../../shared/types';

import './style.scss';

/**
 * Returns before any hook runs when the checkpoint is off, so the inner
 * component's hooks stay unconditional.
 *
 * @return The buttons, or nothing when the checkpoint is off.
 */
export const ProviderButtons = () => {
	const { checkpoint } = JetpackComments;

	if ( ! checkpoint.enabled || checkpoint.providers.length === 0 ) {
		return null;
	}

	return <Buttons providers={ checkpoint.providers } disclosure={ checkpoint.disclosure } />;
};

type ButtonsProps = {
	providers: CheckpointProvider[];
	disclosure: string;
};

/**
 * Outcomes the reader chose, so nothing to apologise for.
 */
const SILENT = [ 'cancelled', 'access_denied' ];

/**
 * connect() sets the identity on success, so onClick only handles failure.
 *
 * @param props            - Component props.
 * @param props.providers  - The providers to offer.
 * @param props.disclosure - The line describing what is shared.
 * @return The buttons, the disclosure, and any error.
 */
const Buttons = ( { providers, disclosure }: ButtonsProps ) => {
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
		<div className="jetpack-comments__providers">
			<div className="jetpack-comments__provider-buttons">
				{ providers.map( provider => (
					<button
						key={ provider.id }
						type="button"
						className="jetpack-comments__provider"
						disabled={ !! busy }
						aria-busy={ busy === provider.id }
						onClick={ () => onClick( provider ) }
					>
						{ provider.label }
					</button>
				) ) }
			</div>
			{ failed && (
				<p className="jetpack-comments__provider-error" role="alert">
					{ strings.loginError }
				</p>
			) }
			<p className="jetpack-comments__disclosure">{ disclosure }</p>
		</div>
	);
};
