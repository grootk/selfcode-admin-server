const badgesService = require("./badges.service");
const { successHandler, errorHandler } = require("../../packages/handlers");

const getBadges = async (req, res, next) => {
  try {
    const { page, limit, search, status } = req.query;
    const data = await badgesService.getBadges(page, limit, search, status);
    return successHandler(data, req, res, next);
  } catch (error) {
    return errorHandler(
      {
        status: 412,
        message: error.message,
        data: [],
      },
      req,
      res,
      next
    );
  }
};

const addBadges = async (req, res, next) => {
  try {
    const { type, image, category } = req.body;
    const data = await badgesService.addBadges(type, image, category);
    return successHandler(data, req, res, next);
  } catch (error) {
    return errorHandler(
      {
        status: 412,
        message: err.message,
        data: [],
      },
      req,
      res,
      next
    );
  }
};

const updateBadges = async (req, res, next) => {
  try {
    const { badges_id, title, icon, status } = req.body;
    const data = await badgesService.updatebadges(
      badges_id,
      title,
      icon,
      status
    );
    return successHandler(data, req, res, next);
  } catch (error) {
    return errorHandler(
      {
        status: 412,
        message: err.message,
        data: [],
      },
      req,
      res,
      next
    );
  }
};

const deleteBadges = async (req, res, next) => {
  try {
    const { badges_id } = req.query;
    const data = await badgesService.deleteBadges(badges_id);
    return successHandler(data, req, res, next);
  } catch (error) {
    return errorHandler(
      {
        status: 412,
        message: error.message,
        data: [],
      },
      req,
      res,
      next
    );
  }
};

module.exports = {
  getBadges,
  addBadges,
  updateBadges,
  deleteBadges,
};
