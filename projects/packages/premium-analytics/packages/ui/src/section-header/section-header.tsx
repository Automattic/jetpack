import { Stack, Text } from '@jetpack-premium-analytics/externals';
import clsx from 'clsx';
import { ReactNode } from 'react';
import styles from './section-header.module.scss';

type SectionHeaderProps = {
	title: string;

	/**
	 * Subtitle describing the active date configuration. Omit it while the
	 * consumer has nothing to describe.
	 */
	subtitle?: string;

	/**
	 * Settles the header into a chrome bar once it pins: the subtitle fades and
	 * gives its row back to the content below, and the title drops a step on
	 * the type scale. For surfaces that pin this header, where it would
	 * otherwise hold a page heading's worth of the viewport for the whole
	 * scroll. Off by default: where the header scrolls away with the content
	 * there is nothing to settle into.
	 *
	 * The surface has to say where it pins, since this component cannot know
	 * what sits above it. Turning this on without publishing a
	 * `--section-header-pin` view timeline leaves the header as it is. See the
	 * dashboard's pin marker in `routes/dashboard/stage.module.scss`.
	 */
	condenseOnScroll?: boolean;

	/**
	 * Date controls anchored to the end of the header row.
	 */
	children?: ReactNode;
};

/**
 * Section header for an analytics surface. The title and a slot for the date
 * controls share the first row, anchored to opposite edges: the controls keep
 * their natural width and a long title truncates with an ellipsis. The
 * subtitle takes a row of its own below them, so its length never costs the
 * controls width either.
 *
 * Once the header is too narrow to hold those two side by side everything
 * stacks, the subtitle returns to its place directly under the title, and the
 * title wraps rather than truncating. Measured by a container query rather
 * than against the viewport.
 *
 * @param {SectionHeaderProps} props - The props for the SectionHeader component.
 * @return The section header element.
 */
export function SectionHeader( {
	title,
	subtitle,
	condenseOnScroll = false,
	children,
}: SectionHeaderProps ) {
	return (
		<div className={ clsx( styles.container, condenseOnScroll && styles.condensing ) }>
			<div className={ styles.layout }>
				{ /* The `title` attribute is the only way back to a name the
				     ellipsis cut off. */ }
				<Text className={ styles.title } variant="heading-2xl" render={ <h2 title={ title } /> }>
					{ title }
				</Text>

				<Stack direction="row" align="center" className={ styles.controls }>
					{ children }
				</Stack>

				{ subtitle ? (
					<div className={ styles.subtitleRow }>
						<Text className={ styles.subtitle } variant="body-md">
							{ subtitle }
						</Text>
					</div>
				) : null }
			</div>
		</div>
	);
}
