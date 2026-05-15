const mongoose = require('mongoose');
const { Schema } = mongoose;

const quizSchema = new Schema(
    {
        quiz_id: {
            type: String,
            required: true,
            unique: true
        },
        quiz_title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        quiz_description: {
            type: String,
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        quiz_thumbnail: {
            type: String,
            trim: true,
        },
        chapter_id: {
            type: String,
            required: false,
        },
        course_id: {
            type: String,
            required: false,
        },
        instructor_id: {
            type: String,
            required: false,
        },
        // topic_id: {
        //     type: String,
        //     required: true,
        // },
        "sub_category_id": {
            type: String,
            required: false,
        },
        "category_id": {
            type: String,
            required: false,
        },
        quiz_type: {
            type: String,
            enums: ["subjective", "objective"],
            required: true,
        },
        quiz_duration: {
            type: Number,
            min: [1, 'Duration must be at least 1 minute'],
            max: [1440, 'Duration cannot exceed 24 hours'],
            default: 600,
        },
        total_points: {
            type: Number,
            min: 0,
            default: 0,
        },
        quiz_status: {
            type: String,
            enum: ['draft', 'published', 'active', "inactive"],
            default: 'draft',
            index: true,
        },
        start_date: {
            type: Date,
        },
        end_date: {
            type: Date,
        },
        questions: [
            {
                type: {
                    type: String,
                    required: true,
                    enum: [
                        'single_correct',
                        // 'multiple_correct',
                        // 'true_false',
                        'subjective',
                        'file_upload',
                    ],
                },
                question_text: {
                    type: String,
                    required: [true, 'Question text is required'],
                    trim: true,
                    maxlength: [3000, 'Question text too long'],
                },
                points: {
                    type: Number,
                    required: true,
                },
                order: {
                    type: Number,
                    required: true,
                    min: 1,
                },
                question_duration: {
                    type: Number,
                    required: true,
                },
                options: [
                    {
                        text: {
                            type: String,
                            required: true,
                            trim: true,
                        },
                        is_correct: {
                            type: Boolean,
                            default: false,
                        },

                        explanation: {
                            type: String,
                            maxlength: 1000,
                        },
                    },
                ],
            },
        ],
        quiz_difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium',
        },
        quiz_tags: [String],
    },
    {
        timestamps: true,
    }
);



module.exports = mongoose.model('Quiz', quizSchema);

