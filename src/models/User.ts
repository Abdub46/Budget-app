import { Schema, model, models, Model, Types } from 'mongoose';
import type { EmploymentStatus } from '@/types';

export interface IUserSettings {
  emailReportsEnabled: boolean;
  notifications: {
    budgetWarnings: boolean;
    monthlyReports: boolean;
    spendingAlerts: boolean;
  };
  appearance: 'light' | 'dark' | 'system';
}

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  phone: string;
  country: string;
  currency: string;

  employmentStatus: EmploymentStatus;

  // Employed-only
  employmentPlace?: string;
  position?: string;

  // Self-employed-only (optional)
  businessName?: string;
  occupation?: string;

  // Student-only (optional)
  institution?: string;
  course?: string;

  averageMonthlyBudget: number;

  settings: IUserSettings;

  createdAt: Date;
  updatedAt: Date;
}

const UserSettingsSchema = new Schema<IUserSettings>(
  {
    emailReportsEnabled: { type: Boolean, default: true },
    notifications: {
      budgetWarnings: { type: Boolean, default: true },
      monthlyReports: { type: Boolean, default: true },
      spendingAlerts: { type: Boolean, default: true },
    },
    appearance: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false },
    phone: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    currency: { type: String, required: true, default: 'KES', uppercase: true },

    employmentStatus: {
      type: String,
      enum: ['employed', 'self-employed', 'student'],
      required: true,
    },

    // Only meaningful when employmentStatus === 'employed'
    employmentPlace: { type: String, trim: true, default: undefined },
    position: { type: String, trim: true, default: undefined },

    // Only meaningful when employmentStatus === 'self-employed'
    businessName: { type: String, trim: true, default: undefined },
    occupation: { type: String, trim: true, default: undefined },

    // Only meaningful when employmentStatus === 'student'
    institution: { type: String, trim: true, default: undefined },
    course: { type: String, trim: true, default: undefined },

    averageMonthlyBudget: { type: Number, required: true, min: 0, default: 0 },

    settings: { type: UserSettingsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

/**
 * Strip employment-status-irrelevant fields before saving so stale data from a
 * prior status (e.g. switching Employed -> Student) never lingers in the document.
 */
UserSchema.pre('save', function (next) {
  if (this.isModified('employmentStatus') || this.isNew) {
    if (this.employmentStatus !== 'employed') {
      this.employmentPlace = undefined;
      this.position = undefined;
    }
    if (this.employmentStatus !== 'self-employed') {
      this.businessName = undefined;
      this.occupation = undefined;
    }
    if (this.employmentStatus !== 'student') {
      this.institution = undefined;
      this.course = undefined;
    }
  }
  next();
});

UserSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    delete ret.password;
    return ret;
  },
});

const User: Model<IUser> = models.User || model<IUser>('User', UserSchema);

export default User;
