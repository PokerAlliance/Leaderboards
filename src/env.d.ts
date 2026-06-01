declare module 'three' {
  const THREE: unknown
  export default THREE
  export = THREE
}

declare module 'vanta/dist/vanta.halo.min' {
  const HALO: (opts: Record<string, unknown>) => { destroy: () => void }
  export default HALO
}
