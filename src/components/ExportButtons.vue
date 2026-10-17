<template>
  <div class="d-flex flex-wrap align-items-center gap-2">
    <button type="button" class="btn btn-outline-success btn-sm" :disabled="!rows.length" @click="csv">
      Export CSV
    </button>
    <button type="button" class="btn btn-outline-success btn-sm" :disabled="!rows.length || busy" @click="pdf">
      {{ busy ? 'Building PDF...' : 'Export PDF' }}
    </button>
    <span class="small text-body-secondary" role="status">
      {{ message || `${rows.length} rows will be exported (what you see after filtering).` }}
    </span>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { exportCsv, exportPdf } from '../utils/exportTable'

// rows = what the user sees now. columns = [{ field, header }].
const props = defineProps({
  rows: { type: Array, required: true },
  columns: { type: Array, required: true },
  name: { type: String, required: true },
  title: { type: String, required: true },
})

const busy = ref(false)
const message = ref('')

// Filter changed, so clear the old "downloaded" message.
watch(
  () => props.rows.length,
  () => {
    message.value = ''
  },
)

const csv = () => {
  exportCsv(props.rows, props.columns, props.name)
  message.value = `CSV downloaded (${props.rows.length} rows).`
}

const pdf = async () => {
  busy.value = true
  try {
    await exportPdf(props.rows, props.columns, props.name, props.title)
    message.value = `PDF downloaded (${props.rows.length} rows).`
  } catch (error) {
    console.error('PDF export failed:', error.message)
    message.value = 'Could not build the PDF. Please try again.'
  } finally {
    busy.value = false
  }
}
</script>
