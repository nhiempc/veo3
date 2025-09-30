import React, { useState, useEffect } from 'react';
import { type Job, JobStatus } from '../types';
import { DownloadIcon, RetryIcon, TrashIcon } from './icons';
import { LOADING_MESSAGES } from '../constants';

interface JobQueueProps {
  jobs: Job[];
  onRetry: (jobId: string) => void;
  onDelete: (jobId: string) => void;
}

const getStatusColor = (status: JobStatus) => {
  switch (status) {
    case JobStatus.Pending:
      return 'bg-gray-500';
    case JobStatus.Processing:
      return 'bg-blue-500 animate-pulse';
    case JobStatus.Success:
      return 'bg-green-500';
    case JobStatus.Failed:
      return 'bg-red-500';
    default:
      return 'bg-gray-600';
  }
};

const LoadingMessage: React.FC = () => {
    const [message, setMessage] = useState(LOADING_MESSAGES[0]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
        }, 3000);
        return () => clearInterval(intervalId);
    }, []);

    return <span className="text-sm text-gray-400">{message}</span>;
}

const JobRow: React.FC<{ job: Job; index: number; onRetry: (jobId: string) => void; onDelete: (jobId: string) => void; }> = ({ job, index, onRetry, onDelete }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700">
      <div className="grid grid-cols-12 gap-4 items-center">
        <div className="col-span-12 md:col-span-4 flex items-start gap-3">
          <span className="font-bold text-gray-400 pt-1 select-none">{index + 1}.</span>
          <div className="w-full min-w-0">
            <p className="font-mono text-sm text-cyan-400 truncate" title={job.prompt}>{job.prompt}</p>
            <p className="text-xs text-gray-400">{job.model} | {job.aspectRatio} | {job.inputType}</p>
          </div>
        </div>
        <div className="col-span-6 md:col-span-2">
            <span className={`px-3 py-1 text-xs font-semibold text-white rounded-full ${getStatusColor(job.status)}`}>
                {job.status}
            </span>
        </div>
        <div className="col-span-6 md:col-span-4">
          {job.status === JobStatus.Processing && <LoadingMessage />}
          {job.status === JobStatus.Failed && <p className="text-sm text-red-400 truncate" title={job.error}>{job.error}</p>}
          {job.status === JobStatus.Success && job.resultUrl && (
            <video controls src={job.resultUrl} className="w-full max-h-48 rounded-md" />
          )}
        </div>
        <div className="col-span-12 md:col-span-2 flex justify-end space-x-2">
          {job.status === JobStatus.Failed && (
            <button
              onClick={() => onRetry(job.id)}
              className="p-2 bg-yellow-500 hover:bg-yellow-600 rounded-md text-white transition-colors"
              title="Retry Job"
            >
              <RetryIcon className="w-5 h-5" />
            </button>
          )}
          {job.status === JobStatus.Success && job.resultUrl && (
            <a
              href={job.resultUrl}
              download={`video_${job.id}.mp4`}
              className="p-2 bg-green-500 hover:bg-green-600 rounded-md text-white transition-colors"
              title="Download Video"
            >
              <DownloadIcon className="w-5 h-5" />
            </a>
          )}
           <button
              onClick={() => onDelete(job.id)}
              className="p-2 bg-red-600 hover:bg-red-700 rounded-md text-white transition-colors"
              title="Delete Job"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};

const JobQueue: React.FC<JobQueueProps> = ({ jobs, onRetry, onDelete }) => {
  if (jobs.length === 0) {
    return (
        <div className="text-center py-10 bg-gray-800 rounded-lg">
            <p className="text-gray-400">No jobs submitted yet. Add jobs above to start.</p>
        </div>
    );
  }

  return (
    <div className="space-y-3">
        {jobs.map((job, index) => (
            <JobRow key={job.id} job={job} index={index} onRetry={onRetry} onDelete={onDelete} />
        ))}
    </div>
  );
};

export default JobQueue;