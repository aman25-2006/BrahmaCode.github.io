// Keep tracked config empty. Real values should live in untracked firebase-secrets.js.
(function bootstrapFirebaseConfig() {
  const EMPTY = {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: ''
  };

  function sanitizeConfig(config) {
    if (!config || typeof config !== 'object') {
      return { ...EMPTY };
    }

    return {
      apiKey: String(config.apiKey || '').trim(),
      authDomain: String(config.authDomain || '').trim(),
      projectId: String(config.projectId || '').trim(),
      storageBucket: String(config.storageBucket || '').trim(),
      messagingSenderId: String(config.messagingSenderId || '').trim(),
      appId: String(config.appId || '').trim(),
      measurementId: String(config.measurementId || '').trim()
    };
  }

  function setPublicConfig() {
    const privateConfig = window.BRAHMACODE_FIREBASE_CONFIG_PRIVATE;
    window.BRAHMACODE_FIREBASE_CONFIG = sanitizeConfig(privateConfig);
  }

  setPublicConfig();

  if (window.BRAHMACODE_FIREBASE_CONFIG.apiKey) {
    window.BRAHMACODE_FIREBASE_READY = Promise.resolve(true);
    return;
  }

  window.BRAHMACODE_FIREBASE_READY = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'firebase-secrets.js';
    script.defer = true;

    script.onload = () => {
      setPublicConfig();
      resolve(Boolean(window.BRAHMACODE_FIREBASE_CONFIG.apiKey));
    };

    script.onerror = () => {
      // Missing local secret file is expected in many environments.
      resolve(false);
    };

    document.head.appendChild(script);
  });
})();
