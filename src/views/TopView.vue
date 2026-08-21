<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Crown, Sparkles } from 'lucide-vue-next'
import { useGameSession } from '../composables/useGameSession'
import type { TurnOrder } from '../domain'

const router = useRouter()
const { start } = useGameSession()
const turnOrder = ref<TurnOrder>('random')

const begin = async () => {
  start(turnOrder.value)
  await router.push('/game')
}
</script>

<template>
  <main class="top-page">
    <section class="top-page__hero">
      <div class="brand-mark" aria-hidden="true">
        <Crown :size="22" />
      </div>
      <p class="eyebrow">A SLIDING STRATEGY GAME</p>
      <h1>Kings<br /><em>Valley</em></h1>
      <p class="top-page__lead">止まれない一手で、王様を谷の中心へ。</p>
    </section>
    <section class="start-panel" aria-labelledby="start-title">
      <div>
        <span class="panel-number">01 / START</span>
        <h2 id="start-title">先手を選ぶ</h2>
      </div>
      <div class="turn-options" role="radiogroup" aria-label="手番順">
        <label
          v-for="option in [
            { value: 'human-first', label: '先手', note: 'あなたから' },
            { value: 'com-first', label: '後手', note: 'COMから' },
            { value: 'random', label: 'ランダム', note: '運に委ねる' },
          ]"
          :key="option.value"
          class="turn-option"
          :class="{ 'turn-option--active': turnOrder === option.value }"
        >
          <input v-model="turnOrder" type="radio" name="turnOrder" :value="option.value" />
          <span class="turn-option__label">{{ option.label }}</span>
          <span class="turn-option__note">{{ option.note }}</span>
        </label>
      </div>
      <button class="start-button" type="button" @click="begin">
        <span>ゲームスタート</span>
        <ArrowRight :size="20" aria-hidden="true" />
      </button>
      <p class="start-hint"><Sparkles :size="14" aria-hidden="true" /> 5 x 5 の盤面 / 8方向スライド</p>
    </section>
  </main>
</template>
