<script lang="ts">
import { DownloadState } from './DownloadState';
import DatabaseStatus from './DatabaseStatus.svelte';

const downloadState = DownloadState.Initializing;
</script>

<DatabaseStatus {downloadState} />
