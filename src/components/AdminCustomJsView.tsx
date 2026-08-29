import React, { useState } from 'react';
import { 
  Code2, 
  Plus, 
  Trash2, 
  Play, 
  Check, 
  Save, 
  AlertCircle, 
  Terminal, 
  Sparkles, 
  FileCode, 
  ShieldCheck, 
  Layers,
  Copy,
  RotateCcw
} from 'lucide-react';
import { CustomJsSettings, CustomScript } from '../types';
import { SCRIPT_TEMPLATES, DEFAULT_CUSTOM_JS_SETTINGS } from '../data/defaultCustomJs';
import { runCustomJavaScript, getScriptExecutionLogs } from '../utils/scriptInjector';

interface AdminCustomJsViewProps {
  customJsSettings: CustomJsSettings;
  onSaveCustomJs: (settings: CustomJsSettings) => void;
}

export const AdminCustomJsView: React.FC<AdminCustomJsViewProps> = ({
  customJsSettings,
  onSaveCustomJs,
}) => {
  const [settings, setSettings] = useState<CustomJsSettings>(() => ({
    ...DEFAULT_CUSTOM_JS_SETTINGS,
    ...customJsSettings,
  }));

  const [activeSubTab, setActiveSubTab] = useState<'scripts' | 'header_js' | 'footer_js' | 'templates' | 'console'>('scripts');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);

  // New script form state
  const [isAddingScript, setIsAddingScript] = useState(false);
  const [newScript, setNewScript] = useState<{
    name: string;
    code: string;
    placement: 'head' | 'body_end';
    notes: string;
  }>({
    name: '',
    code: '',
    placement: 'head',
    notes: '',
  });

  const handleToggleGlobal = () => {
    const updated = { ...settings, enabled: !settings.enabled };
    setSettings(updated);
    onSaveCustomJs(updated);
  };

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSaveCustomJs(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleAddScript = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScript.name.trim() || !newScript.code.trim()) return;

    const scriptItem: CustomScript = {
      id: `script-${Date.now()}`,
      name: newScript.name.trim(),
      code: newScript.code.trim(),
      placement: newScript.placement,
      isEnabled: true,
      notes: newScript.notes.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = {
      ...settings,
      customScripts: [...settings.customScripts, scriptItem],
    };

    setSettings(updated);
    onSaveCustomJs(updated);
    setNewScript({ name: '', code: '', placement: 'head', notes: '' });
    setIsAddingScript(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleDeleteScript = (id: string) => {
    if (window.confirm('Delete this custom script?')) {
      const updated = {
        ...settings,
        customScripts: settings.customScripts.filter((s) => s.id !== id),
      };
      setSettings(updated);
      onSaveCustomJs(updated);
    }
  };

  const handleToggleScript = (id: string) => {
    const updated = {
      ...settings,
      customScripts: settings.customScripts.map((s) =>
        s.id === id ? { ...s, isEnabled: !s.isEnabled } : s
      ),
    };
    setSettings(updated);
    onSaveCustomJs(updated);
  };

  const handleApplyTemplate = (template: typeof SCRIPT_TEMPLATES[0]) => {
    setNewScript({
      name: template.name,
      code: template.code,
      placement: template.placement,
      notes: template.description,
    });
    setIsAddingScript(true);
    setActiveSubTab('scripts');
  };

  const handleTestRunCode = (code: string, name: string) => {
    const ok = runCustomJavaScript(code, name);
    if (ok) {
      setTestResult({
        status: 'success',
        message: `✓ Script "${name}" ran successfully without runtime exceptions!`,
      });
    } else {
      setTestResult({
        status: 'error',
        message: `✕ Error executing "${name}". Check browser developer console for detailed traceback.`,
      });
    }
    setTimeout(() => setTestResult(null), 4000);
  };

  const executionLogs = getScriptExecutionLogs();

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Master Switch */}
      <div className="bg-[#121622] border border-[#232B3E] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/30 flex items-center justify-center shrink-0">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">Custom JavaScript & Tracking Engine</h3>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1B2232] text-amber-400 border border-[#2B364C]">
                جاوا اسکرپٹ مینجمنٹ
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Add Google AdSense scripts, Google Analytics (GA4), Facebook Pixel, GTM, or custom client-side JS functions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleToggleGlobal}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-mono transition-all border flex items-center gap-2 cursor-pointer ${
              settings.enabled
                ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-950/50'
                : 'bg-[#1C2230] text-slate-400 border-[#2D374D]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${settings.enabled ? 'bg-black animate-pulse' : 'bg-slate-500'}`} />
            <span>{settings.enabled ? 'ENGINE: ACTIVE' : 'ENGINE: DISABLED'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveAll()}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs rounded-lg transition-colors cursor-pointer shadow-md"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-lg text-xs flex items-center gap-2 font-mono">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Custom JavaScript settings saved and executed successfully!</span>
        </div>
      )}

      {testResult && (
        <div className={`px-4 py-3 rounded-lg text-xs flex items-center gap-2 font-mono ${
          testResult.status === 'success' 
            ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300' 
            : 'bg-rose-950/60 border border-rose-500/50 text-rose-300'
        }`}>
          {testResult.status === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#222A3A] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('scripts')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
            activeSubTab === 'scripts'
              ? 'bg-amber-400 text-black shadow-sm'
              : 'bg-[#121622] text-slate-300 hover:bg-[#1A2030] hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Active Scripts ({settings.customScripts.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('header_js')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
            activeSubTab === 'header_js'
              ? 'bg-amber-400 text-black shadow-sm'
              : 'bg-[#121622] text-slate-300 hover:bg-[#1A2030] hover:text-white'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Global Header JS (&lt;head&gt;)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('footer_js')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
            activeSubTab === 'footer_js'
              ? 'bg-amber-400 text-black shadow-sm'
              : 'bg-[#121622] text-slate-300 hover:bg-[#1A2030] hover:text-white'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Global Footer JS (&lt;/body&gt;)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('templates')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
            activeSubTab === 'templates'
              ? 'bg-amber-400 text-black shadow-sm'
              : 'bg-[#121622] text-slate-300 hover:bg-[#1A2030] hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Snippet Library & Presets</span>
        </button>

        <button
          onClick={() => setActiveSubTab('console')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
            activeSubTab === 'console'
              ? 'bg-amber-400 text-black shadow-sm'
              : 'bg-[#121622] text-slate-300 hover:bg-[#1A2030] hover:text-white'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Execution Console Logs ({executionLogs.length})</span>
        </button>
      </div>

      {/* Sub-Tab 1: Active Custom Scripts Manager */}
      {activeSubTab === 'scripts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Managed JavaScript Code Snippets
            </h4>
            <button
              onClick={() => setIsAddingScript(!isAddingScript)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingScript ? 'Close Form' : '+ Add Custom Script'}</span>
            </button>
          </div>

          {/* Add Script Form */}
          {isAddingScript && (
            <form onSubmit={handleAddScript} className="bg-[#0E121B] border border-amber-400/40 rounded-xl p-5 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-[#222A3A] pb-3">
                <h5 className="font-bold text-white text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Create / Paste New JavaScript Snippet</span>
                </h5>
                <span className="text-[11px] font-mono text-slate-400">Pure JS or &lt;script&gt; tags</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Script Name / Purpose:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google AdSense Init / TikTok Pixel / WhatsApp Popup"
                    value={newScript.name}
                    onChange={(e) => setNewScript({ ...newScript, name: e.target.value })}
                    className="w-full bg-[#161B26] border border-[#2A344A] text-white text-xs px-3 py-2.5 rounded-lg outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Execution Target / Placement:</label>
                  <select
                    value={newScript.placement}
                    onChange={(e) => setNewScript({ ...newScript, placement: e.target.value as 'head' | 'body_end' })}
                    className="w-full bg-[#161B26] border border-[#2A344A] text-white text-xs px-3 py-2.5 rounded-lg outline-none focus:border-amber-400"
                  >
                    <option value="head">Header (&lt;head&gt; - Early Initialization)</option>
                    <option value="body_end">Footer (&lt;body&gt; End - After UI Load)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">JavaScript Code / Snippet:</label>
                <textarea
                  required
                  rows={8}
                  placeholder="// Paste your JavaScript here or <script>...</script>"
                  value={newScript.code}
                  onChange={(e) => setNewScript({ ...newScript, code: e.target.value })}
                  className="w-full bg-[#080B10] border border-[#2A344A] text-amber-300 font-mono text-xs p-3.5 rounded-lg outline-none focus:border-amber-400 resize-y"
                  spellCheck={false}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Developer Notes (Optional):</label>
                <input
                  type="text"
                  placeholder="Notes about what this script does..."
                  value={newScript.notes}
                  onChange={(e) => setNewScript({ ...newScript, notes: e.target.value })}
                  className="w-full bg-[#161B26] border border-[#2A344A] text-slate-300 text-xs px-3 py-2 rounded-lg outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingScript(false)}
                  className="px-4 py-2 bg-[#1C2230] text-slate-300 hover:text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleTestRunCode(newScript.code, newScript.name || 'New Script')}
                  className="px-4 py-2 bg-[#252E42] text-amber-300 hover:bg-[#2F3B54] rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  <span>Test Run in Browser</span>
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-black font-extrabold rounded-lg text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save & Inject Script</span>
                </button>
              </div>
            </form>
          )}

          {/* List of Existing Scripts */}
          <div className="space-y-3">
            {settings.customScripts.length === 0 ? (
              <div className="bg-[#0E121B] border border-[#222A3A] rounded-xl p-8 text-center text-slate-400 space-y-2">
                <Code2 className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-sm font-bold text-slate-300">No Custom Scripts Added Yet</p>
                <p className="text-xs">Click "+ Add Custom Script" or select a preset from the Snippet Library to add tracking tags.</p>
              </div>
            ) : (
              settings.customScripts.map((script) => (
                <div 
                  key={script.id}
                  className={`bg-[#0E121B] border rounded-xl p-4 transition-all ${
                    script.isEnabled ? 'border-[#273248]' : 'border-[#1C2230] opacity-60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleScript(script.id)}
                        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                          script.isEnabled ? 'bg-amber-400' : 'bg-slate-700'
                        }`}
                        title={script.isEnabled ? 'Active - Click to Disable' : 'Disabled - Click to Enable'}
                      >
                        <span className={`block w-4 h-4 rounded-full bg-black transition-transform ${
                          script.isEnabled ? 'translate-x-4' : 'translate-x-0.5'
                        }`} />
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm font-sans">{script.name}</span>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.2 rounded bg-[#1A2230] text-slate-300 border border-[#2C374E]">
                            {script.placement === 'head' ? '<head>' : '<body>'}
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.2 rounded font-bold ${
                            script.isEnabled ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {script.isEnabled ? 'ACTIVE' : 'OFF'}
                          </span>
                        </div>
                        {script.notes && <p className="text-[11px] text-slate-400 mt-0.5">{script.notes}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleTestRunCode(script.code, script.name)}
                        className="px-3 py-1.5 bg-[#1B2232] hover:bg-[#263148] text-amber-300 border border-[#2C374E] rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Execute this script now to test"
                      >
                        <Play className="w-3 h-3" />
                        <span>Run Test</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteScript(script.id)}
                        className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Script"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Code snippet preview */}
                  <div className="bg-[#080A0F] border border-[#1E2536] rounded-lg p-3 overflow-x-auto max-h-36 font-mono text-[11px] text-amber-300/90 whitespace-pre scrollbar-thin">
                    {script.code}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Global Header JS */}
      {activeSubTab === 'header_js' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white">Global &lt;head&gt; JavaScript Editor</h4>
              <p className="text-xs text-slate-400">
                This code runs in the global head context. Perfect for meta tags, global config objects, and initialization variables.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleTestRunCode(settings.globalHeaderJs, 'Global Header JS')}
              className="px-3 py-1.5 bg-[#1B2232] hover:bg-[#263148] text-amber-300 border border-[#2C374E] rounded-lg text-xs font-mono flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Test Header Code</span>
            </button>
          </div>

          <textarea
            rows={14}
            value={settings.globalHeaderJs}
            onChange={(e) => setSettings({ ...settings, globalHeaderJs: e.target.value })}
            className="w-full bg-[#080B10] border border-[#2A344A] text-amber-300 font-mono text-xs p-4 rounded-xl outline-none focus:border-amber-400 resize-y"
            placeholder="// Add any custom JavaScript to execute in <head>..."
            spellCheck={false}
          />
        </div>
      )}

      {/* Sub-Tab 3: Global Footer JS */}
      {activeSubTab === 'footer_js' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white">Global &lt;body&gt; Footer JavaScript Editor</h4>
              <p className="text-xs text-slate-400">
                This code runs after the DOM is fully rendered before &lt;/body&gt;. Great for UI listeners and event handlers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleTestRunCode(settings.globalFooterJs, 'Global Footer JS')}
              className="px-3 py-1.5 bg-[#1B2232] hover:bg-[#263148] text-amber-300 border border-[#2C374E] rounded-lg text-xs font-mono flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Test Footer Code</span>
            </button>
          </div>

          <textarea
            rows={14}
            value={settings.globalFooterJs}
            onChange={(e) => setSettings({ ...settings, globalFooterJs: e.target.value })}
            className="w-full bg-[#080B10] border border-[#2A344A] text-amber-300 font-mono text-xs p-4 rounded-xl outline-none focus:border-amber-400 resize-y"
            placeholder="// Add any custom JavaScript to execute before </body>..."
            spellCheck={false}
          />
        </div>
      )}

      {/* Sub-Tab 4: Snippet Library & Templates */}
      {activeSubTab === 'templates' && (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white">Popular Tracking & Ad Templates</h4>
            <p className="text-xs text-slate-400">
              Click "Use Template" to auto-fill the custom script form with ready-to-use snippets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SCRIPT_TEMPLATES.map((tmpl) => (
              <div key={tmpl.name} className="bg-[#0E121B] border border-[#222A3A] rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{tmpl.name}</span>
                    <span className="text-[10px] font-mono uppercase bg-[#1B2232] text-amber-400 px-2 py-0.5 rounded border border-[#2C374E]">
                      {tmpl.placement}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{tmpl.description}</p>
                </div>

                <div className="bg-[#080A0F] p-2.5 rounded border border-[#1A2030] text-[10px] font-mono text-slate-400 overflow-hidden max-h-24">
                  <code>{tmpl.code.slice(0, 160)}...</code>
                </div>

                <button
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="w-full py-2 bg-amber-400/10 hover:bg-amber-400 text-amber-400 hover:text-black font-bold text-xs rounded-lg transition-colors border border-amber-400/30 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Use This Snippet</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 5: Console Execution Logs */}
      {activeSubTab === 'console' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-400" />
              <span>Browser Runtime Execution History</span>
            </h4>
            <span className="text-xs text-slate-400 font-mono">Live diagnostics</span>
          </div>

          <div className="bg-[#080B10] border border-[#222A3A] rounded-xl p-4 space-y-2 max-h-80 overflow-y-auto font-mono text-xs">
            {executionLogs.length === 0 ? (
              <p className="text-slate-500 italic">No script execution logs recorded in this session yet.</p>
            ) : (
              executionLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-3 py-1.5 border-b border-[#141924]">
                  <span className="text-slate-500 shrink-0 text-[10px]">{log.timestamp}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold shrink-0 ${
                    log.status === 'success' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                  }`}>
                    {log.status}
                  </span>
                  <span className="text-slate-300 font-bold shrink-0">[{log.source}]:</span>
                  <span className={log.status === 'success' ? 'text-slate-400' : 'text-rose-300 font-semibold'}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
};
