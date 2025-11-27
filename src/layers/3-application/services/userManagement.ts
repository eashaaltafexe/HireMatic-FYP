/**
 * User Management Service
 * Handles user registration, roles, and profiles
 */

import { dbConnect, User } from '../../1-data-access';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'hr' | 'candidate';
  profile?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'hr' | 'candidate';
  profile?: any;
}

export interface UpdateUserDto {
  name?: string;
  profile?: any;
  role?: 'admin' | 'hr' | 'candidate';
}

class UserManagementService {
  /**
   * Create a new user
   */
  async createUser(data: CreateUserDto): Promise<UserProfile> {
    await dbConnect();
    
    const user = await User.create(data);
    
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      profile: user.profile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserProfile | null> {
    await dbConnect();
    
    const user = await User.findById(userId);
    
    if (!user) return null;
    
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      profile: user.profile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<UserProfile | null> {
    await dbConnect();
    
    const user = await User.findOne({ email });
    
    if (!user) return null;
    
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      profile: user.profile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, data: UpdateUserDto): Promise<UserProfile | null> {
    await dbConnect();
    
    const user = await User.findByIdAndUpdate(
      userId,
      { ...data, updatedAt: new Date() },
      { new: true }
    );
    
    if (!user) return null;
    
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      profile: user.profile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<boolean> {
    await dbConnect();
    
    const result = await User.findByIdAndDelete(userId);
    return !!result;
  }

  /**
   * Get all users with optional filters
   */
  async getUsers(filters?: { role?: string; search?: string }): Promise<UserProfile[]> {
    await dbConnect();
    
    const query: any = {};
    
    if (filters?.role) {
      query.role = filters.role;
    }
    
    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
      ];
    }
    
    const users = await User.find(query);
    
    return users.map(user => ({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      profile: user.profile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  /**
   * Change user role
   */
  async changeUserRole(userId: string, newRole: 'admin' | 'hr' | 'candidate'): Promise<boolean> {
    await dbConnect();
    
    const result = await User.findByIdAndUpdate(userId, { role: newRole, updatedAt: new Date() });
    return !!result;
  }
}

export default new UserManagementService();
