import { dataInArt } from './data-in-art';
import styles from './styles.module.scss';

/**
 * The plugins feeding the screen, on the step that asks which of them to switch
 * on. The flow keeps looping rather than settling.
 *
 * `dangerouslySetInnerHTML` because the markup is a build-time constant from this
 * repository and nothing user-supplied reaches it. See `data-in-art.ts`.
 *
 * @return The rendered artwork.
 */
export function DataInArt() {
	return (
		<div
			className={ styles[ 'data-in' ] }
			aria-hidden="true"
			// eslint-disable-next-line react/no-danger
			dangerouslySetInnerHTML={ { __html: dataInArt } }
		/>
	);
}
