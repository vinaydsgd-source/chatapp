/**
 * Centralised API response messages.
 * Import from here — never hardcode strings in controllers.
 */

const AUTH = {
  ALL_FIELDS_REQUIRED:        'All fields are required',
  EMAIL_IN_USE:               'Email already in use',
  SIGNUP_SUCCESS:             'Account created successfully',
  LOGIN_SUCCESS:              'Login successful',
  INVALID_CREDENTIALS:        'Invalid email or password',
  LOGOUT_SUCCESS:             'Logged out successfully',
  REFRESH_TOKEN_MISSING:      'Refresh token not found',
  REFRESH_TOKEN_INVALID:      'Invalid or expired refresh token',
  EMAIL_REQUIRED:             'Email is required',
  FORGOT_PASSWORD_SENT:       'If that email is registered you will receive reset instructions.',
  FORGOT_PASSWORD_SUCCESS:    'Password reset token generated. In production this would be sent via email.',
  RESET_FIELDS_REQUIRED:      'Token and newPassword are required',
  PASSWORD_TOO_SHORT:         'Password must be at least 6 characters',
  RESET_TOKEN_INVALID:        'Invalid or expired reset token',
  RESET_PASSWORD_SUCCESS:     'Password reset successful. Please login with your new password.',
};

const USER = {
  NOT_AUTHORIZED_NO_TOKEN:    'Not authorized, no token',
  NOT_AUTHORIZED_INVALID:     'Not authorized, invalid token',
  TOKEN_EXPIRED:              'Token expired',
  USER_NOT_FOUND:             'User not found',
};

const CHAT = {
  USER_ID_REQUIRED:           'userId is required',
  SELF_CHAT:                  'Cannot create a chat with yourself',
  CHAT_NOT_FOUND:             'Chat not found',
  GROUP_NOT_FOUND:            'Group chat not found',
  GROUP_NAME_MEMBERS_REQUIRED:'groupName and at least 2 members are required',
  ALREADY_MEMBER:             'User is already a member',
  ADMIN_ONLY_ADD:             'Only the group admin can add members',
  ADMIN_ONLY_REMOVE:          'Only the group admin can remove members',
  CANNOT_REMOVE_ADMIN:        'Cannot remove the group admin',
};

const MESSAGE = {
  CHAT_ID_REQUIRED:           'chatId is required',
  CONTENT_OR_FILE_REQUIRED:   'Message content or file is required',
  CHAT_NOT_FOUND:             'Chat not found',
  MESSAGES_READ:              'Messages marked as read',
};

const UPLOAD = {
  FILE_TYPE_NOT_ALLOWED:      'File type not allowed. Accepted: JPEG, PNG, GIF, WEBP, PDF, DOC, DOCX, TXT',
  FILE_TYPE_NOT_ALLOWED_SHORT:'File type not allowed',
  NO_FILE:                    'No file provided. Send a file in the "file" field.',
  UPLOAD_SUCCESS:             'File uploaded successfully',
};

const COMMON = {
  ROUTE_NOT_FOUND:            'Route not found',
  INTERNAL_ERROR:             'Internal Server Error',
};

module.exports = { AUTH, USER, CHAT, MESSAGE, UPLOAD, COMMON };
