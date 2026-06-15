import mongoose, { Schema } from "mongoose";

const RepositorySchema: Schema = new Schema(
  {
    url: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Repository", RepositorySchema);
