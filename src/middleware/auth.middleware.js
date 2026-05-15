const { jwtDecode } = require("jwt-decode");
const { successHandler } = require("../../packages/handlers");
const { CONSTANT } = require("../../packages/manager");

module.exports = async (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) {
    return successHandler(
      {
        status: 401,
        name: "Auth token is required",
      },
      req,
      res,
      next
    );
  }

  try {
    const decode = jwtDecode(token);
        req.data = decode;
     return next();
    // const checkUser = await .findOne({
    //   employee_cognito_id: decode.sub,
      
    // },{
    //   _id:0,
    //   employee_id:1,
    //   employee_role:1,
    //   team_id:1
    // });

    // if (checkUser) {
    //   if (decode["custom:role"]) {
    //     req.data = checkUser;
    //     return next();
    //   } else {
    //     return successHandler(
    //       {
    //         status: 401,
    //         message: CONSTANT.STATUS.UNAUTHORIZED,
    //       },
    //       req,
    //       res,
    //       next
    //     );
    //   }
    // } else {
    //   return successHandler(
    //     {
    //       status: 401,
    //       message: CONSTANT.STATUS.UNAUTHORIZED,
    //     },
    //     req,
    //     res,
    //     next
    //   );
    // }
  } catch (error) {
    return successHandler(
      {
        status: 403,
        message: error.name,
      },
      req,
      res,
      next
    );
  }
};
