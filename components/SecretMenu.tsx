import React from 'react';
import { X, Sparkles, Settings, FileJson, Wand2, Upload, LayoutDashboard } from 'lucide-react';

interface SecretMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGenerator: () => void;
  onSelectAdmin: () => void;
}

export const SecretMenu: React.FC<SecretMenuProps> = ({
  isOpen,
  onClose,
  onSelectGenerator,
  onSelectAdmin
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <h2 className="text-xl font-bold">Panel de Control</h2>
          </div>
          <p className="text-white/80 text-sm">
            Selecciona una opción para continuar
          </p>
        </div>

        {/* Options */}
        <div className="p-6 space-y-4">
          {/* Generator Option */}
          <button
            onClick={onSelectGenerator}
            className="w-full group relative overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-xl p-5 text-left hover:border-indigo-400 dark:hover:border-indigo-400 transition-all hover:shadow-lg hover:shadow-indigo-500/10"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                <Wand2 size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1 flex items-center gap-2">
                  Generador con IA
                  <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase rounded-full">
                    Nuevo
                  </span>
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Crea artículos completos con inteligencia artificial. Incluye texto, imágenes y audio.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-500 dark:text-slate-400">
                    Gemini AI
                  </span>
                  <span className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-500 dark:text-slate-400">
                    Pexels Media
                  </span>
                  <span className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-500 dark:text-slate-400">
                    Multi-idioma
                  </span>
                </div>
              </div>
            </div>
          </button>

          {/* Admin Option */}
          <button
            onClick={onSelectAdmin}
            className="w-full group relative overflow-hidden bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5 text-left hover:border-slate-400 dark:hover:border-slate-500 transition-all hover:shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-slate-700 dark:bg-slate-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                <LayoutDashboard size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">
                  Panel de Administración
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Importa artículos JSON, configura el sitio y gestiona el contenido existente.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <FileJson size={12} />
                    Importar JSON
                  </span>
                  <span className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Settings size={12} />
                    Configuración
                  </span>
                  <span className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Upload size={12} />
                    Gestión
                  </span>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <p className="text-center text-xs text-slate-400 dark:text-slate-500">
            Acceso restringido • Solo administradores autorizados
          </p>
        </div>
      </div>
    </div>
  );
};
