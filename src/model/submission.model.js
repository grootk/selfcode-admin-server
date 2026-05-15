const mongoose = require('mongoose');


const submissionSchema = new mongoose.Schema(
    {
        submission_id: {
            type: String,
            required: true,
            unique: true,
        },
        quiz_id: {
            type: String,
            required: true,
        },
        student_id: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: [
                'in_progress',
                'submitted',
                'late',
                'evaluated',
                'expired',
            ],
            default: 'submitted',
            index: true
        },
        started_at: {
            type: Date,
            default: Date.now,
            required: true,
        },
        submitted_at: {
            type: Date,
        },
        time_taken_seconds: {
            type: Number,
            min: 0,
        },
        is_on_time: {
            type: Boolean,
            default: true,
        },
        answers: [
            {
                question: {
                    type: mongoose.Schema.Types.ObjectId,     
                    required: true
                },
                order: {
                    type: Number,
                    required: true,
                },
                response: {
                    selected_options: [mongoose.Schema.Types.ObjectId], 
                    text_answer: {
                        type: String,
                        maxlength: 10000,
                    },
                    answer_url: {
                        type:String,
                        required:false
                    },
                },
                score: {
                    type: Number,
                    min: 0,
                    default: 0,
                },
                  is_correct: {
                    type: Boolean,
                    required: false,
                    default:false
                },
                  is_checked: {
                    type: Boolean,
                    required: true,
                    default:false
                }
                // max_points: {
                //     type: Number,
                //     required: true,
                // },
            },
        ],
        total_score: {
            type: Number,
            default: 0,
        },
        percentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },
        quiz_total_points: {
            type: Number,
            required: true,
        },
        quiz_attempt:{
           type: Number,
           required: false, 
           default:1,
        }
    },
    {
        timestamps: true,
    }
);

// // ── Indexes ────────────────────────────────────────────────────────────────
// quizAttemptSchema.index({ quiz: 1, student: 1 }, { unique: true }); // one attempt per student per quiz
// quizAttemptSchema.index({ student: 1, status: 1 });
// quizAttemptSchema.index({ submitted_at: -1 });
// quizAttemptSchema.index({ status: 1, evaluated_at: 1 });

// // ── Virtuals ───────────────────────────────────────────────────────────────

// quizAttemptSchema.virtual('is_graded').get(function () {
//     return this.status === 'evaluated';
// });

// quizAttemptSchema.virtual('number_of_answers').get(function () {
//     return this.answers?.length || 0;
// });

// // ── Pre-save: calculate total score & percentage ───────────────────────────
// quizAttemptSchema.pre('save', function (next) {
//     if (this.isModified('answers') || this.isModified('status')) {
//         this.total_score = this.answers.reduce((sum, ans) => sum + (ans.score || 0), 0);

//         if (this.quiz_total_points > 0) {
//             this.percentage = (this.total_score / this.quiz_total_points) * 100;
//         }

//         // Auto-detect late submission
//         // (You can also do this when submitting)
//         if (this.submitted_at && this.quiz?.end_date && this.submitted_at > this.quiz.end_date) {
//             this.is_on_time = false;
//             this.status = 'late';
//         }
//     }
//     next();
// });

module.exports  = mongoose.model('submission', submissionSchema);

 