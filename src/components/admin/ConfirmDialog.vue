<script setup lang="ts">
import { watch } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'

interface Props {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'primary' | 'secondary' | 'ghost'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  confirmVariant: 'primary',
  loading: false,
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
)

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget && !props.loading) {
    emit('cancel')
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && !props.loading) {
    emit('cancel')
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div
        v-if="open"
        class="confirm-dialog__backdrop"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div class="confirm-dialog" role="dialog" aria-modal="true">
          <h3 class="confirm-dialog__title">{{ title }}</h3>
          <p class="confirm-dialog__message">{{ message }}</p>

          <div class="confirm-dialog__actions">
            <BaseButton
              variant="secondary"
              :disabled="loading"
              @click="emit('cancel')"
            >
              {{ cancelText }}
            </BaseButton>
            <BaseButton
              :variant="confirmVariant"
              :loading="loading"
              :disabled="loading"
              @click="emit('confirm')"
            >
              {{ confirmText }}
            </BaseButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-dialog__backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  z-index: 1000;
}

.confirm-dialog {
  width: 100%;
  max-width: 400px;
  padding: var(--space-6);
  background: var(--color-bg-card);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.confirm-dialog__title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-3);
}

.confirm-dialog__message {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-6);
  line-height: 1.5;
}

.confirm-dialog__actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}

/* Transition */
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-enter-active .confirm-dialog,
.dialog-leave-active .confirm-dialog {
  transition: transform 0.2s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .confirm-dialog,
.dialog-leave-to .confirm-dialog {
  transform: scale(0.95);
}
</style>
