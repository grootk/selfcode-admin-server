const { randomBytes } = require("crypto");
const { CONSTANT, mongoManager } = require("../../packages/manager");
const badges = require("../model/badges.model");

mongoManager.connect();

const getbadges = async (page, limit, search, status) => {
  try {
    // const { page, limit, search, status } = payload;
    const skip = (page - 1) * limit;
    let checkMatch = {};
    if (search) {
      checkMatch = {
        badges_name: new RegExp(`^${search}`, "i"),
      };
    }

    if (status) checkMatch.badges_status = status;

    const getbadgesPayload = await badges.aggregate([
      { $match: checkMatch },
      {
        $project: {
          _id: 0,
          badges_id: 1,
          badges_title: { $ifNull: ["$badges_title", ""] },
          badges_icon: { $ifNull: ["$badges_icon", ""] },
          badges_status: { $ifNull: ["$badges_status", "Active"] },
          createdAt: 1,
          updatedAt: 1,
        },
      },
      { $skip: Number(skip) },
      { $limit: Number(limit) },
    ]);
    const count = await badges.countDocuments({ ...checkMatch });
    const response = getbadgesPayload.length
      ? {
          status: 200,
          message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
          count: count,
          data: getbadgesPayload,
        }
      : {
          status: 409,
          message: CONSTANT.STATUS.SOMETHING_WENT_WRONG,
          data: [],
        };
    return response;
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

const addBadges = async (type, image, category) => {
  try {
    // const { title, icon } = payload
    const addBadgesPayload = await badges.create({
      badge_id: randomBytes(6).toString("hex"),
      badge_type: type,
      badge_category: category,
      badge_image: image,
    });
    const response =
      addBadgesPayload !== null
        ? {
            status: 201,
            message: CONSTANT.PAYLOAD.RECORD_CREATED_SUCCESSFULLY,
            data: addBadgesPayload,
          }
        : {
            status: 409,
            message: CONSTANT.STATUS.SOMETHING_WENT_WRONG,
            data: [],
          };
    return response;
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

const updatebadges = async (badges_id, title, icon, status) => {
  try {
    // const { badges_id,
    //     title,
    //     icon,
    //     status } = payload
    const updatebadgesPayload = await badges.findOneAndUpdate(
      { badges_id: badges_id },
      {
        badges_title: title,
        badges_icon: icon,
        badges_status: status,
      },
      { new: true }
    );
    const response =
      updatebadgesPayload !== null
        ? {
            status: 202,
            message: CONSTANT.PAYLOAD.RECORD_UPDATED_SUCCESSFULLY,
            data: updatebadgesPayload,
          }
        : {
            status: 409,
            message: CONSTANT.STATUS.NOT_FOUND,
            data: [],
          };
    return response;
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

const deletebadges = async (badges_id) => {
  try {
    // const {badges_id}=payload;
    const deletebadgesPayload = await badges.findOneAndDelete({
      badges_id: badges_id,
    });

    const response =
      deletebadgesPayload !== null
        ? {
            status: 202,
            message: CONSTANT.PAYLOAD.RECORD_DELETED_SUCCESSFULLY,
            data: deletebadgesPayload,
          }
        : {
            status: 409,
            message: CONSTANT.STATUS.SOMETHING_WENT_WRONG,
            data: [],
          };
    return response;
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

const getSubbadges = async (page, limit, search, status, badges_id) => {
  try {
    // const { page, limit, search, status,badges_id } = payload;
    const skip = (page - 1) * limit;
    let checkMatch = {};
    if (search) {
      checkMatch = {
        sub_badges_name: new RegExp(`^${search}`, "i"),
      };
    }

    if (status) checkMatch.sub_badges_status = status;
    if (badges_id) checkMatch.badges_id = badges_id;

    const getSubbadgesPayload = await subbadges.aggregate([
      { $match: { ...checkMatch } },
      {
        $project: {
          _id: 0,
          sub_badges_id: 1,
          sub_badges_title: { $ifNull: ["$sub_badges_title", ""] },
          sub_badges_icon: { $ifNull: ["$sub_badges_icon", ""] },
          sub_badges_status: { $ifNull: ["$sub_badges_status", "Active"] },
          createdAt: 1,
          updatedAt: 1,
        },
      },
      { $skip: Number(skip) },
      { $limit: Number(limit) },
    ]);
    const count = await subbadges.countDocuments({ ...checkMatch });
    const response = getSubbadgesPayload.length
      ? {
          status: 200,
          message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
          count: count,
          data: getSubbadgesPayload,
        }
      : {
          status: 409,
          message: CONSTANT.STATUS.SOMETHING_WENT_WRONG,
          data: [],
        };
    return response;
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

const addSubbadges = async (badges_id, title, icon) => {
  try {
    // const { badges_id,title, icon } = payload
    const addSubbadgesPayload = await subbadges.create({
      sub_badges_id: randomBytes(6).toString("hex"),
      badges_id: badges_id,
      sub_badges_title: title,
      sub_badges_icon: icon,
    });
    const response =
      addSubbadgesPayload !== null
        ? {
            status: 201,
            message: CONSTANT.PAYLOAD.RECORD_CREATED_SUCCESSFULLY,
            data: addSubbadgesPayload,
          }
        : {
            status: 409,
            message: CONSTANT.STATUS.SOMETHING_WENT_WRONG,
            data: [],
          };
    return response;
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

const updateSubbadges = async (sub_badges_id, title, icon, status) => {
  try {
    // const { sub_badges_id,
    //     title,
    //     icon,
    //     status } = payload
    const updateSubbadgesPayload = await subbadges.findOneAndUpdate(
      { sub_badges_id: sub_badges_id },
      {
        sub_badges_title: title,
        sub_badges_icon: icon,
        sub_badges_status: status,
      },
      { new: true }
    );
    const response =
      updateSubbadgesPayload !== null
        ? {
            status: 202,
            message: CONSTANT.PAYLOAD.RECORD_UPDATED_SUCCESSFULLY,
            data: updateSubbadgesPayload,
          }
        : {
            status: 409,
            message: CONSTANT.STATUS.NOT_FOUND,
            data: [],
          };
    return response;
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

const deleteSubbadges = async (sub_badges_id) => {
  try {
    // const {sub_badges_id}=payload;
    const deleteSubbadgesPayload = await subbadges.findOneAndDelete({
      sub_badges_id: sub_badges_id,
    });

    const response =
      deleteSubbadgesPayload !== null
        ? {
            status: 202,
            message: CONSTANT.PAYLOAD.RECORD_DELETED_SUCCESSFULLY,
            data: deleteSubbadgesPayload,
          }
        : {
            status: 409,
            message: CONSTANT.STATUS.SOMETHING_WENT_WRONG,
            data: [],
          };
    return response;
  } catch (error) {
    return {
      status: 412,
      message: error.message,
      data: [],
    };
  }
};

module.exports = {
  getbadges,
  addBadges,
  updatebadges,
  deletebadges,
  getSubbadges,
  addSubbadges,
  updateSubbadges,
  deleteSubbadges,
};
