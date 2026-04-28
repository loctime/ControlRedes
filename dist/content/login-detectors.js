(function bootstrapLoginDetectors() {
  const detectors = {
    instagram() {
      if (window.location.pathname.startsWith('/accounts/login')) {
        return { status: 'logged_out', reason: 'login_path' };
      }

      const loggedInSignals = [
        'svg[aria-label="Home"]',
        'a[href="/direct/inbox/"]',
        'a[href="/explore/"]',
        'nav[role="navigation"]'
      ];

      if (loggedInSignals.some((selector) => document.querySelector(selector))) {
        return { status: 'logged_in', reason: 'nav_present' };
      }

      const loggedOutSignals = [
        'input[name="username"]',
        'input[name="password"]',
        'button[type="submit"]'
      ];

      if (loggedOutSignals.some((selector) => document.querySelector(selector))) {
        return { status: 'logged_out', reason: 'login_form' };
      }

      return { status: 'unknown', reason: 'no_signal' };
    },

    linkedin() {
      if (window.location.pathname.startsWith('/login')) {
        return { status: 'logged_out', reason: 'login_path' };
      }

      const loggedInSignals = [
        '#global-nav',
        'a[href*="/feed/"]',
        'button[aria-label*="Start a post"]'
      ];

      if (loggedInSignals.some((selector) => document.querySelector(selector))) {
        return { status: 'logged_in', reason: 'nav_present' };
      }

      const loggedOutSignals = [
        'input[name="session_key"]',
        'input[name="session_password"]',
        'form.login__form'
      ];

      if (loggedOutSignals.some((selector) => document.querySelector(selector))) {
        return { status: 'logged_out', reason: 'login_form' };
      }

      return { status: 'unknown', reason: 'no_signal' };
    },
  };

  window.__GSDLoginDetectors = {
    run(platform) {
      const detector = detectors[platform];
      if (!detector) {
        return { status: 'unknown', reason: 'unsupported_platform' };
      }

      return detector();
    },
  };
})();
