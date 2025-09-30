import React, { useRef } from 'react';
import { type PendingJobPrompt } from '../types';
import { PlusIcon, TrashIcon, UploadIcon } from './icons';

// Declare XLSX for CDN usage
declare const XLSX: any;

interface JobFormProps {
  pendingPrompts: PendingJobPrompt[];
  setPendingPrompts: React.Dispatch<React.SetStateAction<PendingJobPrompt[]>>;
}

const JobForm: React.FC<JobFormProps> = ({ pendingPrompts, setPendingPrompts }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addJob = () => {
    setPendingPrompts(prev => [...prev, {
      id: `new-${Date.now()}`,
      prompt: '',
    }]);
  };

  const removeJob = (id: string) => {
    setPendingPrompts(prev => prev.filter(job => job.id !== id));
  };

  const updateJobPrompt = (id: string, prompt: string) => {
    setPendingPrompts(prev => prev.map(job => job.id === id ? { ...job, prompt } : job));
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: string[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Start from the second row (index 1) to skip header
        const promptsFromExcel = json.slice(1)
          .map(row => row[1]) // Get prompt from column B
          .filter(prompt => typeof prompt === 'string' && prompt.trim() !== '');

        if (promptsFromExcel.length === 0) {
          alert("No valid prompts found in column B of the Excel file.");
          return;
        }

        const jobsFromExcel: PendingJobPrompt[] = promptsFromExcel.map(prompt => ({
          id: `new-${Date.now()}-${Math.random()}`,
          prompt,
        }));
        
        // Add new jobs from Excel, keeping existing jobs that have prompts
        setPendingPrompts(prev => [
            ...prev.filter(j => j.prompt.trim() !== ''), 
            ...jobsFromExcel
        ]);

      } catch (error) {
        console.error("Error parsing Excel file:", error);
        alert("Failed to parse the Excel file. Please ensure it's a valid .xlsx or .xls file.");
      }
    };
    reader.readAsBinaryString(file);

    // Reset file input to allow uploading the same file again
    e.target.value = '';
  };
  
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-8">
      <h2 className="text-2xl font-bold mb-4 text-cyan-400">Add Prompts</h2>
      <div className="space-y-4">
        {pendingPrompts.map((job) => (
          <div key={job.id} className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-md border border-gray-600">
            <div className="flex-grow">
              <label htmlFor={`prompt-${job.id}`} className="sr-only">Prompt</label>
              <textarea
                id={`prompt-${job.id}`}
                value={job.prompt}
                onChange={(e) => updateJobPrompt(job.id, e.target.value)}
                placeholder={`e.g., A cinematic shot of a futuristic city at night`}
                className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                rows={2}
              />
            </div>
            <button
                onClick={() => removeJob(job.id)}
                className="flex-shrink-0 flex justify-center items-center h-10 w-10 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md transition-colors"
                aria-label="Remove job"
            >
                <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-4">
        <button
          onClick={addJob}
          className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Prompt
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleExcelUpload}
          accept=".xlsx, .xls"
          className="hidden"
          aria-hidden="true"
        />
        <button
          onClick={triggerFileUpload}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
        >
          <UploadIcon className="w-5 h-5" />
          Load from Excel
        </button>
      </div>
    </div>
  );
};

export default JobForm;
