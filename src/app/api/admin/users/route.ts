import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, User } from '@/data-access';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

// Define the JWT payload interface
interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Verify JWT token
async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key');
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JwtPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// GET - Fetch all users with pagination and filtering
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyToken(token);

    if (!decoded || !decoded.userId || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    await dbConnect();

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const department = url.searchParams.get('department') || '';
    const role = url.searchParams.get('role') || '';
    const status = url.searchParams.get('status') || '';

    // Build filter query
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (department && department !== 'All Departments') {
      filter.department = department;
    }

    if (role && role !== 'All Roles') {
      filter.role = role;
    }

    if (status && status !== 'All Status') {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch users with pagination
    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .select('-password') // Exclude password from results
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter)
    ]);

    // Get unique departments and roles for filter options
    const [departments, roles] = await Promise.all([
      User.distinct('department'),
      User.distinct('role')
    ]);

    const totalPages = Math.ceil(totalUsers / limit);

    return NextResponse.json({
      success: true,
      data: {
        users: users.map(user => ({
          _id: user._id,
          name: user.name,
          email: user.email,
          department: user.department || 'Not Assigned',
          role: user.role,
          status: user.status || 'Active',
          createdAt: user.createdAt,
          lastLogin: user.lastLogin || null
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        filters: {
          departments: ['All Departments', ...departments.filter(d => d)],
          roles: ['All Roles', ...roles.filter(r => r)]
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch users'
    }, { status: 500 });
  }
}

// POST - Create new user
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyToken(token);

    if (!decoded || !decoded.userId || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();
    const { name, email, password, department, role, status } = body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json({
        success: false,
        error: 'Name, email, password, and role are required'
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User with this email already exists'
      }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      department: department || 'Not Assigned',
      role,
      status: status || 'Active',
      createdAt: new Date()
    });

    await newUser.save();

    // Return user without password
    const userResponse = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      department: newUser.department,
      role: newUser.role,
      status: newUser.status,
      createdAt: newUser.createdAt
    };

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: { user: userResponse }
    });

  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create user'
    }, { status: 500 });
  }
}

// PUT - Update user
export async function PUT(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyToken(token);

    if (!decoded || !decoded.userId || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();
    const { userId, name, email, department, role, status, password } = body;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Update fields
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (department) updateData.department = department;
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    
    // Hash new password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: '-password' }
    );

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser }
    });

  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update user'
    }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyToken(token);

    if (!decoded || !decoded.userId || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    await dbConnect();

    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    // Prevent admin from deleting themselves
    if (userId === decoded.userId) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete your own account'
      }, { status: 400 });
    }

    // Find and delete user
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete user'
    }, { status: 500 });
  }
}
