// BASE URL
export const BASE_URL = "https://nexus-hub-vvqm.onrender.com";

// ==================== AUTH APIs ====================
export const SIGNUP_ADMIN_API = `${BASE_URL}/api/v1/auth/admin/register`;
export const LOGIN_ADMIN_API = `${BASE_URL}/api/v1/auth/admin/login`;
export const LOGIN_MEMBER_API = `${BASE_URL}/api/v1/auth/member/login`;
export const GET_USER_DETAILS_API = `${BASE_URL}/api/v1/auth`;
export const GET_USER_COUNT_API = `${BASE_URL}/api/v1/auth/admin/getUserCount`;
export const LOGOUT_API = `${BASE_URL}/api/v1/auth/user/logoutUser`;
export const FORGOT_USERNAME_API = `${BASE_URL}/api/v1/auth/admin/forgetusername`;

// ==================== ROOM APIs ====================
export const GET_ROOM_ID_BY_USERNAME_API = `${BASE_URL}/api/v1/rooms/getRoomIDbyUsername`;
export const REGISTER_ADMIN_IN_ADDMEMBER_API = `${BASE_URL}/api/v1/rooms/add-member/admin/register`;
export const ADD_MEMBER_API = `${BASE_URL}/api/v1/rooms/member/add`;
export const REMOVE_MEMBER_API = `${BASE_URL}/api/v1/rooms/admin/remove`;
export const GENERATE_INVITE_CODE_API = `${BASE_URL}/api/v1/rooms/admin/invite-code`;
export const GENERATE_ROOM_DETAILS_API = `${BASE_URL}/api/v1/rooms/admin/room-details`;

// ==================== DEVICE APIs ====================
export const REGISTER_DEVICES_API = `${BASE_URL}/api/v1/devices/register`;
export const GET_DEVICES_API = `${BASE_URL}/api/v1/devices/get`;
export const GET_DEVICE_BY_ID_API = `${BASE_URL}/api/v1/devices`;
export const UPDATE_DEVICE_API = `${BASE_URL}/api/v1/devices`;
export const GET_DEVICE_IP_API = `${BASE_URL}/api/v1/devices/deviceIp`;
export const DEVICE_UPDATE = `${BASE_URL}/api/v1/devices/update`;
