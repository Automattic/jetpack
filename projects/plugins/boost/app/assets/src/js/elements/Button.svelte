<button class="button" on:click>
	<slot />
</button>

<style lang="scss">
	// Increasing specificity
	// to override the default WordPress button styles.
	:global( #jb-settings ) {
		button {
			display: flex;
			justify-content: center;
			align-items: center;
			padding: 8px 24px;

			width: 220px;
			height: 40px;

			background: #ffffff;

			color: var( --jetpack-green-100 );
			border: 1px solid currentColor;
			border-radius: 4px;

			font-weight: 600;
			font-size: 16px;
			letter-spacing: -0.01em;
			line-height: 24px;
		}
	}
</style>
