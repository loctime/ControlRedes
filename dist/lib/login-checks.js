const PLATFORM_CONFIG = {
  instagram: {
    origin: 'https://www.instagram.com/',
  },
  linkedin: {
    origin: 'https://www.linkedin.com/feed/',
  },
};

async function getOrCreateTab(url) {
  const existingTabs = await chrome.tabs.query({ url: `${new URL(url).origin}/*` });
  if (existingTabs.length > 0) {
    return existingTabs[0];
  }

  return chrome.tabs.create({
    url,
    active: false,
  });
}

async function waitForTabComplete(tabId) {
  const tab = await chrome.tabs.get(tabId);
  if (tab.status === 'complete') {
    return;
  }

  await new Promise((resolve) => {
    const listener = (updatedTabId, changeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };

    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function runDetector(platform) {
  const config = PLATFORM_CONFIG[platform];
  const tab = await getOrCreateTab(config.origin);
  await waitForTabComplete(tab.id);

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content/login-detectors.js'],
  });

  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (currentPlatform) => {
      return window.__GSDLoginDetectors?.run(currentPlatform) || {
        status: 'unknown',
        reason: 'detector_missing',
      };
    },
    args: [platform],
  });

  return {
    status: result.result?.status || 'unknown',
    reason: result.result?.reason || null,
    checkedAt: new Date().toISOString(),
  };
}

export async function verifyLogins() {
  const [instagram, linkedin] = await Promise.all([
    runDetector('instagram').catch((error) => ({
      status: 'error',
      reason: error.message,
      checkedAt: new Date().toISOString(),
    })),
    runDetector('linkedin').catch((error) => ({
      status: 'error',
      reason: error.message,
      checkedAt: new Date().toISOString(),
    })),
  ]);

  return {
    instagram,
    linkedin,
    lastCheckedAt: new Date().toISOString(),
  };
}
