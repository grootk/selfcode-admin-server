const { mongoManager, CONSTANT } = require("../../packages/manager");
const { jwt } = require("../../packages/config");
const bcrypt = require("bcrypt");
const { randomBytes } = require("crypto");
const jwtoken = require("jsonwebtoken");
const instructor = require("../model/instructor.model");
const activityModel = require("../model/activity.model");
const { getMonthMap } = require("../../packages/handlers");
const purchase = require("../model/purchase.model");
const course = require("../model/course.model");
const courseCompletionModel = require("../model/courseCompletion.model");
const revenueModel = require("../model/revenue.model");
const courseModel = require("../model/course.model");
const instructorModel = require("../model/instructor.model");

const authToken = async (employee_id) => {
  let jwtSecretKey = jwt.secretKey;

  let data = { time: Date(), employee_id: employee_id };

  const token = jwtoken.sign(data, jwtSecretKey, { expiresIn: "1d" });
  return token;
};

mongoManager.connect();

const getInstructorByEmail = async (email) => {
  try {
    const instructorData = await instructor
      .findOne(
        { instructor_email: email },
        { _id: 0, instructor_id: 1, instructor_email: 1, instructor_role: 1 }
      )
      .lean();
    return instructorData;
  } catch (error) {
    return null;
  }
};

const addInstructor = async (
  admin_id,
  name,
  email,
  about,
  password,
  phone_no,
  avatar,
  role,
  is_verified,
  social_media,
  experience
) => {
  try {
    const saltRound = 10;
    let hashPassword;
    // const {
    //   name,
    //   email,
    //   about,
    //   password,
    //   phone_no,
    //   avatar,
    //   role,
    //   is_verified,
    //   social_media,
    //   experience
    // } = payload;

    if (password.length) {
      hashPassword = await bcrypt.hashSync(password, saltRound);
    }
    const addInstructorPayload = await instructor.create({
      instructor_id: randomBytes(6).toString("hex"),
      instructor_name: name,
      instructor_email: email,
      instructor_about: about,
      instructor_password: hashPassword,
      instructor_phone_no: phone_no,
      instructor_avatar: avatar,
      instructor_role: role,
      work_experience: experience,
      social_media: social_media,
      is_verified: is_verified,
    });

    return {
      status: 201,
      message: CONSTANT.PAYLOAD.RECORD_CREATED_SUCCESSFULLY,
      data: addInstructorPayload,
    };
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      let message = CONSTANT.PAYLOAD.RECORD_ALREADY_EXIST;

      if (field === "instructor_email") {
        message = CONSTANT.DATABASE_ERROR.USEREMAIL;
      } else if (field === "instructor_phone_no") {
        message = CONSTANT.DATABASE_ERROR.USERPHONENO;
      }

      return {
        status: 409,
        message,
        data: null,
      };
    }

    return {
      status: 500,
      message: CONSTANT.SERVER.SERVER_INTERNAl_ERROR,
      error: error,
      data: null,
    };
  }
};

