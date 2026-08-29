import { CustomJsSettings, CustomScript } from '../types';

interface ExecutionLog {
  timestamp: string;
  source: string;
  status: 'success' | 'error';
  message: string;
}

const executionLogs: ExecutionLog[] = [];

export function getScriptExecutionLogs(): ExecutionLog[] {
  return [...executionLogs];
}

export function logScriptResult(source: string, status: 'success' | 'error', message: string) {
  executionLogs.unshift({
    timestamp: new Date().toLocaleTimeString(),
    source,
    status,
    message,
  });
  if (executionLogs.length > 50) {
    executionLogs.pop();
  }
}

/**
 * Safely evaluates or injects a custom JavaScript snippet into the browser environment
 */
export function runCustomJavaScript(code: string, sourceName = 'Custom JS'): boolean {
  if (!code || !code.trim()) return true;

  try {
    // If the code contains <script> tags, extract the JS inside or create script elements
    if (code.includes('<script')) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = code;
      const scriptElements = tempDiv.querySelectorAll('script');
      
      scriptElements.forEach((s) => {
        const newScript = document.createElement('script');
        if (s.src) {
          newScript.src = s.src;
          newScript.async = s.async;
          newScript.crossOrigin = s.crossOrigin;
        } else {
          newScript.textContent = s.textContent;
        }
        document.body.appendChild(newScript);
      });
      logScriptResult(sourceName, 'success', 'HTML script tags injected successfully');
      return true;
    }

    // Direct JS execution via Function constructor (isolated scope)
    const runFn = new Function(code);
    runFn();
    logScriptResult(sourceName, 'success', 'Executed without errors');
    return true;
  } catch (err: any) {
    console.error(`[Custom JS Error in ${sourceName}]:`, err);
    logScriptResult(sourceName, 'error', err?.message || 'Unknown runtime error');
    return false;
  }
}

/**
 * Applies full CustomJsSettings dynamically
 */
export function applyCustomJsSettings(settings: CustomJsSettings): void {
  if (!settings || !settings.enabled) return;

  // 1. Run Global Header JS
  if (settings.globalHeaderJs && settings.globalHeaderJs.trim()) {
    runCustomJavaScript(settings.globalHeaderJs, 'Global Header JS');
  }

  // 2. Run Individual Custom Scripts
  if (Array.isArray(settings.customScripts)) {
    settings.customScripts.forEach((script: CustomScript) => {
      if (script.isEnabled && script.code && script.code.trim()) {
        runCustomJavaScript(script.code, `Script: ${script.name}`);
      }
    });
  }

  // 3. Run Global Footer JS
  if (settings.globalFooterJs && settings.globalFooterJs.trim()) {
    runCustomJavaScript(settings.globalFooterJs, 'Global Footer JS');
  }
}
