import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App.vue'
import { clearSession } from '../composables/useGameSession'
import { router } from './index'

describe('router', () => {
  afterEach(async () => {
    clearSession()
    await router.push('/')
  })

  it('対局なしでゲームページを開くとトップへ戻る', async () => {
    clearSession()
    await router.push('/game')
    const wrapper = mount(App, { global: { plugins: [router] } })
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/'))
    await nextTick()

    expect(wrapper.text()).toContain('KingsValley')
    wrapper.unmount()
  })

  it('未定義ルートをトップへリダイレクトする', async () => {
    await router.push('/not-found')
    const wrapper = mount(App, { global: { plugins: [router] } })
    await nextTick()

    expect(router.currentRoute.value.path).toBe('/')
    expect(wrapper.text()).toContain('KingsValley')
    wrapper.unmount()
  })
})