const getInstructor = async (
  instructor_id,
  page,
  limit,
  yearFilter,
  monthFilter,
  status,
  sort_by
) => {
  try {
    const skip = (page - 1) * limit;
    let checkMatch;

    if (instructor_id) {
      checkMatch = { instructor_id: instructor_id };
    }
    let sortStage = {};
    if (sort_by) {
      if (sort_by === "new") {
        sortStage = { $sort: { createdAt: -1 } };
      } else if (sort_by === "top") {
        sortStage = { $sort: { total_student: -1 } };
      }
    }

    if (status) {
      checkMatch = { instructor_status: status };
    }

    let timeCheck = {};

    if (monthFilter || yearFilter) {
      const dateConditions = [];
      monthFilter = await getMonthMap(monthFilter);
      if (monthFilter) {
        dateConditions.push({
          $eq: [{ $month: "$createdAt" }, Number(monthFilter)],
        });
      }

      if (yearFilter) {
        dateConditions.push({
          $eq: [{ $year: "$createdAt" }, Number(yearFilter)],
        });
      }

      timeCheck = {
        $expr: {
          $and: dateConditions,
        },
      };
    }

    const getInstructorList = await instructor.aggregate([
      {
        $match: { ...checkMatch, ...timeCheck },
      },
      {
        $lookup: {
          from: "courses",
          localField: "instructor_id",
          foreignField: "instructor_id",
          as: "courses",
        },
      },
      {
        $lookup: {
          from: "purchases",
          let: { courseIds: "$courses.course_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$course_id", "$$courseIds"],
                },
              },
            },
          ],
          as: "purchases",
        },
      },
      {
        $addFields: {
          course_count: { $size: { $ifNull: ["$courses", []] } },
          total_student: { $size: { $ifNull: ["$purchases", []] } },
        },
      },
      ...(Object.keys(sortStage).length ? [sortStage] : []),
      { $skip: Number(skip) },
      { $limit: Number(limit) },
      {
        $project: {
          _id: 0,
          instructor_id: { $ifNull: ["$instructor_id", ""] },
          instructor_first_name: { $ifNull: ["$instructor_first_name", ""] },
          instructor_last_name: { $ifNull: ["$instructor_last_name", ""] },
          instructor_email: { $ifNull: ["$instructor_email", ""] },
          instructor_phone_no: { $ifNull: ["$instructor_phone_no", ""] },
          instructor_avatar: { $ifNull: ["$instructor_avatar", ""] },
          instructor_gender: { $ifNull: ["$instructor_gender", ""] },
          instructor_about: { $ifNull: ["$instructor_about", ""] },
          instructor_status: { $ifNull: ["$instructor_status", ""] },
          current_profile: { $ifNull: ["$current_profile", ""] },
          instructor_country: { $ifNull: ["$instructor_country", ""] },
          instructor_state: { $ifNull: ["$instructor_state", ""] },
          createdAt: 1,
          course_count: { $size: { $ifNull: ["$courses", []] } },
          reviewed_by: { $size: { $ifNull: ["$reviews", []] } },
          total_student: { $size: { $ifNull: ["$purchases", []] } },
          total_rating: {
            $sum: { $ifNull: ["$reviews.instructor_rating", 0] },
          },
          total_payment: {
            $sum: {
              $map: {
                input: { $ifNull: ["$purchases", []] },
                as: "purchase",
                in: { $ifNull: ["$$purchase.course_amount", 0] },
              },
            },
          },
        },
      },
    ]);

    const count = await instructor.countDocuments({
      ...checkMatch,
      ...timeCheck,
    });
    const response = getInstructorList.length
      ? {
          status: 200,
          message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
          count: count,
          data: getInstructorList,
        }
      : {
          status: 409,
          message: CONSTANT.STATUS.NOT_FOUND,
          data: [],
        };
    return response;
  } catch (error) {
    return {
      status: 500,
      message: CONSTANT.SERVER.SERVER_INTERNAl_ERROR,
      error: error,
      data: null,
    };
  }
};

// const getInstructor = async (instructor_id, page, limit) => {
//   try {
//     const skip = (page - 1) * limit;
//     let checkMatch = { instructor_id: instructor_id };

//     const getProfilePayload = await instructor.aggregate([
//       {
//         $match: checkMatch,
//       },
//       {
//         $lookup: {
//           from: "reviews",
//           localField: "instructor_id",
//           foreignField: "instructor_id",
//           as: "reviews",
//         },
//       },
//       {
//         $lookup: {
//           from: "courses",
//           localField: "instructor_id",
//           foreignField: "instructor_id",
//           as: "courses",
//         },
//       },
//       {
//         $lookup: {
//           from: "purchases",
//           let: { courseIds: "$courses.course_id" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $in: ["$course_id", "$$courseIds"],
//                 },
//               },
//             },
//           ],
//           as: "purchases",
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           instructor_id: { $ifNull: ["$instructor_id", ""] },
//           instructor_first_name: { $ifNull: ["$instructor_first_name", ""] },
//           instructor_last_name: { $ifNull: ["$instructor_last_name", ""] },
//           instructor_email: { $ifNull: ["$instructor_email", ""] },
//           instructor_phone_no: { $ifNull: ["$instructor_phone_no", ""] },
//           instructor_avatar: { $ifNull: ["$instructor_avatar", ""] },
//           instructor_gender: { $ifNull: ["$instructor_gender", ""] },
//           instructor_about: { $ifNull: ["$instructor_about", ""] },
//           createdAt: 1,

