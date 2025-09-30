import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { type Job, JobStatus, type PendingJobPrompt, InputType, type GlobalConfigState } from './types';
import GlobalConfig from './components/GlobalConfig';
import JobForm from './components/JobForm';
import JobQueue from './components/JobQueue';
import { generateVideo } from './services/geminiService';
import { MAX_CONCURRENCY, MODELS, ASPECT_RATIOS } from './constants';
import { DownloadIcon } from './components/icons';

// Declare JSZip for use with CDN
declare const JSZip: any;

const CONFIG_STORAGE_KEY = 'geminiVideoGeneratorConfig';

const App: React.FC = () => {
  const [pendingPrompts, setPendingPrompts] = useState<PendingJobPrompt[]>([
    { id: `new-${Date.now()}`, prompt: '' }
  ]);
  const [globalConfig, setGlobalConfig] = useState<GlobalConfigState>({
    inputType: InputType.Text,
    model: MODELS[0],
    aspectRatio: ASPECT_RATIOS[1],
    outputCount: 1,
    imageFile: undefined,
    veoCookie: '',
    apiKey: '',
  });
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  
  // Load config from localStorage on initial render
  useEffect(() => {
    const savedConfigJSON = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (savedConfigJSON) {
        try {
            const savedConfig = JSON.parse(savedConfigJSON);
            // Don't restore the file object, it's not serializable
            delete savedConfig.imageFile;
            setGlobalConfig(prev => ({ ...prev, ...savedConfig }));
        } catch (error) {
            console.error("Failed to load configuration from localStorage", error);
        }
    }
  }, []);

  const processJob = useCallback(async (jobToProcess: Job) => {
    setJobs(prevJobs =>
      prevJobs.map(job =>
        job.id === jobToProcess.id ? { ...job, status: JobStatus.Processing } : job
      )
    );

    try {
      const resultUrl = await generateVideo(jobToProcess);

      setJobs(prevJobs =>
        prevJobs.map(job =>
          job.id === jobToProcess.id ? { ...job, status: JobStatus.Success, resultUrl } : job
        )
      );
    } catch (error: any) {
      console.error(`Error processing job ${jobToProcess.id}:`, error);
      setJobs(prevJobs =>
        prevJobs.map(job =>
          job.id === jobToProcess.id ? { ...job, status: JobStatus.Failed, error: error.message } : job
        )
      );
    }
  }, []);

  useEffect(() => {
    const processingJobs = jobs.filter(job => job.status === JobStatus.Processing).length;
    const pendingJobs = jobs.filter(job => job.status === JobStatus.Pending);
    
    if (processingJobs < MAX_CONCURRENCY && pendingJobs.length > 0) {
      const jobsToStartCount = Math.min(MAX_CONCURRENCY - processingJobs, pendingJobs.length);
      for (let i = 0; i < jobsToStartCount; i++) {
        processJob(pendingJobs[i]);
      }
    }
  }, [jobs, processJob]);


  const handleSubmit = () => {
    if (globalConfig.inputType === InputType.Image && !globalConfig.imageFile) {
        alert("Please upload an image for the Image to Video input type.");
        return;
    }
      
    const jobsToSubmit: Job[] = pendingPrompts
        .filter(p => p.prompt.trim() !== '')
        .map(p => ({
            ...globalConfig,
            id: `job-${Date.now()}-${Math.random()}`,
            prompt: p.prompt,
            status: JobStatus.Pending,
        }));

    if (jobsToSubmit.length === 0) {
        alert("Please add at least one prompt.");
        return;
    }

    setJobs(prev => [...prev, ...jobsToSubmit]);
    setPendingPrompts([{ id: `new-${Date.now()}`, prompt: ''}]);
    // Optional: reset image file after submission if desired
    // setGlobalConfig(prev => ({...prev, imageFile: undefined}));
  };

  const handleRetry = (jobId: string) => {
    setJobs(prev =>
      prev.map(job =>
        job.id === jobId ? { ...job, status: JobStatus.Pending, error: undefined, resultUrl: undefined } : job
      )
    );
  };
  
  const handleDeleteJob = (jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
  };

  const handleSaveConfig = () => {
    try {
        const configToSave = { ...globalConfig };
        // Don't save the file object to localStorage
        delete configToSave.imageFile;
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(configToSave));
    } catch (error) {
        console.error("Failed to save configuration to localStorage", error);
    }
  };

  const handleDownloadAll = async () => {
    setIsDownloadingAll(true);
    const successfulJobsWithIndex = jobs
      .map((job, index) => ({ job, index }))
      .filter(({ job }) => job.status === JobStatus.Success && job.resultUrl);

    if (successfulJobsWithIndex.length === 0) {
      setIsDownloadingAll(false);
      return;
    }

    try {
      const zip = new JSZip();
      
      await Promise.all(
        successfulJobsWithIndex.map(async ({ job, index }) => {
          const response = await fetch(job.resultUrl!);
          const blob = await response.blob();
          
          const paddedIndex = String(index + 1).padStart(2, '0');
          const safePrompt = job.prompt.substring(0, 30).replace(/[^a-z0-9]/gi, '_');
          const filename = `${paddedIndex}_${safePrompt}.mp4`;
          
          zip.file(filename, blob);
        })
      );
      
      const content = await zip.generateAsync({ type: "blob" });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = "gemini_videos.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (error) {
      console.error("Error creating zip file:", error);
      alert("Failed to download all videos.");
    } finally {
      setIsDownloadingAll(false);
    }
  };
  
  const successfulJobCount = useMemo(() => jobs.filter(j => j.status === JobStatus.Success).length, [jobs]);

  return (
    <div className="container mx-auto p-4 md:p-8 font-sans">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500">
          Gemini Bulk Video Generator
        </h1>
        <p className="text-gray-400 mt-2">Create multiple videos with custom prompts and settings in a single batch.</p>
      </header>

      <main>
        <GlobalConfig config={globalConfig} setConfig={setGlobalConfig} onSave={handleSaveConfig} />
        <JobForm pendingPrompts={pendingPrompts} setPendingPrompts={setPendingPrompts} />
        
        <div className="flex justify-center mb-8">
            <button
                onClick={handleSubmit}
                disabled={pendingPrompts.every(j => j.prompt.trim() === '')}
                className="w-full md:w-1/2 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
                Submit All Jobs to Queue
            </button>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-cyan-400">Job Queue</h2>
                <button
                    onClick={handleDownloadAll}
                    disabled={successfulJobCount === 0 || isDownloadingAll}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <DownloadIcon className="w-5 h-5"/>
                    {isDownloadingAll ? 'Zipping...' : `Download All (${successfulJobCount})`}
                </button>
            </div>
            <JobQueue jobs={jobs} onRetry={handleRetry} onDelete={handleDeleteJob} />
        </div>
      </main>
    </div>
  );
};

export default App;