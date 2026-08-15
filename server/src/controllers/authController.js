const authService = require('../services/authService');

const isProduction = process.env.NODE_ENV === 'production';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days (604800000 ms)
});

async function register(req, res, next) {
  try {
    const user = await authService.registerUser(req.body);
    res.status(201).json({
      success: true,
      user
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { accessToken, refreshToken, user } = await authService.loginUser(req.body);

    res.cookie('refreshToken', refreshToken, getCookieOptions());

    res.status(200).json({
      success: true,
      accessToken,
      user
    });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const rawRefreshToken = req.cookies.refreshToken;
    const { accessToken, refreshToken, user } = await authService.refreshSession(rawRefreshToken);

    res.cookie('refreshToken', refreshToken, getCookieOptions());

    res.status(200).json({
      success: true,
      accessToken,
      user
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const rawRefreshToken = req.cookies.refreshToken;
    await authService.revokeSession(rawRefreshToken);

    // Clear cookie using identical config properties
    const clearOptions = { ...getCookieOptions() };
    delete clearOptions.maxAge; // Not required for clearing

    res.clearCookie('refreshToken', clearOptions);

    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  me
};
