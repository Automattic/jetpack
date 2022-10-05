<script>
	export let placement = 'center';
</script>

<div class="jb-context-info">
	<span class="jb-context-info__icon">i</span>
	<div class="jb-context-info__container jb-context-info__container--placement-{placement}">
		<slot />
	</div>
</div>
