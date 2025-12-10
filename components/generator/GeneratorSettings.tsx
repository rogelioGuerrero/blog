import React, { useEffect, useState } from 'react';
import { X, Key, Globe, ShieldCheck } from 'lucide-react';
import { GeneratorConfig, getRegionPreferredDomains } from '../../services/generator';

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
  const [geminiKey, setGeminiKey] = useState('');
  const [pexelsKey, setPexelsKey] = useState('');
  const [preferredDomains, setPreferredDomains] = useState('');
  const [blockedDomains, setBlockedDomains] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setGeminiKey(initialConfig.geminiApiKey || '');
    setPexelsKey(initialConfig.pexelsApiKey || '');
    setPreferredDomains(formatList(initialConfig.preferredDomains || []));
    setBlockedDomains(formatList(initialConfig.blockedDomains || []));
  }, [isOpen, initialConfig]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      geminiApiKey: geminiKey.trim(),
      pexelsApiKey: pexelsKey.trim(),
      preferredDomains: parseList(preferredDomains),
      blockedDomains: parseList(blockedDomains)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
              <Key size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Configuración del Generador</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Las claves se guardan solo en tu navegador</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <ShieldCheck size={12} /> Gemini API Key
            </span>
            <input 
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
            <p className="text-[10px] text-slate-400">Obtén tu clave en <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">Google AI Studio</a></p>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Globe size={12} /> Pexels API Key
            </span>
            <input 
              type="password"
              value={pexelsKey}
              onChange={(e) => setPexelsKey(e.target.value)}
              placeholder="563492ad6f91700001000001..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
            <p className="text-[10px] text-slate-400">Obtén tu clave en <a href="https://www.pexels.com/api/" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">Pexels API</a></p>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">Dominios Confiables</span>
            <textarea
              value={preferredDomains}
              onChange={(e) => setPreferredDomains(e.target.value)}
              placeholder="Un dominio por línea (ej: bbc.com)"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm h-20 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">Dominios Bloqueados</span>
            <textarea
              value={blockedDomains}
              onChange={(e) => setBlockedDomains(e.target.value)}
              placeholder="Un dominio por línea"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm h-16 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave} 
            className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-lg shadow-indigo-500/25"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};
