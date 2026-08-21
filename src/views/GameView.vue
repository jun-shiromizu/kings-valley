<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Home, RotateCcw } from 'lucide-vue-next'
import GameBoard from '../components/GameBoard.vue'
import GameResultDialog from '../components/GameResultDialog.vue'
import TurnStatus from '../components/TurnStatus.vue'
import { clearSession, hasActiveSession, useGameSession } from '../composables/useGameSession'

const router = useRouter()
const session = useGameSession()
const state = computed(() => session.state.value)

onMounted(() => {
  if (!hasActiveSession()) void router.replace('/')
})

const toTop = async () => {
  clearSession()
  await router.push('/')
}
</script>

<template>
  <main v-if="state" class="game-page">
    <header class="game-header">
      <button class="icon-button" type="button" aria-label="トップページへ戻る" @click="toTop">
        <Home :size="19" />
      </button>
      <div class="game-title"><span>KINGS</span><strong>VALLEY</strong></div>
      <button class="icon-button" type="button" aria-label="もう一度遊ぶ" @click="session.rematch">
        <RotateCcw :size="19" />
      </button>
    </header>
    <section class="game-layout" aria-labelledby="game-heading">
      <div class="game-copy">
        <p class="eyebrow">THE VALLEY / {{ state.startedPlayer === 'human' ? 'YOU FIRST' : 'COM FIRST' }}</p>
        <h1 id="game-heading">中心へ<br /><em>滑り込め。</em></h1>
        <TurnStatus :state="state" :is-busy="session.isBusy.value" />
      </div>
      <div class="board-column">
        <div class="board-labels"><span>COM / 奥</span><span>YOU / 手前</span></div>
        <GameBoard
          :state="state"
          :selected-piece-id="session.selectedPieceId.value"
          :selected-moves="session.selectedMoves.value"
          :disabled="session.isBusy.value || state.result.status !== 'playing'"
          @select="session.selectPiece"
          @move="session.moveSelectedPiece"
        />
        <p class="board-tip">駒を選び、光る矢印で進む方向を選択</p>
      </div>
    </section>
    <GameResultDialog :result="state.result" @rematch="session.rematch" @top="toTop" />
  </main>
</template>
