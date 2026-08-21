<script setup lang="ts">
import type { GameState } from '../domain'

defineProps<{ state: GameState; isBusy: boolean }>()
</script>

<template>
  <div class="turn-status" aria-live="polite">
    <span class="turn-status__eyebrow">{{ state.startedPlayer === 'human' ? 'あなたが先手' : 'COM が先手' }}</span>
    <strong v-if="state.result.status === 'playing'">
      {{ isBusy ? 'COM が考えています' : state.currentPlayer === 'human' ? 'あなたの手番' : 'COM の手番' }}
    </strong>
    <strong v-else>対局終了</strong>
  </div>
</template>
