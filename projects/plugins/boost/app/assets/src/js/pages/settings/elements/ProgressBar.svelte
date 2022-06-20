<script>
	export let progress = 0;
</script>

<div
	role="progressbar"
	aria-valuemax="100"
	aria-valuemin="0"
	aria-valuenow={progress}
	class="jb-progress-bar"
>
	<div class="jb-progress-bar__filler" aria-hidden="true" style={`width: ${ progress }%;`} />
</div>
