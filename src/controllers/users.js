const path = require('path');
const fs = require('fs/promises');
const jimp = require('jimp');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const {
  registerUserService,
  findUserByObjectOfParameters,
  findUserByIdService,
  updateUserByIdService,
  addUserFavoriteByIdService,
  deleteUserFavoriteByIdService,
} = require('../services/users');

const registerController = async (req, res) => {
  try {
    const result = await registerUserService(req.body);

    const { email } = result;

    res.status(201).json({ email });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ code: 'register-email-0102-error' });
    }

    return res.status(400).json({ code: error.message });
  }
};

const loginController = async (req, res) => {
  const { email: requestEmail, password: requestPassword } = req.body;

  try {
    const user = await findUserByObjectOfParameters({ email: requestEmail });

    if (!user) {
      throw new Error('login-0100-error');
    }

    const { _id: userId, password: userPassword } = user;

    const isUsersPasswordMatch = await bcrypt.compare(
      requestPassword,
      userPassword
    );

    if (!isUsersPasswordMatch) {
      throw new Error('login-0101-error');
    }

    const token = jwt.sign({ _id: userId }, process.env.JWT_SECRET);

    await updateUserByIdService(userId, { token });

    const result = { token, userId };

    res.json(result);
  } catch (error) {
    return res.status(401).json({ code: error.message });
  }
};

const refreshController = async (req, res) => {
  const { _id } = req.user;

  try {
    const user = await findUserByIdService(_id);

    if (!user) {
      throw new Error('refresh-no-user');
    }

    const { _id: userId } = user;

    const result = { userId };

    res.json(result);
  } catch (error) {
    return res.status(400).json({ code: error.message });
  }
};

const logoutController = async (req, res) => {
  const { _id } = req.user;

  try {
    const user = await findUserByIdService(_id);

    if (!user) {
      throw new Error('logout-no-user');
    }

    await updateUserByIdService(user._id, { token: null });

    res.status(204).json({});
  } catch (error) {
    return res.status(400).json({ code: error.message });
  }
};

const getCurrentUserInfoController = async (req, res) => {
  const { email, name, address, phone, birthday, avatarURL } = req.user;

  const result = {
    email,
    name,
    address,
    phone,
    birthday,
    avatarURL,
  };

  res.json(result);
};

const updateCurrentUserInfoController = async (req, res) => {
  const { _id } = req.user;
  const body = req.body;

  try {
    await updateUserByIdService(_id, body);

    res.json({ code: 'user-update-success' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ code: 'user-update-email-0102-error' });
    }

    return res.status(400).json({ code: error.message });
  }
};

const getFavoriteController = async (req, res) => {
  const { _id } = req.user;

  try {
    const { favoriteNotices } = await findUserByIdService(_id);

    res.json(favoriteNotices);
  } catch (error) {
    return res.status(400).json({ code: error.message });
  }
};

const updateFavoriteController = async (req, res) => {
  const { _id } = req.user;
  const { noticeId } = req.params;

  try {
    if (!noticeId) {
      throw new Error('favorite-no-id-error');
    }

    await addUserFavoriteByIdService(_id, noticeId);

    res.json({ code: 'favorite-update-success' });
  } catch (error) {
    return res.status(400).json({ code: error.message });
  }
};

const deleteFavoriteController = async (req, res, next) => {
  const { _id } = req.user;
  const { noticeId } = req.params;

  try {
    if (!noticeId) {
      throw new Error('favorite-no-id-error');
    }

    await deleteUserFavoriteByIdService(_id, noticeId);

    res.json('favorite-delete-success-error');
  } catch (error) {
    return res.status(400).json({ code: error.message });
  }
};

const updateAvatarController = async (req, res) => {
  const { _id } = req.user;
  const { path: tempAvatarPath, originalname } = req.file;

  const avatarsPath = path.resolve('./public/avatars');

  const [extension] = originalname.split('.').reverse();

  const avatarName = `${_id}.${extension}`;
  const resultAvatarPath = `${avatarsPath}/${avatarName}`;

  const avatarURL = `${process.env.HOST}/avatars/${avatarName}`;

  try {
    const tempAvatar = await jimp.read(tempAvatarPath);

    const width = tempAvatar.getWidth();
    const height = tempAvatar.getHeight();
    const isHorizontal = width > height;
    const ratio = isHorizontal ? width / height : height / width;
    const newWidth = isHorizontal ? 500 * ratio : 500;
    const newHeight = isHorizontal ? 500 : 500 * ratio;

    await tempAvatar
      .resize(newWidth, newHeight)
      .quality(80)
      .writeAsync(resultAvatarPath);

    await fs.unlink(tempAvatarPath);

    await updateUserByIdService(_id, { avatarURL });

    res.json({ code: 'avatar-update-success' });
  } catch (error) {
    return res.status(500).json({ code: 'avatar-update-error' });
  }
};

const deleteAvatarController = async (req, res) => {
  const { _id, avatarURL } = req.user;

  const [extension] = avatarURL.split('.').reverse();

  const avatarPath = path.resolve(`./public/avatars/${_id}.${extension}`);

  try {
    await fs.unlink(avatarPath);

    await updateUserByIdService(_id, { avatarURL: null });

    res.json({ code: 'avatar-delete-success' });
  } catch (error) {
    return res.status(500).json({ code: 'avatar-delete-error' });
  }
};

module.exports = {
  registerController,
  loginController,
  refreshController,
  logoutController,
  getCurrentUserInfoController,
  updateCurrentUserInfoController,
  updateFavoriteController,
  getFavoriteController,
  deleteFavoriteController,
  updateAvatarController,
  deleteAvatarController,
};
