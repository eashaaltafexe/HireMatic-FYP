import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { jwtVerify } from 'jose';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Helper function to verify token using jose (consistent with token creation)
const verifyToken = async (token: string): Promise<JwtPayload | null> => {
  const secret = process.env.JWT_SECRET || 'your_default_secret_change_this';
  
  if (!secret) {
    console.error('JWT_SECRET is not defined in environment variables');
    return null;
  }

  try {
    console.log('Upload API - Verifying token:', token.substring(0, 20) + '...');
    const encoder = new TextEncoder();
    const { payload } = await jwtVerify(token, encoder.encode(secret));
    
    // Convert payload to our expected format
    const jwtPayload = payload as any;
    console.log('Upload API - Token decoded successfully:', { userId: jwtPayload.userId, role: jwtPayload.role });
    
    return {
      userId: jwtPayload.userId,
      email: jwtPayload.email,
      role: jwtPayload.role,
      iat: jwtPayload.iat,
      exp: jwtPayload.exp
    };
  } catch (error) {
    console.error('Upload API - Token verification error:', error);
    return null;
  }
};

export async function POST(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    console.log('Upload API - Auth header present:', !!authHeader);
    console.log('Upload API - Auth header starts with Bearer:', authHeader?.startsWith('Bearer '));
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Upload API - Missing or invalid authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    console.log('Upload API - Extracted token:', token.substring(0, 20) + '...');
    const decoded = await verifyToken(token);

    if (!decoded || !decoded.userId) {
      console.log('Upload API - Token verification failed');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is candidate
    if (decoded.role !== 'candidate') {
      console.log('Upload API - User role is not candidate:', decoded.role);
      return NextResponse.json({ error: 'Only candidates can upload files' }, { status: 403 });
    }

    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomId}-${file.name}`;
    const filePath = join(uploadsDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return file information
    const fileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      url: `/uploads/${fileName}`,
      uploadDate: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      file: fileInfo,
      message: 'File uploaded successfully'
    });

  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}
