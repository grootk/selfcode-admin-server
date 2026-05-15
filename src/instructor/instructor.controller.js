const instructorService = require("./instructor.service");
const { successHandler, errorHandler } = require("../../packages/handlers");
const AmazonCognitoId = require("amazon-cognito-identity-js");
const { aws } = require("../../packages/config");
const { CONSTANT } = require("../../packages/constants");

// const addInstructor = async (req, res, next) => {
//   try {
//     const { admin_id } = req.data;
//     const { name,
//       email,
//       about,
//       password,
//       phone_no,
//       avatar,
//       role,
//       is_verified,
//       social_media,
//       experience } = req.body;
//     const data = await instructorService.addInstructor(
//       admin_id,
//       name,
//       email,
//       about,
//       password,
//       phone_no,
//       avatar,
//       role,
//       is_verified,
//       social_media,
//       experience
//     );
//     return successHandler(data, req, res, next);
//   } catch (error) {
//     return errorHandler(
//       {
//         status: 412,
//         message: error.message,
//         data: [],
//       },
//       req,
//       res,
//       next
//     );
//   }
// }

// const getInstructorProfile = async (req, res, next) => {
//   try {
//     // const { admin_id } = req.data;
//     const { instructor_id } = req.query;
//     const data = await instructorService.getInstructorProfile(
//       instructor_id
//     );
//     return successHandler(data, req, res, next);
//   } catch (error) {
//     return errorHandler(
//       {
//         status: 412,
//         message: error.message,
//         data: [],
//       },
//       req,
//       res,
//       next
//     );
//   }
// }

const signUp = async (req, res, next) => {
  try {
    const {
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
      role,
    } = req.body;

    const poolData = {
      UserPoolId: aws.cognito.userpool,
      ClientId: aws.cognito.webclient,
    };

    const userPool = new AmazonCognitoId.CognitoUserPool(poolData);

    const attributeList = [];

    attributeList.push(
      new AmazonCognitoId.CognitoUserAttribute({
        Name: "given_name",
        Value: first_name,
      })
    );

    attributeList.push(
      new AmazonCognitoId.CognitoUserAttribute({
        Name: "family_name",
        Value: last_name,
      })
    );

    attributeList.push(
      new AmazonCognitoId.CognitoUserAttribute({
        Name: "email",
        Value: email,
      })
    );

    // attributeList.push(
    //   new AmazonCognitoId.CognitoUserAttribute({
    //     Name: "phone_number",
    //     Value: `+91${Number(phone_no)}`,
    //   })
    // );

    userPool.signUp(email, password, attributeList, null, async (err, data) => {
      if (err) {
        return errorHandler(
          {
            status: 412,
            message: err.message,
          },
          req,
          res,
          next
        );
      } else {
        const instructorPayload = await instructorService.signUp(
          data.userSub,
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
        );
        return successHandler(instructorPayload, req, res, next);
      }
    });
  } catch (err) {
    return errorHandler(
      {
        status: 412,
        message: err.message,
      },
      req,
      res,
      next
    );
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorHandler(
        { status: 409, message: "Email and password are required" },
        req,
        res,
        next
      );
    }

    const instructor = await instructorService.getInstructorByEmail(email);
    if (!instructor) {
      return errorHandler(
        { status: 404, message: "Instructor not found" },
        req,
        res,
        next
      );
    } else if (!instructor.instructor_role.includes("instructor")) {
      return errorHandler(
        { status: 403, message: CONSTANT.STATUS.ACCESS_DENIED },
        req,
        res,
        next
      );
    }
    const authenticationData = {
      Username: email,
      Password: password,
    };

    const authenticationDetails = new AmazonCognitoId.AuthenticationDetails(
      authenticationData
    );

    const poolData = {
      UserPoolId: aws.cognito.userpool,
      ClientId: aws.cognito.webclient,
    };

    const userPool = new AmazonCognitoId.CognitoUserPool(poolData);
    const userData = {
      Username: email,
      Pool: userPool,
    };

    const cognitoUser = new AmazonCognitoId.CognitoUser(userData);

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        const accessToken = result.getAccessToken().getJwtToken();
        const idToken = result.getIdToken().getJwtToken();
        const refreshToken = result.getRefreshToken().getToken();

        return successHandler(
          {
            status: 200,
            message: "Login successful",
            user_type: "instructor",
            accessToken,
            idToken,
            refreshToken,
          },
          req,
          res,
          next
        );
      },

      onFailure: (err) => {
        return errorHandler(
          { status: 401, message: err.message || "Authentication failed" },
          req,
          res,
          next
        );
      },
    });
  } catch (error) {
    return errorHandler(
      { status: 500, message: error.message, data: [] },
      req,
      res,
      next
    );
  }
};
const getProfile = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const data = await instructorService.getProfile(instructor_id);
    return successHandler(data, req, res, next);
  } catch (err) {
    return errorHandler(
      {
        status: 412,
        message: err.message,
      },
      req,
      res,
      next
    );
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const {
      first_name,
      last_name,
      phone_no,
      avatar,
      gender,
      about,
      country,
      state,
      work_experience,
      current_profile,
      social_media,
      holder_name,
      bank_name,
      account_no,
      ifsc_code,
    } = req.body;
    const data = await instructorService.updateProfile(
      instructor_id,
      first_name,
      last_name,
      phone_no,
      avatar,
      gender,
      about,
      country,
      state,
      work_experience,
      current_profile,
      social_media,
      holder_name,
      bank_name,
      account_no,
      ifsc_code
    );
    return successHandler(data, req, res, next);
  } catch (err) {
    return errorHandler(
      {
        status: 412,
        message: err.message,
      },
      req,
      res,
      next
    );
  }
};

