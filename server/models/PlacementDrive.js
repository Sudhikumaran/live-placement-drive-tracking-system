import mongoose from 'mongoose';

const placementDriveSchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true
    },
    role: {
        type: String,
        required: [true, 'Role is required'],
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    eligibility: {
        minCgpa: {
            type: Number,
            required: true,
            min: 0,
            max: 10
        },
        departments: [{
            type: String,
            required: true
        }]
    },
    rounds: [{
        name: String,
        description: String,
        date: Date
    }],
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'closed'],
        default: 'upcoming'
    },
    ctc: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    companyWebsite: {
        type: String,
        trim: true
    },
    jobType: {
        type: String,
        enum: ['Full-Time', 'Internship', 'Internship + PPO'],
        default: 'Full-Time'
    },
    bondDetails: {
        hasBond: {
            type: Boolean,
            default: false
        },
        duration: String
    },
    stipend: {
        type: String
    },
    deadline: {
        type: Date,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Index for faster queries
placementDriveSchema.index({ status: 1, deadline: 1 });
placementDriveSchema.index({ companyName: 1 });

const PlacementDrive = mongoose.model('PlacementDrive', placementDriveSchema);

export default PlacementDrive;