//           // derived fields
//           course_count: { $size: "$courses" },
//           total_rating: { $sum: "$reviews.review_rating" },
//           reviewed_by: { $size: "$reviews" },
//           total_student: { $size: "$purchases" },
//           work_experience: 1,
//           social_media: 1,
//         },
//       },
//     ]);

//     const response =
//       getProfilePayload !== null
//         ? {
//             status: 200,
//             message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
//             data: getProfilePayload,
//           }
//         : {
//             status: 409,
//             message: CONSTANT.STATUS.SOMETHING_WENT_WRONG,
//             data: [],
//           };
//     return response;
//   } catch (error) {
//     return {
//       status: 500,
//       message: CONSTANT.SERVER.SERVER_INTERNAl_ERROR,
//       error: error,
//       data: null,
//     };
//   }
// };

const sendVerificationEmail = async (name, email, verificationToken) => {
  const verificationUrl = `${url}/verify-email?token=${verificationToken}`;
  const sesClient = new SESv2Client({
    region: aws.region,
    credentials: {
      accessKeyId: aws.accessKey,
      secretAccessKey: aws.secretKey,
    },
  });

  const params = {
    Destination: { ToAddresses: [email] },
    FromEmailAddress: ses.sesAddress,
    Content: {
      Simple: {
        Subject: {
          Charset: "UTF-8",
          Data: "Verify Link to Reset Password!",
        },
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `
              <html>
                <body>
                  <h1>Hi ${name}!</h1>
                  <p>We've recieved a request to reset your password.</p>
                  <p><a href="${verificationUrl}">Verify Email</a></p>
                  <p>If you did not request to reset password,please ignore this email.Otherwise,you can change your password.</p>
                </body>
              </html>
            `,
          },
          Text: {
            Charset: "UTF-8",
            Data: `Please verify your email by clicking the link: ${verificationUrl}`,
          },
        },
      },
    },
  };

  try {
    await sesClient.send(new SendEmailCommand(params));
    return {
      status: 200,
      message: CONSTANT.PASSWORD.RESET_LINK_SEND_SUCCESSFULLY,
      data: [],
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      status: 500,
      message: "Failed to send verification email.",
      error: error.message,
    };
  }
};

const sendOtp = async (email, otp) => {
  const sesClient = new SESv2Client({
    region: aws.region,
    credentials: { accessKeyId: aws.accessKey, secretAccessKey: aws.secretKey },
  });

  const otpCode = otp;
  const params = {
    Destination: { ToAddresses: [email] },
    FromEmailAddress: ses.sesAddress,
    Content: {
      Simple: {
        Subject: {
          Charset: "UTF-8",
          Data: "Pixel Rings student OTP-Verification",
        },
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `<html>
                    <body>
                      <p>Your one-time OTP code:</p>
                      <h3>${otpCode}</h3>
                    </body>
                  </html>`,
          },
          Text: {
            Charset: "UTF-8",
            Data: `Your one-time OTP code: ${otpCode}`,
          },
        },
      },
    },
  };

  try {
    const otpResponse = await sesClient.send(new SendEmailCommand(params));
    return {
      status: 200,
      message: CONSTANT.COGNITO.OTP_SEND_SUCCESSFULLY,
      data: [],
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return { status: 500, message: "Failed to send OTP email." };
  }
};

