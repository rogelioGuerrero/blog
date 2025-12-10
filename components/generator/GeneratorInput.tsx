import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  FileText, 
  Upload, 
  ChevronDown, 
  ChevronUp,
  X,
  Loader2
} from 'lucide-react';
import {
  GeneratorInputMode,
  GeneratorLanguage,
  ArticleLength,
  GeneratorAdvancedSettings,
  UploadedFile,
  LENGTHS,
  LANGUAGES,
  PLACEHOLDERS,
  DEFAULT_ADVANCED_SETTINGS
} from '../../services/generator';

interface GeneratorInputProps {
  onGenerate: (
    input: string,
    mode: GeneratorInputMode,
    file: UploadedFile | null,
    language: GeneratorLanguage,
    length: ArticleLength,
    settings: GeneratorAdvancedSettings
  ) => void;
  isGenerating: boolean;
  statusMessage: string;
}

export const GeneratorInput: React.FC<GeneratorInputProps> = ({
  onGenerate,
  isGenerating,
  statusMessage
}) => {
  const [inputMode, setInputMode] = useState<GeneratorInputMode>('topic');
  const [inputValue, setInputValue] = useState('');
  const [placeholderText, setPlaceholderText] = useState(PLACEHOLDERS[0]);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<GeneratorLanguage>('es');
  const [selectedLength, setSelectedLength] = useState<ArticleLength>('medium');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedSettings, setAdvancedSettings] = useState<GeneratorAdvancedSettings>(DEFAULT_ADVANCED_SETTINGS);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % PLACEHOLDERS.length;
      setPlaceholderText(PLACEHOLDERS[idx]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert("El archivo es demasiado grande (Máx 4MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = (evt.target?.result as string).split(',')[1];
      setSelectedFile({ data: base64, mimeType: file.type, name: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (inputMode === 'topic' && !inputValue.trim()) return;
    if (inputMode === 'document' && !selectedFile) return;
    onGenerate(inputValue, inputMode, selectedFile, selectedLanguage, selectedLength, advancedSettings);
  };

  const canSubmit = inputMode === 'topic' ? inputValue.trim().length > 0 : !!selectedFile;

  return (
    <div className="space-y-6">
      {/* Mode Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <button
          onClick={() => setInputMode('topic')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            inputMode === 'topic'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Sparkles size={16} />
          Por Tema
        </button>
        <button
          onClick={() => setInputMode('document')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            inputMode === 'document'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <FileText size={16} />
          Por Documento
        </button>
      </div>

      {/* Input Area */}
      {inputMode === 'topic' ? (
        <div className="space-y-2">
          <label className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
            ¿Sobre qué tema quieres escribir?
          </label>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholderText}
            className="w-full h-28 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
            Sube un documento (PDF, imagen, etc.)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          {selectedFile ? (
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
              <FileText size={24} className="text-indigo-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{selectedFile.name}</p>
                <p className="text-xs text-slate-500">{selectedFile.mimeType}</p>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={16} className="text-slate-400" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors group"
            >
              <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-indigo-500 transition-colors">
                <Upload size={32} />
                <span className="text-sm font-medium">Haz clic para subir</span>
                <span className="text-xs">Máximo 4MB</span>
              </div>
            </button>
          )}
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Instrucciones adicionales (opcional)..."
            className="w-full h-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
          />
        </div>
      )}

      {/* Language & Length */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">Idioma</label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value as GeneratorLanguage)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">Extensión</label>
          <select
            value={selectedLength}
            onChange={(e) => setSelectedLength(e.target.value as ArticleLength)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            {LENGTHS.map(len => (
              <option key={len.code} value={len.code}>{len.label} ({len.desc} palabras)</option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        Opciones avanzadas
      </button>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-4 border border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">Tono</label>
              <select
                value={advancedSettings.tone}
                onChange={(e) => setAdvancedSettings(prev => ({ ...prev, tone: e.target.value as any }))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
              >
                <option value="objective">Objetivo</option>
                <option value="editorial">Editorial</option>
                <option value="corporate">Corporativo</option>
                <option value="narrative">Narrativo</option>
                <option value="explanatory">Explicativo</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">Audiencia</label>
              <select
                value={advancedSettings.audience}
                onChange={(e) => setAdvancedSettings(prev => ({ ...prev, audience: e.target.value as any }))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
              >
                <option value="general">General</option>
                <option value="expert">Expertos</option>
                <option value="investor">Inversores</option>
                <option value="executive">Ejecutivos</option>
                <option value="academic">Académico</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={advancedSettings.includeQuotes}
                onChange={(e) => setAdvancedSettings(prev => ({ ...prev, includeQuotes: e.target.checked }))}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Incluir citas
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={advancedSettings.includeStats}
                onChange={(e) => setAdvancedSettings(prev => ({ ...prev, includeStats: e.target.checked }))}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Incluir estadísticas
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={advancedSettings.verifiedSourcesOnly}
                onChange={(e) => setAdvancedSettings(prev => ({ ...prev, verifiedSourcesOnly: e.target.checked }))}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Solo fuentes verificadas
            </label>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit || isGenerating}
        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 disabled:shadow-none transition-all flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            {statusMessage || 'Generando...'}
          </>
        ) : (
          <>
            <Sparkles size={20} />
            Generar Artículo
          </>
        )}
      </button>
    </div>
  );
};
