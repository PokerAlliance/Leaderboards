export interface UseMuckersVanta {
  initVanta: (el: HTMLElement) => void
  destroyVanta: () => void
}

const VANTA_OPTIONS = {
  mouseControls: true,
  touchControls: true,
  gyroControls: false,
  minHeight: 200,
  minWidth: 200,
  scale: 1.0,
  scaleMobile: 0.8,
  baseColor: 0x1B2A4A,
  backgroundColor: 0x0F172A,
  size: 2.5,
  amplitudeFactor: 1.8,
  xOffset: 0.0,
  yOffset: 0.0,
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
  } catch {
    return false
  }
}

let _instance: UseMuckersVanta | null = null

/**
 * Singleton composable managing the Vanta.js HALO animated background.
 * Lazily loads Vanta + Three.js to keep the main bundle lean.
 */
export function useMuckersVanta(): UseMuckersVanta {
  if (_instance) return _instance

  let vantaEffect: { destroy: () => void } | null = null
  let webglAvailable: boolean | null = null

  function destroyVanta() {
    if (vantaEffect) {
      vantaEffect.destroy()
      vantaEffect = null
    }
  }

  async function initVanta(el: HTMLElement) {
    if (webglAvailable === null) {
      webglAvailable = hasWebGL()
    }
    if (!webglAvailable) return

    destroyVanta()
    try {
      const THREE = await import('three')
      const mod = await import('vanta/dist/vanta.halo.min')
      vantaEffect = mod.default({ ...VANTA_OPTIONS, el, THREE })
    } catch (err) {
      console.warn('[Muckers Vanta] Failed to initialize HALO:', err)
    }
  }

  _instance = { initVanta, destroyVanta }
  return _instance
}
