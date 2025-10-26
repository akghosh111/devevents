import mongoose, { Document, Schema, Model } from 'mongoose';
import Event from './event.model';

// TypeScript interface for Booking document
export interface IBooking extends Document {
  eventId: mongoose.Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
  },
  {
    timestamps: true, // Auto-generate createdAt and updatedAt
  }
);

// Pre-save hook: Verify that the referenced event exists
BookingSchema.pre('save', async function (next) {
  if (this.isModified('eventId')) {
    try {
      const eventExists = await Event.findById(this.eventId);
      if (!eventExists) {
        return next(new Error('Referenced event does not exist'));
      }
    } catch (error) {
      return next(new Error('Failed to validate event reference'));
    }
  }
  next();
});

// Create index on eventId for faster queries
BookingSchema.index({ eventId: 1 });

const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;
