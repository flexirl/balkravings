import { Request, Response } from 'express';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import Joi from 'joi';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: '7d',
  });
};

const generateRefreshToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: Request, res: Response) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
        const accessToken = generateToken((user._id as unknown) as string);
        const refreshToken = generateRefreshToken((user._id as unknown) as string);

        user.refreshToken = refreshToken;
        await user.save();
        
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessToken, 
        refreshToken
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (err: any) {
     res.status(500).json({ message: err.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const accessToken = generateToken((user._id as unknown) as string);
      const refreshToken = generateRefreshToken((user._id as unknown) as string);

      user.refreshToken = refreshToken;
      await user.save();

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
        accessToken,
        refreshToken
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};


// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token provided' });
    }

    try {
        const user = await User.findOne({ refreshToken });
        if (!user) {
             return res.status(403).json({ message: 'Invalid refresh token' });
        }

        jwt.verify(refreshToken, process.env.JWT_SECRET as string, (err: any, decoded: any) => {
             if (err) {
                 return res.status(403).json({ message: 'Invalid refresh token log' });
             }
             
             const accessToken = generateToken((user._id as unknown) as string);
             res.json({ accessToken });
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public (or Protected if needed)
export const logoutUser = async (req: Request, res: Response) => {
     // In a stateless JWT setup, logout is handled client-side by deleting tokens.
     // However, for extra security, we can remove the refreshToken from DB.
     // Assuming we get refreshToken in body for explicit logout
     const { refreshToken } = req.body;
     try {
         const user = await User.findOneAndUpdate({ refreshToken }, { refreshToken: '' });
         res.json({ message: 'Logged out successfully' });
     } catch (err: any) {
         res.status(500).json({ message: err.message });
     }
}

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req: Request, res: Response) => {
     try {
          const user = await User.findById((req as any).user.id).select('-password -refreshToken');
          if (!user) {
               return res.status(404).json({ message: 'User not found' });
          }
          res.json(user);
     } catch (err: any) {
          res.status(500).json({ message: err.message });
     }
};

// @desc    Update user profile (name, email, phone)
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req: Request, res: Response) => {
     const schema = Joi.object({
          name: Joi.string(),
          phone: Joi.string(),
     });

     const { error } = schema.validate(req.body);
     if (error) {
          return res.status(400).json({ message: error.details[0].message });
     }

     try {
          const { name, phone } = req.body;
          const user = await User.findByIdAndUpdate(
               (req as any).user.id,
               { ...(name && { name }), ...(phone && { phone }) },
               { new: true }
          ).select('-password -refreshToken');

          if (!user) {
               return res.status(404).json({ message: 'User not found' });
          }

          res.json(user);
     } catch (err: any) {
          res.status(500).json({ message: err.message });
     }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req: Request, res: Response) => {
     const schema = Joi.object({
          currentPassword: Joi.string().required(),
          newPassword: Joi.string().min(6).required(),
     });

     const { error } = schema.validate(req.body);
     if (error) {
          return res.status(400).json({ message: error.details[0].message });
     }

     try {
          const { currentPassword, newPassword } = req.body;
          const user = await User.findById((req as any).user.id);

          if (!user) {
               return res.status(404).json({ message: 'User not found' });
          }

          const isMatch = await user.matchPassword(currentPassword);
          if (!isMatch) {
               return res.status(401).json({ message: 'Current password is incorrect' });
          }

          user.password = newPassword;
          await user.save();

          res.json({ message: 'Password changed successfully' });
     } catch (err: any) {
          res.status(500).json({ message: err.message });
     }
}

// @desc    Get user addresses
// @route   GET /api/auth/addresses
// @access  Private
export const getAddresses = async (req: Request, res: Response) => {
     try {
          const user = await User.findById((req as any).user.id).select('addresses');
          if (!user) {
               return res.status(404).json({ message: 'User not found' });
          }
          res.json(user.addresses);
     } catch (err: any) {
          res.status(500).json({ message: err.message });
     }
};

// @desc    Add new address
// @route   POST /api/auth/addresses
// @access  Private
export const addAddress = async (req: Request, res: Response) => {
     const schema = Joi.object({
          type: Joi.string().valid('home', 'work', 'other').required(),
          street: Joi.string().required(),
          city: Joi.string().required(),
          state: Joi.string().required(),
          postalCode: Joi.string().required(),
          country: Joi.string().required(),
          phoneNumber: Joi.string().required(),
          isDefault: Joi.boolean().default(false),
     });

     const { error } = schema.validate(req.body);
     if (error) {
          return res.status(400).json({ message: error.details[0].message });
     }

     try {
          const { type, street, city, state, postalCode, country, phoneNumber, isDefault } = req.body;
          const user = await User.findById((req as any).user.id);

          if (!user) {
               return res.status(404).json({ message: 'User not found' });
          }

          // If isDefault is true, set all others to false
          if (isDefault) {
               user.addresses.forEach((addr) => {
                    addr.isDefault = false;
               });
          }

          const newAddress = {
               type,
               street,
               city,
               state,
               postalCode,
               country,
               phoneNumber,
               isDefault: isDefault || false,
          };

          user.addresses.push(newAddress as any);
          await user.save();

          res.status(201).json(user.addresses);
     } catch (err: any) {
          res.status(500).json({ message: err.message });
     }
};

// @desc    Update address
// @route   PUT /api/auth/addresses/:addressId
// @access  Private
export const updateAddress = async (req: Request, res: Response) => {
     const schema = Joi.object({
          type: Joi.string().valid('home', 'work', 'other'),
          street: Joi.string(),
          city: Joi.string(),
          state: Joi.string(),
          postalCode: Joi.string(),
          country: Joi.string(),
          phoneNumber: Joi.string(),
          isDefault: Joi.boolean(),
     });

     const { error } = schema.validate(req.body);
     if (error) {
          return res.status(400).json({ message: error.details[0].message });
     }

     try {
          const { addressId } = req.params;
          const user = await User.findById((req as any).user.id);

          if (!user) {
               return res.status(404).json({ message: 'User not found' });
          }

          const address = user.addresses.id(addressId);
          if (!address) {
               return res.status(404).json({ message: 'Address not found' });
          }

          // If isDefault is true, set all others to false
          if (req.body.isDefault) {
               user.addresses.forEach((addr) => {
                    addr.isDefault = false;
               });
          }

          Object.assign(address, req.body);
          await user.save();

          res.json(user.addresses);
     } catch (err: any) {
          res.status(500).json({ message: err.message });
     }
};

// @desc    Delete address
// @route   DELETE /api/auth/addresses/:addressId
// @access  Private
export const deleteAddress = async (req: Request, res: Response) => {
     try {
          const { addressId } = req.params;
          const user = await User.findById((req as any).user.id);

          if (!user) {
               return res.status(404).json({ message: 'User not found' });
          }

          const address = user.addresses.id(addressId);
          if (!address) {
               return res.status(404).json({ message: 'Address not found' });
          }

          address.deleteOne();
          await user.save();

          res.json(user.addresses);
     } catch (err: any) {
          res.status(500).json({ message: err.message });
     }
};
