<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import TemplatedString from './TemplatedString.svelte';
</script>

<p class="jb-activate-license">
	<TemplatedString
		template={__(
			'Already have an existing plan or license key? <link>Click here to get started</link>',
			'jetpack-boost'
		)}
		vars={{
			link: [
				'a',
				{
					class: 'jb-activate-license__link',
					href: 'admin.php?page=my-jetpack#/add-license',
				},
			],
		}}
	/>
</p>

<style lang="scss">
	.jb-activate-license {
		font-size: 13px;

		:global( .jb-activate-license__link ) {
			color: var( --blue-50 );

			&:hover,
			&:active {
				color: var( --blue-60 );
			}
		}
	}
</style>