const forgetPassword = async (req, res, next) => {
  try {
    const { email, phone_no } = req.body;

    const data = await instructorService.forgetPassword(email, phone_no);
    return successHandler(data, req, res, next);
  } catch (error) {
    return errorHandler(
      {
        status: 412,
        message: error.message,
      },
      req,
      res,
      next
    );
  }
};

const verifyOtp = async (req, res, next) => {
  const { email, otp } = req.body;
  try {
    const data = await instructorService.verifyOtp(email, otp);
    return successHandler(data, req, res, next);
  } catch (error) {
    return errorHandler(
      {
        status: 412,
        message: error.message,
      },
      req,
      res,
      next
    );
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await instructorService.changePassword(email, password);
    return successHandler(data, req, res, next);
  } catch (error) {
    return errorHandler(
      {
        status: 412,
        message: error.message,
      },
      req,
      res,
      next
    );
  }
};

const getRevenue = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const { page, limit, year } = req.query;
    const data = await instructorService.getRevenue(
      instructor_id,
      page,
      limit,
      year
    );
    return successHandler(data, req, res, next);
  } catch (error) {
    return errorHandler(
      {
        status: 412,
        message: error.message,
      },
      req,
      res,
      next
    );
  }
};

const getActivity = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const { page, limit, monthFilter, yearFilter } = req.query;
    const data = await instructorService.getActivity(
      instructor_id,
      page,
      limit,
      monthFilter,
      yearFilter
    );
    return successHandler(data, req, res, next);
  } catch (error) {
    return errorHandler(
      {
        status: 412,
        message: error.message,
      },
      req,
      res,
      next
    );
  }
};

const getMonthlyStats = async (req, res, next) => {
  try {
    const instructor_id = req.data.sub;
    const { month, year, course_id } = req.query;
    const data = await instructorService.getMonthlyStats(
      instructor_id,
      month,
      year,
      course_id
    );
    return successHandler(data, req, res, next);
  } catch (error) {
    return errorHandler(
      {
        status: 412,
        message: error.message,
      },
      req,
      res,
      next
    );
  }
};

module.exports = {
  signUp,
  login,
  getProfile,
  updateProfile,
  forgetPassword,
  verifyOtp,
  changePassword,
  getRevenue,
  getActivity,
  getMonthlyStats,
};
