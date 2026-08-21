<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { GameResult } from '../domain'

type FocusableDialog = { focus: () => void }

const props = defineProps<{ result: GameResult }>()
defineEmits<{ rematch: []; top: [] }>()
const dialog = ref<FocusableDialog | null>(null)

watch(
  () => props.result.status,
  async (status) => {
    if (status !== 'playing') {
      await nextTick()
      dialog.value?.focus()
    }
  },
)
</script>

<template>
  <div v-if="result.status !== 'playing'" class="result-backdrop">
    <section ref="dialog" class="result-dialog" role="dialog" aria-modal="true" aria-labelledby="result-title" tabindex="-1">
      <span class="result-dialog__kicker">VALLEY DECIDED</span>
      <h2 id="result-title">
        {{ result.status === 'draw' ? '引き分け' : result.winner === 'human' ? 'あなたの勝利' : 'COM の勝利' }}
      </h2>
      <p>
        {{
          result.status === 'draw'
            ? '同じ局面が3回現れました。'
            : result.winner === 'human'
              ? '王様が中央に到達しました。'
              : 'COM の王様が中央に到達しました。'
        }}
      </p>
      <div class="result-dialog__actions">
        <button class="button button--primary" type="button" @click="$emit('rematch')">もう一度</button>
        <button class="button button--quiet" type="button" @click="$emit('top')">トップページ</button>
      </div>
    </section>
  </div>
</template>
