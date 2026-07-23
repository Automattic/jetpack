import AdminPage from '@automattic/jetpack-components/admin-page';
import { getSiteData } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import './route.scss';

/**
 * Newsletter Mode "Dashboard" page.
 *
 * NOTE: everything below the AdminPage title is a static, HTML-only preview of
 * the day-one dashboard design — inline styles, placeholder copy, no data
 * wiring. It is throwaway scaffolding to look at the layout, not the real page.
 *
 * @return Stage content.
 */

// --- design tokens (local to this static preview) ---------------------------
const ink = '#1e1e1e';
const ink2 = '#50575e';
const muted = '#757575';
const line = '#e0e0e0';
const line2 = '#f0f0f0';
const paper = '#fbfbfc';
const blue = 'var(--wp-admin-theme-color, #3858e9)';

// Inline icon helper. Static preview only.
const Icon = ( { d, size = 20 }: { d: string; size?: number } ): JSX.Element => (
	<svg
		width={ size }
		height={ size }
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.6"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
		focusable="false"
	>
		{ d.split( '|' ).map( ( path, i ) => (
			<path key={ i } d={ path } />
		) ) }
	</svg>
);

// Chevron (row affordance).
const Chevron = (): JSX.Element => (
	<svg
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		stroke={ muted }
		strokeWidth="1.6"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
		focusable="false"
		style={ { flex: '0 0 auto' } }
	>
		<path d="m9 6 6 6-6 6" />
	</svg>
);

const actionTiles = [
	{
		icon: 'M12 3v12|M7 10l5 5 5-5|M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2',
		title: __( 'Bring your contacts', 'jetpack-newsletter' ),
		desc: __( 'Import an existing list', 'jetpack-newsletter' ),
	},
	{
		icon: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7|M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
		title: __( 'Share your link', 'jetpack-newsletter' ),
		desc: __( 'Paste it anywhere you like', 'jetpack-newsletter' ),
	},
	{
		icon: 'M2 4h20v16H2z|m2 6 10 7L22 6',
		title: __( 'Invite by email', 'jetpack-newsletter' ),
		desc: __( 'Ask a few people directly', 'jetpack-newsletter' ),
	},
];

const checklist = [
	{
		title: __( 'Your newsletter is live', 'jetpack-newsletter' ),
		desc: __( 'octagonal.wordpress.com is ready for the world.', 'jetpack-newsletter' ),
		done: true,
	},
	{
		title: __( 'Make it yours', 'jetpack-newsletter' ),
		desc: __( 'Customize the name, description, and more.', 'jetpack-newsletter' ),
		done: false,
	},
	{
		title: __( 'Write your first post', 'jetpack-newsletter' ),
		desc: __( 'Three sentences is enough. Start small.', 'jetpack-newsletter' ),
		done: false,
	},
	{
		title: __( 'Bring your first readers', 'jetpack-newsletter' ),
		desc: __( "Invite the people you'd usually text first.", 'jetpack-newsletter' ),
		done: false,
	},
	{
		title: __( 'Share your newsletter', 'jetpack-newsletter' ),
		desc: __( "Invite the people you'd text first.", 'jetpack-newsletter' ),
		done: false,
	},
];

const Preview = (): JSX.Element => (
	<div
		style={ {
			maxWidth: '780px',
			margin: '0 auto 40px',
			paddingTop: '48px',
			fontFamily:
				'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
			color: ink,
		} }
	>
		<h1
			style={ {
				fontSize: '30px',
				fontWeight: 600,
				letterSpacing: '-0.02em',
				margin: '0 0 28px',
			} }
		>
			{ __( 'Welcome, Zara', 'jetpack-newsletter' ) }
		</h1>

		{ /* Reach your first 3 readers */ }
		<div
			style={ {
				background: '#fff',
				border: `1px solid ${ line }`,
				borderRadius: '10px',
				padding: '24px',
				marginBottom: '24px',
			} }
		>
			<h2
				style={ {
					fontSize: '15px',
					fontWeight: 600,
					margin: '0 0 8px',
				} }
			>
				{ __( 'Reach your first 3 readers', 'jetpack-newsletter' ) }
			</h2>
			<p
				style={ {
					fontSize: '13.5px',
					lineHeight: 1.6,
					color: muted,
					margin: '0 0 20px',
					maxWidth: '52ch',
				} }
			>
				{ __(
					'Writers who reach three readers in their first week almost always keep going. Try starting with people who already know you.',
					'jetpack-newsletter'
				) }
			</p>
			<div
				style={ {
					display: 'grid',
					gridTemplateColumns: 'repeat(3, 1fr)',
					gap: '12px',
				} }
			>
				{ actionTiles.map( tile => (
					<div
						key={ tile.title }
						style={ {
							border: `1px solid ${ line }`,
							borderRadius: '8px',
							padding: '18px 16px',
							cursor: 'pointer',
						} }
					>
						<span style={ { color: ink2, display: 'inline-flex' } }>
							<Icon d={ tile.icon } />
						</span>
						<div style={ { fontSize: '14px', fontWeight: 600, marginTop: '12px' } }>
							{ tile.title }
						</div>
						<div style={ { fontSize: '12.5px', color: muted, marginTop: '2px' } }>
							{ tile.desc }
						</div>
					</div>
				) ) }
			</div>
		</div>

		{ /* Getting-started checklist */ }
		<div
			style={ {
				background: '#fff',
				border: `1px solid ${ line }`,
				borderRadius: '10px',
				overflow: 'hidden',
			} }
		>
			{ checklist.map( ( item, i ) => (
				<div
					key={ item.title }
					style={ {
						display: 'flex',
						alignItems: 'center',
						gap: '14px',
						padding: '16px 20px',
						borderTop: i === 0 ? 'none' : `1px solid ${ line2 }`,
						cursor: item.done ? 'default' : 'pointer',
					} }
				>
					{ item.done ? (
						<span
							style={ {
								width: '22px',
								height: '22px',
								borderRadius: '50%',
								background: blue,
								color: '#fff',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								flex: '0 0 22px',
							} }
						>
							<svg
								width="13"
								height="13"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="3"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
								focusable="false"
							>
								<path d="M20 6 9 17l-5-5" />
							</svg>
						</span>
					) : (
						<span
							style={ {
								width: '22px',
								height: '22px',
								borderRadius: '50%',
								border: `1.5px solid ${ line }`,
								background: paper,
								flex: '0 0 22px',
							} }
						/>
					) }
					<div style={ { flex: 1, minWidth: 0 } }>
						<div style={ { fontSize: '14px', fontWeight: 600 } }>{ item.title }</div>
						<div style={ { fontSize: '12.5px', color: muted, marginTop: '2px' } }>
							{ item.desc }
						</div>
					</div>
					{ ! item.done && <Chevron /> }
				</div>
			) ) }
		</div>
	</div>
);

const Stage = (): JSX.Element => (
	<AdminPage
		apiRoot={ getSiteData()?.rest_root }
		apiNonce={ getSiteData()?.rest_nonce }
		title={ __( 'Dashboard', 'jetpack-newsletter' ) }
		subTitle={ __(
			'Expand your reach, engage readers, and monetize your writing.',
			'jetpack-newsletter'
		) }
	>
		<div className="jetpack-newsletter-mode-page">
			<Preview />
		</div>
	</AdminPage>
);

export { Stage as stage };
