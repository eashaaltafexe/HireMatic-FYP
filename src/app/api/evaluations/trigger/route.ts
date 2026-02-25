import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

/**
 * POST /api/evaluations/trigger
 * Manually trigger the evaluation script
 */
export async function POST() {
  try {
    console.log('🎯 [Manual Trigger] Starting evaluation script...');
    
    const scriptPath = path.resolve(process.cwd(), 'scripts', 'auto_evaluate_and_report.py');
    console.log('📝 [Manual Trigger] Script path:', scriptPath);
    
    const python = spawn('python', [scriptPath]);
    
    let output = '';
    let errorOutput = '';
    
    python.stdout.on('data', (data: Buffer) => {
      const text = data.toString();
      output += text;
      console.log('[Manual Trigger] 📊', text.trim());
    });
    
    python.stderr.on('data', (data: Buffer) => {
      const text = data.toString();
      errorOutput += text;
      console.error('[Manual Trigger] ⚠️', text.trim());
    });
    
    // Return immediately, script runs in background
    python.on('spawn', () => {
      console.log('✅ [Manual Trigger] Evaluation script started successfully');
    });
    
    python.on('error', (err: Error) => {
      console.error('❌ [Manual Trigger] Failed to spawn Python process:', err.message);
    });
    
    return NextResponse.json({
      success: true,
      message: 'Evaluation script triggered successfully. Check server logs for progress.',
      scriptPath: scriptPath
    });
    
  } catch (error) {
    console.error('❌ [Manual Trigger] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to trigger evaluation'
    }, { status: 500 });
  }
}
