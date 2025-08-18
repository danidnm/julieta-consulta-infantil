import { isAuthenticated, login as authLogin, logout as authLogout } from '../store/auth.js';
import { navigate } from '../app/router.js';

export default function login() {
  return {
    password: '',
    error: '',
    loading: false,
    identified: false,

    init() {
      this.identified = isAuthenticated();
      // focus input after render
      setTimeout(() => {
        const el = this.$root?.querySelector('input[type="password"]');
        if (el && !this.identified) el.focus();
      }, 0);
    },

    async submit(e) {
      e?.preventDefault?.();
      this.error = '';
      this.loading = true;
      const ok = await authLogin(this.password);
      this.loading = false;
      if (ok) {
        this.identified = true;
        // Redirect to intended destination if any
        let target = '#Patients';
        try {
          const saved = sessionStorage.getItem('after_login');
          if (saved && saved.startsWith('#') && saved !== '#Home') target = saved;
          sessionStorage.removeItem('after_login');
        } catch {}
        navigate(target);
      } else {
        this.error = 'Contraseña incorrecta. Prueba de nuevo';
        this.password = '';
      }
    },

    doLogout() {
      authLogout();
      this.identified = false;
      this.password = '';
    }
  };
}
