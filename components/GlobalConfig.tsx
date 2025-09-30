import React, { useState } from 'react';
import { type GlobalConfigState, InputType } from '../types';
import { MODELS, ASPECT_RATIOS } from '../constants';
import { SaveIcon } from './icons';

interface GlobalConfigProps {
  config: GlobalConfigState;
  setConfig: React.Dispatch<React.SetStateAction<GlobalConfigState>>;
  onSave: () => void;
}

const GlobalConfig: React.FC<GlobalConfigProps> = ({ config, setConfig, onSave }) => {
  const [saveButtonText, setSaveButtonText] = useState('Save Configuration');

  const handleConfigChange = <K extends keyof GlobalConfigState>(key: K, value: GlobalConfigState[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleConfigChange('imageFile', e.target.files[0]);
    } else {
      handleConfigChange('imageFile', undefined);
    }
  };

  const handleSave = () => {
    onSave();
    setSaveButtonText('Saved!');
    setTimeout(() => {
        setSaveButtonText('Save Configuration');
    }, 2500);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-8">
      <h2 className="text-2xl font-bold mb-4 text-cyan-400">Global Job Configuration</h2>
      <p className="text-sm text-gray-400 mb-6">These settings will apply to all jobs submitted in the next batch.</p>
      
      {/* Authentication Section */}
      <div className="border-t border-gray-700 pt-6 mb-6">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-200">Authentication</h3>
            <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm"
            >
                <SaveIcon className="w-5 h-5" />
                {saveButtonText}
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Google AI API Key</label>
                <input
                    type="password"
                    placeholder="Enter your API key to use your own quota"
                    value={config.apiKey || ''}
                    onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-mono text-sm"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Veo 3 Flow Cookie (Optional)</label>
                <textarea
                  placeholder="Paste your full cookie string for downloads"
                  value={config.veoCookie || ''}
                  onChange={(e) => handleConfigChange('veoCookie', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-mono text-xs"
                  rows={3}
                />
            </div>
        </div>
      </div>
      
      {/* Generation Settings Section */}
      <h3 className="text-lg font-semibold text-gray-200 mb-4">Generation Settings</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Input Type</label>
          <select
            value={config.inputType}
            onChange={(e) => handleConfigChange('inputType', e.target.value as InputType)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          >
            {Object.values(InputType).map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Model</label>
          <select
            value={config.model}
            onChange={(e) => handleConfigChange('model', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          >
            {MODELS.map(model => <option key={model} value={model}>{model}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Aspect Ratio</label>
          <select
            value={config.aspectRatio}
            onChange={(e) => handleConfigChange('aspectRatio', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          >
            {ASPECT_RATIOS.map(ratio => <option key={ratio} value={ratio}>{ratio}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Outputs</label>
          <input
            type="number"
            min="1"
            max="4"
            value={config.outputCount}
            onChange={(e) => handleConfigChange('outputCount', parseInt(e.target.value, 10))}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          />
        </div>

        {config.inputType === InputType.Image && (
          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">Upload Image (for all jobs)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalConfig;