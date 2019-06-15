<script lang="ts">
import { DownloadState } from './DownloadState';

export let downloadState: DownloadState;

// This is all because Svelte plays _really_ poorly with TS. We can't use
// `DownloadState` in the template syntax itself so we have to check it here and
// assign to some other variable.
let isInitializing = false;
$: isInitializing = downloadState === DownloadState.Initializing;
</script>

<section class="database-status">
{ isInitializing ? 'Initializing...' : '' }
</section>
