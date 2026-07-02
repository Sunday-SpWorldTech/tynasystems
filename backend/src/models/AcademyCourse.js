import mongoose from 'mongoose';

const AcademyQuizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true },
  options: { type: [String], default: [] },
  answerIndex: { type: Number, default: 0 },
  explanation: { type: String, default: '' }
}, { _id: false });

const AcademyLessonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  body: { type: String, default: '' },
  videoUrl: { type: String, default: '' },
  resources: { type: [String], default: [] },
  order: { type: Number, default: 1 },
  isPublished: { type: Boolean, default: true }
}, { _id: true });

const AcademyCourseSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  title: { type: String, required: true, trim: true },
  track: { type: String, default: 'Programming' },
  level: { type: String, enum: ['basic', 'advanced', 'premium'], default: 'basic' },
  description: { type: String, default: '' },
  provider: { type: String, default: 'tyna-auto-learning-api' },
  providerStatus: { type: String, default: 'active' },
  lastProviderSyncAt: { type: Date },
  source: { type: String, enum: ['auto', 'external', 'manual'], default: 'auto' },
  certificatePath: { type: Boolean, default: true },
  isPublished: { type: Boolean, default: true },
  lessons: { type: [AcademyLessonSchema], default: [] },
  quiz: { type: [AcademyQuizQuestionSchema], default: [] }
}, { timestamps: true });

AcademyCourseSchema.virtual('lessonCount').get(function lessonCount() {
  return this.lessons?.filter(lesson => lesson.isPublished).length || 0;
});

AcademyCourseSchema.set('toJSON', { virtuals: true });
AcademyCourseSchema.set('toObject', { virtuals: true });

export default mongoose.model('AcademyCourse', AcademyCourseSchema);