const signUp = async (
  instructor_id,
  first_name,
  last_name,
  email,
  password,
  phone_no,
  avatar,
  gender,
  about,
  country,
  state,
  work_experience,
  current_profile,
  social_media,
  role
) => {
  try {
    const saltRound = 10;
    const hashPassword = await bcrypt.hash(password, saltRound);

    const signUpPayload = await instructor.create({
      instructor_id: instructor_id,
      instructor_first_name: first_name,
      instructor_last_name: last_name,
      instructor_email: email,
      instructor_phone_no: phone_no,
      instructor_password: hashPassword,
      instructor_gender: gender,
      instructor_about: about,
      instructor_avatar: avatar,
      instructor_country: country,
      instructor_state: state,
      work_experience: work_experience,
      current_profile: current_profile,
      social_media: social_media,
      instructor_role: role || "instructor",
    });

    return {
      status: 201,
      message: CONSTANT.PAYLOAD.RECORD_CREATED_SUCCESSFULLY,
      data: signUpPayload,
    };
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      let message = CONSTANT.PAYLOAD.RECORD_ALREADY_EXIST;

      if (field === "instructor_email") {
        message = CONSTANT.DATABASE_ERROR.USEREMAIL;
      } else if (field === "instructor_phone_no") {
        message = CONSTANT.DATABASE_ERROR.USERPHONENO;
      }

      return {
        status: 409,
        message,
        data: null,
      };
    }

    return {
      status: 500,
      message: CONSTANT.SERVER.SERVER_INTERNAl_ERROR,
      error: error,
      data: null,
    };
  }
};
const login = async (email, password) => {
  try {
    let hashPassword;

    if (email && password) {
      hashPassword = await student
        .findOne(
          { instructor_email: email },
          {
            _id: 0,
            instructor_id: 1,
            instructor_password: 1,
            instructor_email: 1,
          }
        )
        .lean();
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      hashPassword.instructor_password
    );

    if (!isPasswordValid) {
      return {
        status: 409,
        message: CONSTANT.STATUS.INVALID_CREDS,
        data: [],
      };
    }

    const token = await authToken(hashPassword?.instructor_id);
    const loginPayload = await student.updateOne(
      { instructor_id: hashPassword?.instructor_id },
      { studentAuthToken: token }
    );

    const response =
      loginPayload !== null
        ? {
            status: 201,
            message: CONSTANT.PAYLOAD.RECORD_UPDATED_SUCCESSFULLY,
            data: token,
          }
        : {
            status: 409,
            message: CONSTANT.STATUS.SOMETHING_WENT_WRONG,
            data: [],
          };
    return response;
  } catch (error) {
    return {
      status: 500,
      message: CONSTANT.SERVER.SERVER_INTERNAl_ERROR,
      error: error,
      data: null,
    };
  }
};

const getProfile = async (instructor_id) => {
  try {
    const getProfilePayload = await instructor.aggregate([
      {
        $match: { instructor_id: instructor_id },
      },
      {
        $lookup: {
          from: "courses",
          localField: "instructor_id",
          foreignField: "instructor_id",
          as: "courses",
        },
      },
      {
        $addFields: {
          course_count: { $size: { $ifNull: ["$courses", []] } },
        },
      },
      {
        $project: {
          _id: 0,
          instructor_id: { $ifNull: ["$instructor_id", ""] },
          instructor_first_name: { $ifNull: ["$instructor_first_name", ""] },
          instructor_last_name: { $ifNull: ["$instructor_last_name", ""] },
          instructor_email: { $ifNull: ["$instructor_email", ""] },
          instructor_phone_no: { $ifNull: ["$instructor_phone_no", ""] },
          instructor_avatar: { $ifNull: ["$instructor_avatar", ""] },
          instructor_gender: { $ifNull: ["$instructor_gender", ""] },
          instructor_country: { $ifNull: ["$instructor_country", ""] },
          instructor_state: { $ifNull: ["$instructor_state", ""] },
          instructor_about: { $ifNull: ["$instructor_about", ""] },
          instructor_current_profile: { $ifNull: ["$current_profile", ""] },
          course_count: { $ifNull: ["$course_count", 0] },
          createdAt: { $ifNull: ["$createdAt", null] },
          instructor_type: "instructor",
          student_count: {
            $ifNull: [{ $arrayElemAt: ["$courses.student_enrolled", 0] }, 0],
          },
          instructor_total_rating: { $ifNull: ["$total_rating", 0] },
          instructor_reviewed_by: { $ifNull: ["$reviewed_by", 0] },
          holder_name: { $ifNull: ["$holder_name", ""] },
          bank_name: { $ifNull: ["$bank_name", ""] },
          account_no: { $ifNull: ["$account_no", ""] },
          ifsc_code: { $ifNull: ["$ifsc_code", ""] },
        },
      },
    ]);

    const response =
      getProfilePayload !== null && getProfilePayload.length > 0
        ? {
            status: 200,
            message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
            data: getProfilePayload,
          }
        : {
            status: 409,
            message: CONSTANT.STATUS.NOT_FOUND,
            data: [],
          };
    return response;
  } catch (error) {
    return {
      status: 500,
      message: CONSTANT.SERVER.SERVER_INTERNAl_ERROR,
      error: error,
      data: null,
    };
  }
};

