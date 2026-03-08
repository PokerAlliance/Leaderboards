<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/composables'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'

const emit = defineEmits<{
  success: []
}>()

const { login } = useAuth()

const username = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

async function handleSubmit() {
  if (!username.value.trim() || !password.value) {
    error.value = 'Please enter username and password'
    return
  }

  isLoading.value = true
  error.value = ''

  const result = await login(username.value.trim(), password.value)

  isLoading.value = false

  if (result.success) {
    emit('success')
  } else {
    error.value = result.error || 'Login failed'
    password.value = ''
  }
}
</script>

<template>
  <BaseCard class="login-form">
    <h2 class="login-form__title">Admin Login</h2>
    <p class="login-form__subtitle">Sign in to manage league scores</p>

    <form class="login-form__form" @submit.prevent="handleSubmit">
      <div class="login-form__field">
        <label for="username" class="login-form__label">Username</label>
        <input
          id="username"
          v-model="username"
          type="text"
          class="login-form__input"
          placeholder="Enter username"
          autocomplete="username"
          :disabled="isLoading"
        />
      </div>

      <div class="login-form__field">
        <label for="password" class="login-form__label">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          class="login-form__input"
          placeholder="Enter password"
          autocomplete="current-password"
          :disabled="isLoading"
        />
      </div>

      <div v-if="error" class="login-form__error">
        {{ error }}
      </div>

      <BaseButton
        type="submit"
        variant="primary"
        size="lg"
        :loading="isLoading"
        :disabled="isLoading"
        class="login-form__submit"
      >
        Sign In
      </BaseButton>
    </form>
  </BaseCard>
</template>

<style scoped>
.login-form {
  max-width: 400px;
  width: 100%;
  margin: 0 auto;
}

.login-form__title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-2);
  text-align: center;
}

.login-form__subtitle {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-6);
  text-align: center;
}

.login-form__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.login-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.login-form__label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
}

.login-form__input {
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  background: var(--color-bg-base);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.login-form__input:focus {
  outline: none;
  border-color: var(--color-gold);
  box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
}

.login-form__input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-form__input::placeholder {
  color: var(--color-text-muted);
}

.login-form__error {
  padding: var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-error);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-md);
  text-align: center;
}

.login-form__submit {
  width: 100%;
  margin-top: var(--space-2);
}
</style>
