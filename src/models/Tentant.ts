import mongoose, {Document, Schema, Types} from 'mongoose';

export interface TenantInterface extends Document {
    _id : Types.ObjectId;
    email: string;
    apiKey: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const TenantSchema : Schema = new Schema({
    email : {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    apiKey : {
        type: String,
        required: true,
        unique: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

TenantSchema.index({
    email: 1,
    apiKey: 1
})

export const Tenant = mongoose.model<TenantInterface>('Tenant', TenantSchema);