const updateStatus = async (instructor_id, status) => {
  try {
    const updateStatusPayload = await instructor.updateMany(
      { instructor_id: { $in: instructor_id } },
      { instructor_status: status },
      { new: true }
    );

    const response =
      updateStatusPayload !== null
        ? {
            status: 202,
            message: CONSTANT.PAYLOAD.RECORD_UPDATED_SUCCESSFULLY,
            data: updateStatusPayload,
          }
        : {
            status: 409,
            message: CONSTANT.STATUS.SOMETHING_WENT_WRONG,
            data: [],
          };
    return response;
  } catch (error) {
    return {
      status: 500,
      message: CONSTANT.SERVER.SERVER_INTERNAl_ERROR,
      error: error,
      data: null,
    };
  }
};

const forgetPassword = async (email, phone_no) => {
  try {
    let checkMatch = {};

    if (email) checkMatch.instructor_email = email;
    if (phone_no) checkMatch.instructor_phone_no = phone_no;

    const instructorPayload = await student.findOne(
      {
        ...checkMatch,
      },
      { instructor_email: 1, instructor_name: 1, instructor_auth_token: 1 }
    );

    if (!studentPayload) {
      return { status: 409, message: CONSTANT.STATUS.NOT_FOUND, data: [] };
    }

    const otpResponse = await sendVerificationEmail(
      instructorPayload?.instructor_name,
      instructorPayload?.instructor_email,
      instructorPayload?.instructor_auth_token
    );

    return otpResponse;
  } catch (error) {
    return { status: 422, message: error.message };
  }
};

const verifyOtp = async (email, otp) => {
  try {
    // const { email, otp } = payload;
    let verifyOtpPayload = null;
    const savedOtp = await student.findOne(
      { instructor_email: email },
      { instructor_otp: 1 }
    );

    if (Number(otp) === savedOtp.instructor_otp) {
      verifyOtpPayload = await student
        .findOneAndUpdate({ instructor_email: email }, { instructor_otp: null })
        .lean();
    }

    const response =
      verifyOtpPayload !== null
        ? {
            status: 200,
            message: CONSTANT.COGNITO.OTP_CONFIRMED,
            data: email,
          }
        : {
            status: 409,
            message: CONSTANT.COGNITO.OTP_NOT_CONFIRMED,
            data: [],
          };

    return response;
  } catch (error) {
    return { status: 422, message: error.message };
  }
};

const changePassword = async (email, password) => {
  try {
    // const { email, password } = payload;
    const studentPayload = await student.findOne({ instructor_email: email });

    if (!studentPayload) {
      return { status: 409, message: CONSTANT.STATUS.NOT_FOUND, data: [] };
    }

    let saltRounds = 10;
    const hashPassword = await bcrypt.hash(password, saltRounds);

    const changePasswordPayload = await student.findOneAndUpdate(
      { instructor_email: email },
      { instructor_password: hashPassword }
    );

    const response =
      changePasswordPayload !== null
        ? {
            status: 200,
            message: CONSTANT.student.PASSWORD_CHANGED,
            data: [],
          }
        : { status: 409, message: CONSTANT.PASSWORD.UNCONFIRMED, data: [] };

    return response;
  } catch (error) {
    return { status: 422, message: error.message };
  }
};

const purchaseCourse = async (
  instructor_id,
  course_id,
  transaction_id,
  method,
  amount
) => {
  try {
    // const { course_id, transaction_id, method, amount } = payload;
    const purchaseCoursePayload = await purchase.create({
      purchase_id: randomBytes(6).toString("hex"),
      instructor_id: instructor_id,
      course_id: course_id,
      transaction_id: transaction_id,
      payment_method: method,
      course_amount: amount,
    });

    await course.updateOne(
      { course_id: course_id },
      {
        $inc: {
          instructor_enrolled: 1,
        },
      }
    );

    await courseCompletionModel.create({
      completion_id: randomBytes(6).toString("hex"),
      course_id: course_id,
      instructor_id: instructor_id,
      course_status: "new",
    });

    const response =
      purchaseCoursePayload !== null
        ? {
            status: 200,
            message: CONSTANT.USER.COURSE_PURCHASED,
            data: purchaseCoursePayload,
          }
        : {
            status: 409,
            message: CONSTANT.STATUS.SOMETHING_WENT_WRONG,
            data: [],
          };

    return response;
  } catch (error) {
    return { status: 422, message: error.message };
  }
};

