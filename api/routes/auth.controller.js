const User = require("../models/User");

const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  // console.log({ username, email, password });
  try {
    //register the user
    const user = await User.create({
      username,
      email,
      password: CryptoJS.AES.encrypt(
        password,
        process.env.SECRET_KEY_FOR_CRYPTOJS
      ).toString(),
    });

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      errorMessage: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    //find the user by email and then match password
    const user = await User.findOne({ email: email });

    //if user is found then compare the password
    if (user) {
      const bytes = CryptoJS.AES.decrypt(
        user.password,
        process.env.SECRET_KEY_FOR_CRYPTOJS
      );
      const originalPassword = bytes.toString(CryptoJS.enc.Utf8);

      if (originalPassword !== password) {
        user = null;
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Incorrect email or password",
      });
    } else {
      //creating a jwt token for the user that has been found
      const accessToken = jwt.sign(
        { id: user._id, isAdmin: user.isAdmin },
        process.env.SECRET_KEY_FOR_CRYPTOJS,
        { expiresIn: "30d" }
      );

      //update the user with the token

      const { password, ...info } = user._doc;

      //return status code along with user that has been found
      res.status(200).json({ ...info, accessToken });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      errorMessage: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
