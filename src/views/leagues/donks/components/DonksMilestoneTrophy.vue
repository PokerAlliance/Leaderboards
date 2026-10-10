<script setup lang="ts">
import { computed, useId } from 'vue'
import { getMilestoneTier } from '@/config/donks'

const props = withDefaults(defineProps<{
  milestone: number
  /** Rendered width in px; height follows the 6:7 aspect ratio */
  size?: number
  /** Engrave the milestone number on the plinth */
  showNumber?: boolean
  /** Animated shine sweep across the cup */
  shine?: boolean
  /** Custom plaque engraving (replaces the milestone number) */
  plaque?: string
}>(), {
  size: 64,
  showNumber: true,
  shine: true,
})

const uid = useId()
const tier = computed(() => getMilestoneTier(props.milestone))
const label = computed(() =>
  props.plaque ?? (props.milestone >= 1000 && props.milestone % 1000 === 0
    ? `${props.milestone / 1000}K`
    : props.milestone.toLocaleString('en-US')),
)

const ids = {
  metal: `${uid}-metal`,
  metalSide: `${uid}-metal-side`,
  plinth: `${uid}-plinth`,
  bowl: `${uid}-bowl`,
  shine: `${uid}-shine`,
}
</script>

<template>
  <svg
    class="ms-trophy"
    :class="{ 'ms-trophy--shine': shine }"
    :width="size"
    :height="size * 7 / 6"
    viewBox="0 0 120 140"
    role="img"
    :aria-label="`${tier.name} trophy — ${milestone} games`"
  >
    <defs>
      <linearGradient :id="ids.metal" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" :stop-color="tier.colors.dark" />
        <stop offset="28%" :stop-color="tier.colors.base" />
        <stop offset="48%" :stop-color="tier.colors.light" />
        <stop offset="70%" :stop-color="tier.colors.base" />
        <stop offset="100%" :stop-color="tier.colors.dark" />
      </linearGradient>
      <linearGradient :id="ids.metalSide" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="tier.colors.light" />
        <stop offset="100%" :stop-color="tier.colors.dark" />
      </linearGradient>
      <linearGradient :id="ids.plinth" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2a2a3a" />
        <stop offset="100%" stop-color="#0e0e16" />
      </linearGradient>
      <linearGradient :id="ids.shine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#fff" stop-opacity="0" />
        <stop offset="50%" stop-color="#fff" stop-opacity="0.75" />
        <stop offset="100%" stop-color="#fff" stop-opacity="0" />
      </linearGradient>
      <clipPath :id="ids.bowl">
        <path d="M30 18 H90 V44 C90 70 76 85 60 87 C44 85 30 70 30 44 Z" />
      </clipPath>
    </defs>

    <!-- Handles -->
    <path
      d="M31 26 C14 26 10 38 14 49 C18 60 28 64 36 64"
      fill="none"
      :stroke="`url(#${ids.metalSide})`"
      stroke-width="6"
      stroke-linecap="round"
    />
    <path
      d="M89 26 C106 26 110 38 106 49 C102 60 92 64 84 64"
      fill="none"
      :stroke="`url(#${ids.metalSide})`"
      stroke-width="6"
      stroke-linecap="round"
    />

    <!-- Bowl -->
    <path d="M30 18 H90 V44 C90 70 76 85 60 87 C44 85 30 70 30 44 Z" :fill="`url(#${ids.metal})`" />
    <!-- Rim -->
    <rect x="26" y="13" width="68" height="8" rx="3" :fill="`url(#${ids.metalSide})`" />
    <!-- Star -->
    <path
      d="M60 32 L63.5 41.5 L73.5 41.8 L65.6 47.9 L68.4 57.5 L60 51.8 L51.6 57.5 L54.4 47.9 L46.5 41.8 L56.5 41.5 Z"
      :fill="tier.colors.light"
      :stroke="tier.colors.dark"
      stroke-width="1.2"
      opacity="0.9"
    />

    <!-- Shine sweep -->
    <g v-if="shine" :clip-path="`url(#${ids.bowl})`">
      <rect class="ms-trophy__shine" x="-40" y="10" width="26" height="90" :fill="`url(#${ids.shine})`" transform="skewX(-20)" />
    </g>

    <!-- Stem + knot -->
    <rect x="55" y="86" width="10" height="14" :fill="`url(#${ids.metal})`" />
    <ellipse cx="60" cy="101" rx="11" ry="4" :fill="`url(#${ids.metalSide})`" />
    <path d="M42 112 L48 104 H72 L78 112 Z" :fill="`url(#${ids.metal})`" />

    <!-- Plinth -->
    <rect x="30" y="112" width="60" height="24" rx="3" :fill="`url(#${ids.plinth})`" />
    <rect x="34" y="116" width="52" height="16" rx="2" fill="none" :stroke="tier.colors.base" stroke-width="1" opacity="0.7" />
    <text
      v-if="showNumber"
      x="60"
      y="128.5"
      text-anchor="middle"
      class="ms-trophy__label"
      :fill="tier.colors.light"
    >{{ label }}</text>
  </svg>
</template>

<style scoped>
.ms-trophy {
  display: block;
  overflow: visible;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.35));
}

.ms-trophy__label {
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.ms-trophy__shine {
  animation: ms-shine 3.2s ease-in-out infinite;
}

@keyframes ms-shine {
  0% { transform: skewX(-20deg) translateX(0); }
  55%, 100% { transform: skewX(-20deg) translateX(200px); }
}

@media (prefers-reduced-motion: reduce) {
  .ms-trophy__shine { animation: none; }
}
</style>