const studentActivity = async (instructor_id, page, limit) => {
  try {
    const skip = (page - 1) * limit;
    const purchaseData = await purchase.aggregate([
      {
        $match: { instructor_id: instructor_id },
      },
      {
        $lookup: {
          from: "courses",
          localField: "course_id",
          foreignField: "course_id",
          as: "courses",
        },
      },
      {
        $project: {
          _id: 0,
          course_id: 1,
          purchase_id: 1,
          instructor_id: 1,
          course_title: { $arrayElemAt: ["$courses.course_title", 0] },
          createdAt: 1,
          // type: "purchase"
        },
      },
    ]);

    const completionData = await course.aggregate([
      {
        $lookup: {
          from: "course_completions",
          let: { courseId: "$course_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$course_id", "$$courseId"] },
                    { $eq: ["$instructor_id", instructor_id] },
                    { $eq: ["$course_status", "completed"] },
                  ],
                },
              },
            },
          ],
          as: "completions",
        },
      },
      {
        $match: {
          $expr: {
            $gt: [{ $size: "$completions" }, 0], // only keep documents where completion exists
          },
        },
      },
      {
        $unwind: "$completions", // optional – removes the array
      },
      {
        $project: {
          course_id: "$course_id",
          course_title: 1,
          instructor_id: "$completions.instructor_id",
          completion_id: "$completions.completion_id",
          completedAt: "$completions.createdAt",
        },
      },
      {
        $sort: { completedAt: -1 },
      },
    ]);

    let activityPayload = [...purchaseData, ...completionData];

    const response =
      activityPayload !== null
        ? {
            status: 200,
            message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
            data: activityPayload,
          }
        : {
            status: 409,
            message: CONSTANT.STATUS.SOMETHING_WENT_WRONG,
            data: [],
          };

    return response;
  } catch (error) {
    return { status: 422, message: error.message };
  }
};

const studentPurchases = async (instructor_id, page, limit) => {
  try {
    const skip = (page - 1) * limit;
    const purchaseDataPayload = await purchase.aggregate([
      {
        $match: { instructor_id: instructor_id },
      },
      {
        $lookup: {
          from: "courses",
          localField: "course_id",
          foreignField: "course_id",
          as: "courses",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "courses.category_id",
          foreignField: "category_id",
          as: "category",
        },
      },
      {
        $lookup: {
          from: "sub_categories",
          localField: "courses.sub_category_id",
          foreignField: "sub_category_id",
          as: "sub_category",
        },
      },
      { $skip: Number(skip) },
      { $limit: Number(limit) },
      {
        $project: {
          _id: 0,
          course_id: 1,
          purchase_id: 1,
          instructor_id: 1,
          payment_method: 1,
          course: {
            course_title: { $arrayElemAt: ["$courses.course_title", 0] },
            course_thumbnail: {
              $arrayElemAt: ["$courses.course_thumbnail", 0],
            },
            course_overview: { $arrayElemAt: ["$courses.course_overview", 0] },
            category_title: { $arrayElemAt: ["$category.category_title", 0] },
            sub_category_title: {
              $arrayElemAt: ["$sub_category.sub_category_title", 0],
            },
          },
          course_amount: { $arrayElemAt: ["$courses.course_price", 0] },
          course_discount: { $arrayElemAt: ["$courses.course_discount", 0] },
          createdAt: 1,
          // type: "purchase"
        },
      },
    ]);

    const response =
      purchaseDataPayload !== null
        ? {
            status: 200,
            message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
            data: purchaseDataPayload,
          }
        : {
            status: 409,
            message: CONSTANT.STATUS.SOMETHING_WENT_WRONG,
            data: [],
          };

    return response;
  } catch (error) {
    return { status: 422, message: error.message };
  }
};

// const getRevenue = async (instructor_id, page, limit, year) => {
//   try {
//     const skip = (page - 1) * limit;
//     let date = new Date();
//     let currentYear = date.getFullYear();

