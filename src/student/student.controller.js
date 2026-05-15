const AmazonCognitoId = require("amazon-cognito-identity-js");
const studentService = require("./student.service");
const { successHandler, errorHandler } = require("../../packages/handlers");
const { aws } = require("../../packages/config");
const signUp = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password, phone_no, gender, about,country,state } =
      req.body;

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
        const studentPayload = await studentService.signUp(
          data.userSub,
          first_name,
          last_name,
          email,
          password,
          phone_no,
          gender,
          about,
          country,
          state
        );
        return successHandler(studentPayload, req, res, next);
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
    const  student_id  = req.data.sub;
    // console.log("----------",student_id)
    // const {page,limit} = req.query;
    const data = await studentService.getProfile(student_id);
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
    const student_id  = req.data.sub;
    const { first_name, last_name, phone_no, avatar, gender } = req.body;
    const data = await studentService.updateProfile(
      student_id,
      first_name,
      last_name,
      phone_no,
      avatar,
      gender
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

    const data = await studentService.forgetPassword(email, phone_no);
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
    const data = await studentService.verifyOtp(email, otp);
    return successHandler(data, req, res, next);
  } catch (err) {
    res.send(err.message);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await studentService.changePassword(email, password);
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

const purchaseCourse = async (req, res, next) => {
  try {
    const  student_id  = req.data.sub;
    const { course_id, transaction_id, method, amount } = req.body;
    const data = await studentService.purchaseCourse(
      student_id,
      course_id,
      transaction_id,
      method,
      amount
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

const studentActivity = async (req, res, next) => {
  try {
    const student_id  = req.data.sub;
    const { page, limit } = req.query;
    const data = await studentService.studentActivity(student_id, page, limit);
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

const studentPurchases = async (req, res, next) => {
  try {
    const student_id  = req.data.sub;
    const { page, limit } = req.query;
    const data = await studentService.studentPurchases(student_id, page, limit);
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
  purchaseCourse,
  studentActivity,
  studentPurchases
};
