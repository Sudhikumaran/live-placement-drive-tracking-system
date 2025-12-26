import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    driveId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PlacementDrive',
        required: true
    },
    roundStatus: [{
        round: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'shortlisted', 'rejected', 'selected'],
            default: 'pending'
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }],
    finalStatus: {
        type: String,
        enum: ['applied', 'in-progress', 'selected', 'rejected'],
        default: 'applied'
    },
    appliedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index to ensure a student can only apply once per drive
applicationSchema.index({ studentId: 1, driveId: 1 }, { unique: true });

// Index for faster queries
applicationSchema.index({ finalStatus: 1 });
applicationSchema.index({ driveId: 1 });

const Application = mongoose.model('Application', applicationSchema);

export default Application;