//     const getRevenuePayload = await revenueModel.aggregate([
//       {
//         $match: { instructor_id: instructor_id, revenue_year: Number(year) },
//       },
//       {
//         $lookup: {
//           from: "courses",
//           localField: "instructor_id",
//           foreignField: "instructor_id",
//           as: "courses",
//         },
//       },
//       {
//         $addFields: {
//           course_count: { $size: "$courses" },
//           fees_total: {
//             $add: [
//               { $ifNull: [{ $toDouble: "$platform_fee" }, 0] },
//               { $ifNull: [{ $toDouble: "$revenue_taxes" }, 0] },
//             ],
//           },
//           net_earning: {
//             $subtract: [
//               "$total_amount",
//               {
//                 $add: [
//                   { $ifNull: [{ $toDouble: "$platform_fee" }, 0] },
//                   { $ifNull: [{ $toDouble: "$revenue_taxes" }, 0] },
//                 ],
//               },
//             ],
//           },
//         },
//       },
//       // { $skip: Number(skip) },
//       // { $limit: Number(limit) },
//       {
//         $project: {
//           _id: 0,
//           revenue_id: 1,
//           revenue_year: 1,
//           revenue_month: 1,
//           payment_method: 1,
//           revenue_status: 1,
//           total_sales: 2,
//           total_amount: 1,
//           platform_fee: 1,
//           revenue_taxes: 1,
//           course_count: 1,
//           net_earning: 1,
//         },
//       },
//     ]);

//     const response =
//       getRevenuePayload.length
//         ? {
//             status: 200,
//             message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
//             data: getRevenuePayload,
//           }
//         : {
//             status: 409,
//             message: CONSTANT.STATUS.NOT_FOUND,
//             data: [],
//           };

//     return response;
//   } catch (error) {
//     return { status: 422, message: error.message };
//   }
// };

const getRevenue = async (instructor_id, page = 1, limit = 10, year) => {
  try {
    const skip = (page - 1) * limit;
    const currentYear = year ? Number(year) : new Date().getFullYear();

    const data = await revenueModel.aggregate([
      // ✅ STEP 1: Match base data
      {
        $addFields: {
          revenue_year: { $year: "$createdAt" },
        },
      },
      {
        $match: {
          instructor_id: instructor_id,
          revenue_year: Number(year),
        },
      },

      // ✅ STEP 2: Lookup monthly course count
      {
        $lookup: {
          from: "courses",
          let: {
            instructorId: "$instructor_id",
            month: "$revenue_month",
            year: "$revenue_year",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$instructor_id", "$$instructorId"] },
                    { $eq: [{ $month: "$createdAt" }, "$$month"] },
                    { $eq: [{ $year: "$createdAt" }, "$$year"] },
                  ],
                },
              },
            },
            { $count: "count" },
          ],
          as: "courseData",
        },
      },

      // ✅ STEP 3: Clean + compute fields
      {
        $addFields: {
          course_count: {
            $ifNull: [{ $arrayElemAt: ["$courseData.count", 0] }, 0],
          },

          total_amount: { $ifNull: [{ $toDouble: "$total_amount" }, 0] },
          platform_fee: { $ifNull: [{ $toDouble: "$platform_fee" }, 0] },
          revenue_taxes: { $ifNull: [{ $toDouble: "$revenue_taxes" }, 0] },

          fees_total: {
            $add: ["$platform_fee", "$revenue_taxes"],
          },

          net_earning: {
            $subtract: [
              "$total_amount",
              { $add: ["$platform_fee", "$revenue_taxes"] },
            ],
          },
        },
      },

      // ✅ STEP 4: Remove empty data
      // {
      //   $match: {
      //     total_amount: { $gt: 0 },
      //   },
      // },

      // ✅ STEP 5: Sort + paginate
      { $sort: { revenue_month: 1 } },
      { $skip: skip },
      { $limit: limit },

      // ✅ STEP 6: Final output
      {
        $project: {
          _id: 0,
          revenue_id: 1,
          revenue_year: 1,
          revenue_month: 1,
          payment_method: 1,
          revenue_status: 1,
          total_sales: 1,
          total_amount: 1,
          platform_fee: 1,
          revenue_taxes: 1,
          fees_total: 1,
          course_count: 1,
          net_earning: 1,
        },
      },
    ]);

    console.log("....", data);

    return data.length
      ? {
          status: 200,
          message: "Revenue fetched successfully",
          data: data,
        }
      : {
          status: 404,
          message: "No revenue found",
          data: [],
        };
  } catch (error) {
    return {
      status: 422,
      message: error.message,
      data: [],
    };
  }
};

