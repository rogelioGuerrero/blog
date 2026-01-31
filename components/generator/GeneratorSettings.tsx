import React, { useEffect, useState } from 'react';
import { X, Key, Globe, ShieldCheck, Cpu, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { GeneratorConfig, getRegionPreferredDomains, AIProvider, AIModelRole, AI_MODELS } from '../../services/generator';

interface GeneratorSettingsProps {
  isOpen: boolean;
  initialConfig: GeneratorConfig;
  onClose: () => void;
  onSave: (config: GeneratorConfig) => void;
}

const parseList = (value: string) => value
  .split(/\n|,/)
  .map(item => item.trim())
  .filter(Boolean);

const formatList = (items: string[]) => items.join('\n');

export const GeneratorSettings: React.FC<GeneratorSettingsProps> = ({ 
  isOpen, 
  initialConfig, 
  onClose, 
  onSave 
}) => {
  const [activeProvider, setActiveProvider] = useState<AIProvider>('gemini');
  const [geminiKey, setGeminiKey] = useState('');
  const [deepseekKey, setDeepseekKey] = useState('');
  const [pexelsKey, setPexelsKey] = useState('');
  const [newsKey, setNewsKey] = useState('');
  const [preferredDomains, setPreferredDomains] = useState('');
  const [blockedDomains, setBlockedDomains] = useState('');
  const [modelOverrides, setModelOverrides] = useState<GeneratorConfig['modelOverrides']>({});
  const [activeTab, setActiveTab] = useState<'ai' | 'content'>('ai');

  useEffect(() => {
    if (!isOpen) return;
    setActiveProvider(initialConfig.activeProvider || 'gemini');
    setGeminiKey(initialConfig.geminiApiKey || '');
    setDeepseekKey(initialConfig.deepseekApiKey || '');
    setPexelsKey(initialConfig.pexelsApiKey || '');
    setNewsKey(initialConfig.newsApiKey || '');
    setPreferredDomains(formatList(initialConfig.preferredDomains || []));
    setBlockedDomains(formatList(initialConfig.blockedDomains || []));
    setModelOverrides(initialConfig.modelOverrides || {});
  }, [isOpen, initialConfig]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      activeProvider,
      geminiApiKey: geminiKey.trim(),
      deepseekApiKey: deepseekKey.trim(),
      pexelsApiKey: pexelsKey.trim(),
      newsApiKey: newsKey.trim(),
      preferredDomains: parseList(preferredDomains),
      blockedDomains: parseList(blockedDomains),
      modelOverrides
    });
  };

  const updateModelOverride = (provider: AIProvider, role: AIModelRole, value: string) => {
    setModelOverrides(prev => ({
      ...prev,
      [provider]: {
        ...(prev?.[provider] || {}),
        [role]: value
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Settings2 size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Configuración</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Gestión de proveedores y modelos</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-hidden flex flex-col">
          {/* Tabs Navigation */}
          <div className="flex px-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
            <button 
              onClick={() => setActiveTab('ai')}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
                activeTab === 'ai' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              Proveedores e IA
            </button>
            <button 
              onClick={() => setActiveTab('content')}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
                activeTab === 'content' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              Contenido y Filtros
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
            {activeTab === 'ai' ? (
              <section className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-200">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Cpu size={16} className="text-indigo-500" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Configuración de IA</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Proveedor Activo</label>
                      <select 
                        value={activeProvider}
                        onChange={(e) => setActiveProvider(e.target.value as AIProvider)}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer font-medium"
                      >
                        <option value="gemini">Google Gemini</option>
                        <option value="deepseek">DeepSeek AI</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <label className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                            <ShieldCheck size={13} className="text-slate-400" /> Gemini Key
                          </label>
                          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-500 hover:underline font-bold uppercase tracking-tighter">Obtener</a>
                        </div>
                        <input 
                          type="password"
                          value={geminiKey}
                          onChange={(e) => setGeminiKey(e.target.value)}
                          placeholder="AIza..."
                          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <label className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                            <ShieldCheck size={13} className="text-slate-400" /> DeepSeek Key
                          </label>
                          <a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-500 hover:underline font-bold uppercase tracking-tighter">Obtener</a>
                        </div>
                        <input 
                          type="password"
                          value={deepseekKey}
                          onChange={(e) => setDeepseekKey(e.target.value)}
                          placeholder="sk-..."
                          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {activeProvider === 'gemini' && (
                    <div className="pt-2">
                      <div className="p-4 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100/50 dark:border-indigo-500/10 space-y-4">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">Gestión de Modelos</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase px-1">Texto</label>
                            <input 
                              type="text"
                              value={modelOverrides?.gemini?.[AIModelRole.TEXT] || AI_MODELS.gemini[AIModelRole.TEXT]}
                              onChange={(e) => updateModelOverride('gemini', AIModelRole.TEXT, e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500 transition-colors"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase px-1">Audio</label>
                            <input 
                              type="text"
                              value={modelOverrides?.gemini?.[AIModelRole.AUDIO] || AI_MODELS.gemini[AIModelRole.AUDIO]}
                              onChange={(e) => updateModelOverride('gemini', AIModelRole.AUDIO, e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500 transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            ) : (
              <section className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-200">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe size={16} className="text-indigo-500" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Contenido y Media</h4>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                          <ShieldCheck size={13} /> NewsAPI Key
                        </label>
                        <a href="https://newsapi.org/register" target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-500 hover:underline font-bold uppercase tracking-tighter">Obtener</a>
                      </div>
                      <input 
                        type="password"
                        value={newsKey}
                        onChange={(e) => setNewsKey(e.target.value)}
                        placeholder="..."
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase px-1 flex items-center gap-1.5">
                        <ShieldCheck size={13} /> Pexels API Key
                      </label>
                      <input 
                        type="password"
                        value={pexelsKey}
                        onChange={(e) => setPexelsKey(e.target.value)}
                        placeholder="5634..."
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase px-1">Dominios Confiables</label>
                      <textarea
                        value={preferredDomains}
                        onChange={(e) => setPreferredDomains(e.target.value)}
                        placeholder="Un dominio por línea (ej: bbc.com)"
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm h-32 resize-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase px-1">Dominios Bloqueados</label>
                      <textarea
                        value={blockedDomains}
                        onChange={(e) => setBlockedDomains(e.target.value)}
                        placeholder="Un dominio por línea"
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm h-24 resize-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            Cerrar
          </button>
          <button 
            onClick={handleSave} 
            className="px-8 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-500/25 active:scale-95"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
};
