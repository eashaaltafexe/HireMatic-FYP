"use client"


import { useState, useEffect } from 'react';

type Evaluation = {
  _id: string;
  position: string;
  company: string;
  date: string;
  interviewer?: string;
  overallScore: number;
  status: string;
  hiringDecision?: string;
  categories?: Array<{ name: string; score: number; maxScore: number; feedback: string }>;
  feedback?: string;
  recommendations?: string[];
  pdfPath?: string;
};

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      console.log('🔍 [Evaluations Page] Fetching evaluations...');
      const res = await fetch('/api/evaluations');
      const data = await res.json();
      console.log('📦 [Evaluations Page] Received', data.length, 'evaluations');
      setEvaluations(data);
    } catch (err) {
      console.error('❌ [Evaluations Page] Error:', err);
      setEvaluations([]);
    }
    setLoading(false);
  };

  const triggerEvaluation = async () => {
    setTriggering(true);
    try {
      console.log('🎯 [Evaluations Page] Triggering evaluation script...');
      const res = await fetch('/api/evaluations/trigger', { method: 'POST' });
      const data = await res.json();
      console.log('📦 [Evaluations Page] Trigger response:', data);
      
      if (data.success) {
        alert('Evaluation script triggered! Results will appear in 1-2 minutes. Click "Refresh" to check.');
      } else {
        alert('Failed to trigger evaluation: ' + data.error);
      }
    } catch (err) {
      console.error('❌ [Evaluations Page] Trigger error:', err);
      alert('Error triggering evaluation. Check console for details.');
    }
    setTriggering(false);
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Evaluation Reports</h1>
          <p className="text-gray-600 mt-1">View your interview and assessment evaluations</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchEvaluations}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : '🔄 Refresh'}
          </button>
          <button
            onClick={triggerEvaluation}
            disabled={triggering}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {triggering ? 'Triggering...' : '⚡ Generate Evaluations'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Evaluations List */}
        <div className="lg:col-span-1 space-y-4">
          {loading ? (
            <div className="bg-white border rounded-lg p-4">
              <p className="text-gray-500">Loading evaluations...</p>
            </div>
          ) : evaluations.length === 0 ? (
            <div className="bg-white border rounded-lg p-6">
              <p className="text-gray-600 mb-4">No evaluations found.</p>
              <p className="text-sm text-gray-500 mb-4">
                If you just completed an interview, click "Generate Evaluations" to process your results.
              </p>
              <button
                onClick={triggerEvaluation}
                disabled={triggering}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {triggering ? 'Processing...' : '⚡ Generate Evaluations'}
              </button>
            </div>
          ) : (
            evaluations.map((evaluation) => (
              <div
                key={evaluation._id}
                className={`bg-white border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedEvaluation?._id === evaluation._id
                    ? 'border-blue-500 shadow-sm'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => setSelectedEvaluation(evaluation)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{evaluation.position}</h3>
                    <p className="text-sm text-gray-600">{evaluation.company}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(evaluation.status)}`}>
                    {evaluation.status}
                  </span>
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs text-gray-500">{evaluation.date}</span>
                  <span className={`text-sm font-medium ${getScoreColor(evaluation.overallScore)}`}>
                    {evaluation.overallScore}/100
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Evaluation Details */}
        <div className="lg:col-span-2">
          {selectedEvaluation ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              {/* Header */}
              <div className="border-b border-gray-200 pb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedEvaluation.position}</h2>
                    <p className="text-gray-600">{selectedEvaluation.company}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedEvaluation.status)}`}>
                    {selectedEvaluation.status}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Evaluation Date:</span>
                    <span className="ml-2">{selectedEvaluation.date}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Interviewer:</span>
                    <span className="ml-2">{selectedEvaluation.interviewer || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Overall Rating */}
              <div className="py-6 border-b border-gray-200">
                <h3 className="text-lg font-medium mb-4">Overall Rating</h3>
                <div className="flex items-center mb-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-blue-500 h-4 rounded-full"
                      style={{ width: `${selectedEvaluation.overallScore}%` }}
                    ></div>
                  </div>
                  <span className={`ml-4 font-medium ${getScoreColor(selectedEvaluation.overallScore)}`}>
                    {selectedEvaluation.overallScore}/100
                  </span>
                </div>
                
                {/* Hiring Decision */}
                {selectedEvaluation.hiringDecision && (
                  <div className={`mt-4 p-4 rounded-lg ${
                    selectedEvaluation.hiringDecision === 'RECOMMENDED' 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center">
                      <span className={`text-lg font-bold ${
                        selectedEvaluation.hiringDecision === 'RECOMMENDED' 
                          ? 'text-green-700' 
                          : 'text-red-700'
                      }`}>
                        {selectedEvaluation.hiringDecision === 'RECOMMENDED' ? '✓' : '✗'} {selectedEvaluation.hiringDecision}
                      </span>
                    </div>
                    <p className={`mt-2 text-sm ${
                      selectedEvaluation.hiringDecision === 'RECOMMENDED' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {selectedEvaluation.hiringDecision === 'RECOMMENDED' 
                        ? `The candidate scored ${selectedEvaluation.overallScore}/100, meeting the minimum threshold of 70. Recommended to proceed to the next round.`
                        : `The candidate scored ${selectedEvaluation.overallScore}/100, which is below the minimum threshold of 70. Not recommended for hire at this time.`
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Category Scores */}
              {selectedEvaluation.categories && (
                <div className="py-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium mb-4">Category Scores</h3>
                  <div className="space-y-4">
                    {selectedEvaluation.categories.map((category, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{category.name}</span>
                          <span className={`${getScoreColor(category.score)}`}>
                            {category.score}/{category.maxScore}
                          </span>
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(category.score / category.maxScore) * 100}%` }}
                          ></div>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{category.feedback}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback */}
              {selectedEvaluation.feedback && (
                <div className="py-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium mb-4">Overall Feedback</h3>
                  <p className="text-gray-600">{selectedEvaluation.feedback}</p>
                </div>
              )}

              {/* Recommendations */}
              {selectedEvaluation.recommendations && (
                <div className="pt-6">
                  <h3 className="text-lg font-medium mb-4">Recommendations</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    {selectedEvaluation.recommendations.map((recommendation, index) => (
                      <li key={index}>{recommendation}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* PDF Download Button */}
              {selectedEvaluation.pdfPath && (
                <div className="pt-6">
                  <a
                    href={"/" + selectedEvaluation.pdfPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg mt-2"
                  >
                    Download Interview Report (PDF)
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm text-center">
              <p className="text-gray-500">Select an evaluation to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