const getActivity = async (
  instructor_id,
  page,
  limit,
  monthFilter,
  yearFilter
) => {
  try {
    const skip = (page - 1) * limit;
    monthFilter = await getMonthMap(monthFilter);
    const checkMatch = {
      instructor_id: instructor_id,
      ...(monthFilter &&
        yearFilter && {
          $expr: {
            $and: [
              { $eq: [{ $month: "$createdAt" }, Number(monthFilter)] },
              { $eq: [{ $year: "$createdAt" }, Number(yearFilter)] },
            ],
          },
        }),
    };

    const getRevenuePayload = await activityModel.aggregate([
      {
        $match: checkMatch,
      },
      {
        $lookup: {
          from: "courses",
          localField: "instructor_id",
          foreignField: "instructor_id",
          as: "courses",
        },
      },
      {
        $addFields: {
          course_count: { $size: "$courses" },
          course_name: { $arrayElemAt: ["$courses.course_title", 0] },
        },
      },
      { $skip: Number(skip) },
      { $limit: Number(limit) },
      {
        $project: {
          _id: 0,
          activity_id: 1,
          course_name: 1,
          createdAt: 1,
          activity_type: 1,
        },
      },
    ]);

    const totalCount = await activityModel.countDocuments(checkMatch);

    const response = getRevenuePayload.length
      ? {
          status: 200,
          message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
          count: totalCount,
          data: getRevenuePayload,
        }
      : {
          status: 409,
          message: CONSTANT.STATUS.NOT_FOUND,
          data: [],
        };

    return response;
  } catch (error) {
    return { status: 422, message: error.message };
  }
};

const getMonthlyStats = async (monthFilter, yearFilter) => {
  try {
    const MONTH_NAMES = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ];

    const currentYear = yearFilter
      ? Number(yearFilter)
      : new Date().getFullYear();

    let matchFilter = {
      createdAt: {
        $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
        $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`),
      },
    };

    let monthIndex = null;

    if (monthFilter) {
      monthIndex = MONTH_NAMES.indexOf(monthFilter.toLowerCase());

      if (monthIndex === -1) {
        return { status: 409, message: "Invalid month name", data: [] };
      }

      const start = new Date(currentYear, monthIndex, 1);
      const end = new Date(currentYear, monthIndex + 1, 0, 23, 59, 59, 999); // ✅ FIX

      matchFilter.createdAt = { $gte: start, $lte: end };
    }

    const result = await instructor.aggregate([
      {
        $facet: {
          // ✅ ALL MONTH DATA (NO month filter)
          monthly: [
            {
              $match: {
                createdAt: {
                  $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
                  $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`),
                },
              },
            },
            {
              $group: {
                _id: { $month: "$createdAt" },
                total_instructor: { $sum: 1 },
              },
            },
          ],

          // ✅ FILTERED DATA (month/year)
          filtered: [
            { $match: matchFilter },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
              },
            },
          ],

          active: [
            { $match: { instructor_status: "active" } },
            { $count: "count" },
          ],

          suspended: [
            { $match: { instructor_status: "suspended" } },
            { $count: "count" },
          ],
        },
      },
    ]);

    // DEFAULT MONTH STRUCTURE
    const monthlyData = {};
    MONTH_NAMES.forEach((m) => {
      monthlyData[m] = { total_instructor: 0 };
    });

    // MAP DATA
    result[0].monthly.forEach((item) => {
      const monthName = MONTH_NAMES[item._id - 1];
      monthlyData[monthName].total_instructor = item.total_instructor;
    });

    // ✅ FIXED HERE
    const finalData = monthlyData; // ✅ ALWAYS ALL MONTHS

    const totalInstructor = await instructorModel.countDocuments();

    return {
      status: 200,
      message: "Instructor monthly stats fetched successfully",
      year: currentYear,
      totalInstructor,
      total_active_instructor: result[0].active[0]?.count || 0,
      total_suspended_instructor: result[0].suspended[0]?.count || 0,
      data: finalData,
    };
  } catch (error) {
    return {
      status: 500,
      message: error.message,
      data: [],
    };
  }
};

module.exports = {
  addInstructor,
  getInstructor,
  signUp,
  login,
  getInstructorByEmail,
  getProfile,
  updateStatus,
  forgetPassword,
  verifyOtp,
  changePassword,
  purchaseCourse,
  studentActivity,
  studentPurchases,
  getRevenue,
  getActivity,
  getMonthlyStats,
};
