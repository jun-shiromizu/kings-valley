<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Crown, Sparkles } from 'lucide-vue-next'
import { useGameSession } from '../composables/useGameSession'
import type { Difficulty, TurnOrder } from '../domain'

const router = useRouter()
const { start } = useGameSession()
const turnOrder = ref<TurnOrder>('random')
const difficulty = ref<Difficulty>('easy')

const begin = async () => {
  start(turnOrder.value, difficulty.value)
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
        <h2 id="start-title" class="start-panel__label">先手を選ぶ</h2>
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
      <div class="difficulty-selection">
        <h2 id="difficulty-label" class="difficulty-selection__label">ゲーム難易度を選ぶ</h2>
        <div class="difficulty-options" role="radiogroup" aria-labelledby="difficulty-label">
          <label
            v-for="option in [
              { value: 'easy', label: 'easy' },
              { value: 'normal', label: 'normal' },
              { value: 'hard', label: 'hard' },
            ]"
            :key="option.value"
            class="difficulty-option"
            :class="{ 'difficulty-option--active': difficulty === option.value }"
          >
            <input v-model="difficulty" type="radio" name="difficulty" :value="option.value" />
            <span>{{ option.label }}</span>
          </label>
        </div>
      </div>
      <button class="start-button" type="button" @click="begin">
        <span>ゲームスタート</span>
        <ArrowRight :size="20" aria-hidden="true" />
      </button>
      <p class="start-hint"><Sparkles :size="14" aria-hidden="true" /> 5 x 5 の盤面 / 8方向スライド</p>
    </section>
  </main>
</template>

<style scoped>
.start-panel .start-panel__label,
.start-panel .difficulty-selection__label {
  font-size: clamp(1.25rem, 2vw, 1.65rem);
  margin-bottom: 1rem;
}

.difficulty-selection {
  margin-top: 1.6rem;
}

.difficulty-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border: 1px solid var(--line);
}

.difficulty-option {
  min-height: 52px;
  display: grid;
  place-items: center;
  border-right: 1px solid var(--line);
  font-family: 'DM Mono', monospace;
  font-size: 0.8rem;
  text-transform: uppercase;
  cursor: pointer;
}

.difficulty-option:last-child {
  border-right: 0;
}

.difficulty-option input {
  position: absolute;
  opacity: 0;
}

.difficulty-option:focus-within {
  outline: 3px solid var(--gold);
  outline-offset: -3px;
}

.difficulty-option--active {
  color: var(--paper);
  background: var(--teal);
}
</style>
