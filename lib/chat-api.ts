"use client"

import { getApiKey, getAdminKey } from "@/lib/auth"

const API_BASE = process.env.NEXT_PUBLIC_BASE_URL!

export interface ChatSummary {
  id: string
  title: string
  created_at: string
}

export interface ChatMessageRecord {
  role: "user" | "assistant" | "system"
  content: string | any // Allow complex content for vision/structured data
  created_at?: string
}

export interface ChatDetailResponse {
  success: boolean
  chat: ChatSummary
  messages: ChatMessageRecord[]
  error?: string
}

export interface ChatsListResponse {
  success: boolean
  chats: ChatSummary[]
  error?: string
}

export interface CreateChatResponse {
  success: boolean
  chat: ChatSummary
  error?: string
}

export interface DeleteChatResponse {
  success: boolean
  message?: string
  error?: string
}

export interface ChatCompletionResponse {
  success: boolean
  model?: string
  data?: Array<{
    message?: {
      content?: string
    }
    text?: string
  }>
  error?: string
}

export interface TTSResponse {
  success: boolean
  audio_url?: string
  error?: string
}

export interface TranscriptionResponse {
  success: boolean
  text?: string
  transcript?: string
  error?: string
}

export interface UpdateTokensResponse {
  success: boolean
  tokens_used?: number
  tokens_limit?: number
  error?: string
}

export interface Plan {
  id: string
  name: string
  price: number
  currency?: string
  tokens_limit: number
  images_limit: number
  personas_limit: number
  features?: string[]
  is_active?: boolean
  description?: string
  status?: string
  plan_name?: string
  price_inr?: number
  daily_chat_limit?: number
  daily_coding_limit?: number
  daily_vision_limit?: number
  monthly_image_limit?: number
  monthly_flux_limit?: number
  daily_tts_limit?: number
  daily_stt_limit?: number
}

export interface PlansListResponse {
  success: boolean
  plans?: Plan[]
  error?: string
}

export async function getPlansList() {
  const res = await fetch(`${API_BASE}/public/plans`, {
    method: "GET",
    // No headers to ensure completely public access
  })

  const data = await parseJson<PlansListResponse>(res)
  console.log("getPlansList API Response:", data);
  if (!res.ok) {
    throw new Error(data.error || "Unable to fetch plans.")
  }
  return data
}

export async function updateTokens(userId: string, newLimit: number) {
  // Backend doesn't have a direct token update endpoint
  // We'll need to add this to admin routes
  const res = await fetch(`${API_BASE}/admin/users/${userId}/tokens`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ daily_chat_limit: newLimit }),
  })

  const data = await parseJson<UpdateTokensResponse>(res)
  if (!res.ok) {
    throw new Error(data.error || "Unable to update tokens.")
  }
  return data
}

export interface FreezeUserResponse {
  success: boolean
  message?: string
  user_id?: string
  error?: string
}

export async function freezeUser(userId: string) {
  const res = await fetch(`${API_BASE}/admin/users/${userId}/freeze`, {
    method: "POST",
    headers: getHeaders(),
  })
  const data = await parseJson<FreezeUserResponse>(res)
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Access Denied: You do not have permission to freeze this user. Global Admin privileges required.")
  }
  return data
}

export async function unfreezeUser(userId: string) {
  const res = await fetch(`${API_BASE}/admin/users/${userId}/unfreeze`, {
    method: "POST",
    headers: getHeaders(),
  })
  const data = await parseJson<FreezeUserResponse>(res)
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Access Denied: You do not have permission to unfreeze this user. Global Admin privileges required.")
  }
  return data
}

export interface DeleteUserResponse {
  success: boolean
  message?: string
  error?: string
}

export async function deleteAdminUser(userId: string) {
  const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: "DELETE",
    headers: getHeaders(),
  })
  const data = await parseJson<DeleteUserResponse>(res)
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to delete user.")
  }
  return data
}

export async function deleteSchoolFaculty(adminCode: string) {
  const res = await fetch(`${API_BASE}/school/faculty/${encodeURIComponent(adminCode)}`, {
    method: "DELETE",
    headers: getHeaders(),
  })
  const data = await parseJson<DeleteUserResponse>(res)
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to delete faculty.")
  }
  return data
}

export async function deleteSchoolStudent(studentId: string) {
  const res = await fetch(`${API_BASE}/school/students/${studentId}`, {
    method: "DELETE",
    headers: getHeaders(),
  })
  const data = await parseJson<DeleteUserResponse>(res)
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to delete student.")
  }
  return data
}

export interface UpdatePlanResponse {
  success: boolean
  plan?: Plan
  error?: string
}


export async function updatePlan(planId: string, data: Partial<Plan>) {
  const res = await fetch(`${API_BASE}/admin/plans/${planId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  })

  const responseData = await parseJson<UpdatePlanResponse>(res)
  if (!res.ok) {
    throw new Error(responseData.error || "Unable to update plan.")
  }
  return responseData
}

export interface CreatePlanResponse {
  success: boolean
  plan?: Plan
  error?: string
}

export async function createPlan(data: Partial<Plan>) {
  const res = await fetch(`${API_BASE}/admin/plans`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  })

  const responseData = await parseJson<CreatePlanResponse>(res)
  if (!res.ok) {
    throw new Error(responseData.error || "Unable to create plan.")
  }
  return responseData
}

export interface SubscriptionStatusResponse {
  success: boolean
  subscription?: {
    plan_id: number
    plan_name: string
    price_inr: number
    details: {
      daily_chat_limit: number
      daily_coding_limit: number
      daily_vision_limit: number
      daily_tts_limit: number
      daily_stt_limit: number
      monthly_image_limit: number
      monthly_flux_limit: number
    }
  }
  usage?: {
    daily_chats: number
    daily_codings: number
    daily_visions: number
    daily_tts: number
    daily_stt: number
    monthly_images: number
    monthly_flux: number
    last_reset: string
  }
  error?: string
}

export async function getSubscriptionStatus() {
  const res = await fetch(`${API_BASE}/subscription/status`, {
    method: "GET",
    headers: getHeaders(),
  })

  const data = await parseJson<SubscriptionStatusResponse>(res)
  if (!res.ok) {
    throw new Error(data.error || "Unable to fetch subscription status.")
  }
  return data
}

export interface AdminUser {
  id: string
  name: string
  email: string
  is_frozen: boolean
  plan_name: string
  created_at: string
  subscription: {
    plan: string
    status: string
    daily_chats: number
    daily_codings: number
    daily_visions: number
    daily_tts: number
    daily_stt: number
    monthly_images: number
    monthly_flux: number
    tokens_used: number
    tokens_limit: number
    images_used: number
    images_limit: number
    personas_used: number
    personas_limit: number
    latency_ms: number
    daily_chat_limit: number
    daily_coding_limit: number
    daily_vision_limit: number
    daily_tts_limit: number
    daily_stt_limit: number
    monthly_image_limit: number
    monthly_flux_limit: number
  }
}

export interface AdminUsersResponse {
  success: boolean
  users?: AdminUser[]
  error?: string
}

export interface FrozenUser {
  user_id: string
  name: string
  email: string
  original_plan_id: number
  original_plan_name: string | null
  frozen_at: string
}

export interface FrozenUsersResponse {
  success: boolean
  count?: number
  frozen_users?: FrozenUser[]
  error?: string
}

export async function getFrozenUsers() {
  const res = await fetch(`${API_BASE}/admin/users/frozen`, {
    method: "GET",
    headers: getHeaders(),
  })
  const data: FrozenUsersResponse = await res.json()
  if (!res.ok) throw new Error(data.error || "Unable to fetch frozen users")
  return data
}

export async function getAdminUsers() {
  const [usersRes, frozenRes] = await Promise.all([
    fetch(`${API_BASE}/admin/users`, { method: "GET", headers: getHeaders() }),
    getFrozenUsers().catch(() => ({ success: true, frozen_users: [] as FrozenUser[] })),
  ])

  const data = await usersRes.json()
  if (!usersRes.ok) {
    throw new Error(data.error || "Unable to fetch users.")
  }

  const frozenUserIds = new Set((frozenRes.frozen_users || []).map(f => f.user_id))

  // Map flat backend response to nested frontend interface
  if (data.success && Array.isArray(data.users)) {
    data.users = data.users.map((u: any) => {
      const isFrozen = frozenUserIds.has(u.id);
      return {
      id: u.id,
      name: u.name,
      email: u.email,
      is_frozen: isFrozen,
      plan_name: u.plan_name || "Free Trial",
      created_at: u.created_at,
      subscription: {
        plan: isFrozen ? "Frozen" : (u.plan_name || "Free Trial"),
        status: isFrozen ? "frozen" : "active",
        daily_chats: u.daily_chats || 0,
        daily_codings: u.daily_codings || 0,
        daily_visions: u.daily_visions || 0,
        daily_tts: u.daily_tts || 0,
        daily_stt: u.daily_stt || 0,
        monthly_images: u.monthly_images || 0,
        monthly_flux: u.monthly_flux || 0,
        tokens_used: u.daily_chats || 0,
        tokens_limit: 1000,
        images_used: u.monthly_images || 0,
        images_limit: 100,
        personas_used: (u.daily_codings || 0) + (u.daily_visions || 0),
        personas_limit: 10,
        latency_ms: 24,
        daily_chat_limit: 0,
        daily_coding_limit: 0,
        daily_vision_limit: 0,
        daily_tts_limit: 0,
        daily_stt_limit: 0,
        monthly_image_limit: 0,
        monthly_flux_limit: 0,
      }
    }})
  }

  return data as AdminUsersResponse
}

export async function adminLogin(adminKey: string) {
  console.log("[adminLogin] API_BASE:", process.env.NEXT_PUBLIC_BASE_URL);
  console.log("[adminLogin] Key length:", adminKey.length);
  
  // Backend expects 'admin_key' in body (see backend/src/admin.js:7)
  try {
    const loginRes = await fetch(`${API_BASE}/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getApiKey() || "",
        "x-admin-key": adminKey
      },
      body: JSON.stringify({ admin_key: adminKey })
    });
    
    console.log("[adminLogin] Login status:", loginRes.status);
    const loginText = await loginRes.text();
    console.log("[adminLogin] Login response:", loginText);
    
    if (loginRes.ok) {
      const loginData = JSON.parse(loginText);
      return loginData;
    }
    
    // If login fails, try validation endpoint
    const validateRes = await fetch(`${API_BASE}/admin/users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getApiKey() || "",
        "x-admin-key": adminKey
      }
    });
    
    console.log("[adminLogin] Validation status:", validateRes.status);
    const validateText = await validateRes.text();
    console.log("[adminLogin] Validation response:", validateText);
    
    if (validateRes.ok) {
      return { success: true, message: "Admin authenticated via validation" };
    }
    
    // Parse error
    let errorMsg = "Invalid Admin Key";
    try {
      const errData = JSON.parse(loginText);
      errorMsg = errData.error || errData.message || errorMsg;
    } catch (e) {
      errorMsg = `Server error (${loginRes.status}): ${loginText.substring(0, 100)}`;
    }
    throw new Error(errorMsg);
    
  } catch (error: any) {
    console.error("[adminLogin] Error:", error);
    if (error.message.includes('fetch')) {
      throw new Error("Cannot connect to backend. Verify NEXT_PUBLIC_BASE_URL is set correctly.");
    }
    throw error;
  }
}

export interface AdminCredentialLoginResponse {
  success: boolean
  api_key?: string
  role?: string
  message?: string
  error?: string
}

export async function adminLoginWithCredentials(adminCode: string, password: string) {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      admin_code: adminCode,
      username: adminCode,
      password,
    }),
  })

  const data = await parseJson<AdminCredentialLoginResponse>(res)
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Global admin login failed")
  }
  return data
}

export interface AdminCodeLoginResponse {
  success: boolean
  api_key?: string
  role?: string
  name?: string
  school_id?: number
  error?: string
}

export async function loginByAdminCode(admin_code: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/admin-code/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      admin_code,
      password,
    }),
  })

  const data = await parseJson<AdminCodeLoginResponse>(res)
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Admin code login failed")
  }
  return data
}

export interface CreateSchoolAdminPayload {
  school_name: string
  school_code: string
  admin_name: string
  admin_email: string
  admin_password: string
  student_limit?: number
}

export interface CreateSchoolAdminResponse {
  success: boolean
  school?: { id: number }
  admin?: { id: string; name: string; admin_code: string }
  email_sent?: boolean
  error?: string
}

export interface AdminRequest {
  id: number
  school_name: string
  admin_name: string
  admin_email: string
  admin_password: string
  status: string
  created_at: string
  reviewed_at?: string
}

export interface AdminRequestsResponse {
  success: boolean
  requests?: AdminRequest[]
  count?: number
  error?: string
}

export async function getAdminRequests() {
  const res = await fetch(`${API_BASE}/admin/requests`, {
    method: "GET",
    headers: getHeaders(),
  })
  const data = await parseJson<AdminRequestsResponse>(res)
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Unable to fetch requests")
  }
  return data
}

export interface DeclineRequestResponse {
  success: boolean
  message?: string
  error?: string
}

export async function declineAdminRequest(requestId: number) {
  const res = await fetch(`${API_BASE}/admin/requests/${requestId}/decline`, {
    method: "POST",
    headers: getHeaders(),
  })
  const data = await parseJson<DeclineRequestResponse>(res)
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Unable to decline request")
  }
  return data
}

export async function createSchoolAdmin(payload: CreateSchoolAdminPayload) {
  const res = await fetch(`${API_BASE}/admin/onboard-school`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      school_name: payload.school_name,
      school_code: payload.school_code,
      admin_name: payload.admin_name,
      admin_email: payload.admin_email,
      admin_password: payload.admin_password,
      student_limit: payload.student_limit ?? 100,
    }),
  });

  const data = await parseJson<{ success: boolean; school?: { id: number }; admin?: { id: string; name: string; admin_code: string }; error?: string }>(res);
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to create school admin");
  }

  const combined: CreateSchoolAdminResponse = {
    success: true,
    school: data.school,
    admin: data.admin,
  };
  return combined;
}

export interface FacultyStats {
  quota: number
  assigned: number
  performance_avg: string
  attendance_rate: string
  node_distribution?: Array<{ assigned_class: string; activity_count: number }>
  trends?: any[]
}

export interface SchoolStatsResponse {
  success: boolean
  school_name?: string
  school_code?: string
  total_students?: string | number
  total_faculty?: string | number
  faculty_stats?: FacultyStats
  node_distribution?: Array<{ assigned_class: string; activity_count: number }>
  engagement_distribution?: Array<{ action: string; count: number }>
  leaderboard?: Array<{ name: string; daily_chats: number }>
  error?: string
}

export interface SchoolFacultyMember {
  id: string
  name: string
  email?: string
  admin_code?: string
  student_quota?: number
  assigned_class?: string
  created_at?: string
}

export interface SchoolFacultyListResponse {
  success: boolean
  count?: number
  faculty?: SchoolFacultyMember[]
  error?: string
}

export interface CreateSchoolFacultyPayload {
  name: string
  email?: string
  password: string
  quota?: number
  assigned_class?: string
  admin_code: string
}

export interface CreateSchoolFacultyResponse {
  success: boolean
  faculty?: SchoolFacultyMember
  error?: string
}

export interface SchoolStudent {
  id: string
  name: string
  roll_no?: string
  mobile_number?: string
  assigned_class?: string
  total_score?: number
  daily_chats?: number
  created_at?: string
}

export interface CreateSchoolStudentPayload {
  name: string
  roll_no: string
  password: string
  assigned_class?: string
}

export interface CreateSchoolStudentResponse {
  success: boolean
  student?: { id: string; name: string; roll_no: string }
  error?: string
}

export interface SchoolStudentsResponse {
  success: boolean
  count?: number
  students?: SchoolStudent[]
  error?: string
}

export async function getSchoolStats() {
  const res = await fetch(`${API_BASE}/school/stats`, {
    method: "GET",
    headers: getHeaders(),
  })
  const data = await parseJson<SchoolStatsResponse>(res)
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Unable to fetch school stats")
  }
  return data
}

export async function getSchoolFaculty() {
  const res = await fetch(`${API_BASE}/school/faculty`, {
    method: "GET",
    headers: getHeaders(),
  })
  const data = await parseJson<SchoolFacultyListResponse>(res)
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Unable to fetch faculty")
  }
  return data
}

export async function createSchoolFaculty(payload: CreateSchoolFacultyPayload) {
  const res = await fetch(`${API_BASE}/school/faculty`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })
  const data = await parseJson<CreateSchoolFacultyResponse>(res)
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Unable to create faculty")
  }
  return data
}

export async function getSchoolStudents(className?: string) {
  const url = new URL(`${API_BASE}/school/students`)
  if (className?.trim()) {
    url.searchParams.set("class_name", className.trim())
  }
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: getHeaders(),
  })
  const data = await parseJson<SchoolStudentsResponse>(res)
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Unable to fetch students")
  }
  return data
}

export interface StudentSignupPayload {
  name: string
  mobile_number: string
  school_code: string
  password: string
}

export interface StudentSignupResponse {
  success: boolean
  api_key?: string
  message?: string
  error?: string
}

export interface GoogleLoginPayload {
  google_id: string
  email: string
  name?: string
}

export interface GoogleLoginResponse {
  success: boolean
  api_key?: string
  message?: string
  error?: string
}

export async function googleLogin(payload: GoogleLoginPayload) {
  const res = await fetch(`${API_BASE}/auth/3rdparty/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const data = await parseJson<GoogleLoginResponse>(res)
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Google sign-in failed")
  }
  return data
}

export interface GithubLoginPayload {
  github_id: string
  email?: string
  name?: string
}

export interface GithubLoginResponse {
  success: boolean
  api_key?: string
  message?: string
  error?: string
}

export async function githubLogin(payload: GithubLoginPayload) {
  const res = await fetch(`${API_BASE}/auth/3rdparty/github`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const data = await parseJson<GithubLoginResponse>(res)
  if (!res.ok || !data.success) {
    throw new Error(data.error || "GitHub sign-in failed")
  }
  return data
}

export interface StudentLoginPayload {
  roll_no: string
  school_code: string
  password: string
}

export interface StudentLoginResponse {
  success: boolean
  api_key?: string
  name?: string
  school_name?: string
  role?: string
  error?: string
}

export async function studentLogin(payload: StudentLoginPayload) {
  const res = await fetch(`${API_BASE}/auth/student/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const data = await parseJson<StudentLoginResponse>(res)
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Student login failed")
  }
  return data
}

export async function studentSignup(payload: StudentSignupPayload) {
  const res = await fetch(`${API_BASE}/auth/student/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const data = await parseJson<StudentSignupResponse>(res)
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Unable to create student")
  }
  return data
}

export async function createSchoolStudent(payload: CreateSchoolStudentPayload) {
  const res = await fetch(`${API_BASE}/school/students`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })
  const data = await parseJson<CreateSchoolStudentResponse>(res)
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Unable to create student")
  }
  return data
}

// ─── Admin-level API helpers for School Admin features ───

export interface AdminSchool {
  id: number
  school_name: string
  school_code: string
  created_at: string
}

export interface AdminSchoolsResponse {
  success: boolean
  count?: number
  schools?: AdminSchool[]
  error?: string
}

export async function getAdminSchools() {
  const res = await fetch(`${API_BASE}/admin/schools`, {
    method: "GET",
    headers: getHeaders(),
  })
  const data = await parseJson<AdminSchoolsResponse>(res)
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Unable to fetch schools")
  }
  return data
}

export interface AdminSchoolAdmin {
  id: string
  name: string
  email?: string
  admin_code: string
  school_name: string
  student_count: number
}

export interface AdminSchoolAdminsResponse {
  success: boolean
  admins?: AdminSchoolAdmin[]
  error?: string
}

export async function getAdminSchoolAdmins() {
  const res = await fetch(`${API_BASE}/admin/school-admins`, {
    method: "GET",
    headers: getHeaders(),
  })
  const data = await parseJson<AdminSchoolAdminsResponse>(res)
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Unable to fetch school admins")
  }
  return data
}

// Admin: fetch faculty list for a specific school by code
export interface AdminSchoolFacultyListResponse {
  success: boolean
  faculty?: SchoolFacultyMember[]
  error?: string
}

export async function getAdminSchoolFacultyByCode(schoolCode: string) {
  try {
    const res = await fetch(`${API_BASE}/admin/schools/code/${encodeURIComponent(schoolCode)}/faculty`, {
      method: "GET",
      headers: getHeaders(),
    })
    const text = await res.text()
    try {
      const data = JSON.parse(text) as AdminSchoolFacultyListResponse
      if (!res.ok || !data.success) {
        return { success: false, faculty: [], error: data.error || "Unable to fetch school faculty" }
      }
      return data
    } catch {
      // Endpoint likely not available on this backend; fail gracefully
      return { success: false, faculty: [], error: 'Faculty endpoint not available' }
    }
  } catch (e: any) {
    return { success: false, faculty: [], error: e.message || 'Failed to fetch school faculty' }
  }
}

export interface AdminActivityItem {
  type: "school" | "enterprise"
  institution: string
  user_name: string
  activity_type: string
  created_at: string
}

export interface AdminActivityResponse {
  success: boolean
  activity?: AdminActivityItem[]
  error?: string
}

export async function getAdminActivity() {
  const res = await fetch(`${API_BASE}/admin/activity`, {
    method: "GET",
    headers: getHeaders(),
  })
  const data = await parseJson<AdminActivityResponse>(res)
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Unable to fetch activity logs")
  }
  return data
}

export interface AdminPlan {
  id: number
  plan_name: string
  price_inr: number
  daily_chat_limit: number
  daily_coding_limit: number
  daily_vision_limit: number
  daily_tts_limit: number
  daily_stt_limit: number
  monthly_image_limit: number
  monthly_flux_limit: number
}

export interface AdminPlansResponse {
  success: boolean
  plans?: AdminPlan[]
  error?: string
}

export async function getAdminPlans() {
  const res = await fetch(`${API_BASE}/admin/plans`, {
    method: "GET",
    headers: getHeaders(),
  })
  const data = await parseJson<AdminPlansResponse>(res)
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Unable to fetch plans")
  }
  return data
}

function getHeaders() {
  return {
    "Content-Type": "application/json",
    "x-api-key": getApiKey() || "",
    "x-admin-key": getAdminKey() || "",
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    console.error('[parseJson] Failed to parse JSON. Response:', text.substring(0, 200));
    throw new Error('Server returned invalid response. Please check your connection and try again.');
  }
}

export async function listChats() {
  const res = await fetch(`${API_BASE}/chats`, {
    method: "GET",
    headers: getHeaders(),
  })

  const data = await parseJson<ChatsListResponse>(res)
  if (!res.ok) {
    throw new Error(data.error || "Unable to load chats.")
  }
  return data
}

export async function createChat(title: string) {
  const res = await fetch(`${API_BASE}/chats`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ title }),
  })

  const data = await parseJson<CreateChatResponse>(res)
  if (!res.ok) {
    throw new Error(data.error || "Unable to create chat.")
  }
  return data
}

export async function getChatHistory(chatId: string) {
  const res = await fetch(`${API_BASE}/chats/${chatId}`, {
    method: "GET",
    headers: getHeaders(),
  })

  const data = await parseJson<ChatDetailResponse>(res)
  if (!res.ok) {
    throw new Error(data.error || "Unable to fetch chat history.")
  }
  return data
}

export async function saveChatMessage(chatId: string, role: "user" | "assistant" | "system", content: string) {
  const res = await fetch(`${API_BASE}/chats/${chatId}/messages`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ role, content }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || "Unable to sync message.")
  }
  return data
}

export interface UpdateChatResponse {
  success: boolean
  message?: string
  error?: string
}

export async function updateChat(chatId: string, title: string) {
  const res = await fetch(`${API_BASE}/chats/${chatId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ title }),
  })

  const data = await parseJson<UpdateChatResponse>(res)
  if (!res.ok) {
    throw new Error(data.error || "Unable to update chat.")
  }
  return data
}

export async function deleteChat(chatId: string) {
  const res = await fetch(`${API_BASE}/chats/${chatId}`, {
    method: "DELETE",
    headers: getHeaders(),
  })

  const data = await parseJson<DeleteChatResponse>(res)
  if (!res.ok) {
    throw new Error(data.error || "Unable to delete chat.")
  }
  return data
}

export interface MessageFeedbackResponse {
  success: boolean
  message?: string
  error?: string
}

export async function sendMessageFeedback(messageId: string, feedback: number) {
  const res = await fetch(`${API_BASE}/messages/${messageId}/feedback`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ feedback }),
  })

  const data = await parseJson<MessageFeedbackResponse>(res)
  if (!res.ok) {
    throw new Error(data.error || "Unable to save feedback.")
  }
  return data
}

export async function sendAiRequest(payload: {
  endpoint: string
  messages: Array<{ role: "user" | "assistant" | "system"; content: any }>
  chat_id?: string
  modality?: string
}) {
  const fullUrl = `${API_BASE}${payload.endpoint}`;
  console.log(`[sendAiRequest] Fetching: ${fullUrl}`);
  console.log(`[sendAiRequest] Payload:`, JSON.stringify(payload.messages));
  
  const res = await fetch(fullUrl, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      messages: payload.messages,
      ...(payload.modality ? { modality: payload.modality } : {}),
      ...(payload.chat_id ? { chat_id: payload.chat_id } : {}),
    }),
  })

  const responseText = await res.text();
  console.log(`[sendAiRequest] Raw response:`, responseText);
  
  let data: ChatCompletionResponse;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    console.error(`[sendAiRequest] Failed to parse JSON:`, e);
    throw new Error("Invalid response from server");
  }
  
  console.log(`[sendAiRequest] Parsed data:`, data);
  
  if (!res.ok) {
    throw new Error(data.error || "Unable to process your request.")
  }
  return data
}

export async function sendAiRequestStream(
  payload: {
    endpoint: string
    messages: Array<{ role: "user" | "assistant" | "system"; content: any }>
    chat_id?: string
    modality?: string
  },
  onChunk: (text: string) => void
): Promise<string> {
  const fullUrl = `${API_BASE}${payload.endpoint}`;
  console.log(`[sendAiRequestStream] Fetching: ${fullUrl}`);

  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      ...getHeaders(),
      "Accept": "text/event-stream",
    },
    body: JSON.stringify({
      messages: payload.messages,
      stream: true,
      ...(payload.modality ? { modality: payload.modality } : {}),
      ...(payload.chat_id ? { chat_id: payload.chat_id } : {}),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Unable to process your request.");
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  if (!reader) {
    throw new Error("Stream not supported");
  }

  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content
            || parsed.choices?.[0]?.message?.content
            || parsed.data?.[0]?.text
            || parsed.data?.[0]?.message?.content
            || "";
          if (content) {
            fullText += content;
            onChunk(fullText);
          }
        } catch (e) {
          // Ignore parse errors for intermediate chunks
        }
      }
    }
  }

  return fullText;
}

export async function sendChatCompletion(payload: {
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>
  chat_id?: string
}) {
  return sendAiRequest({
    endpoint: "/chat",
    messages: payload.messages,
    chat_id: payload.chat_id,
    modality: "text",
  })
}

export async function generateTTSAudio(text: string, language: string = 'hi-IN') {
  try {
    const res = await fetch(`${API_BASE}/tts/generate`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ text, language }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || "Unable to generate speech.")
    }

    const data = await res.json()
    if (!data.success || !data.audioData) {
      throw new Error("Invalid TTS response from server")
    }

    // Convert base64 to blob more robustly
    const binaryString = window.atob(data.audioData)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Detect format if possible, default to mpeg
    return new Blob([bytes], { type: 'audio/mpeg' })
  } catch (error) {
    console.error("TTS API Error:", error)
    throw error
  }
}

export async function transcribeSpeech(audioBlob: Blob, language: string = 'hi-IN'): Promise<string> {
  const MAX_RETRIES = 2

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[transcribeSpeech] Attempt ${attempt + 1}:`, { size: audioBlob.size, type: audioBlob.type })
      
      const formData = new FormData()
      
      let extension = 'webm'
      const mimeType = audioBlob.type || 'audio/webm'
      if (mimeType.includes('mp4')) extension = 'mp4'
      else if (mimeType.includes('mpeg') || mimeType.includes('mp3')) extension = 'mp3'
      
      formData.append("file", audioBlob, `recording.${extension}`)
      formData.append("language", language)
      
      const apiKey = getApiKey()
      const adminKey = getAdminKey()
      
      const res = await fetch(`${API_BASE}/speech/transcribe`, {
        method: "POST",
        headers: {
          "x-api-key": apiKey || "",
          "x-admin-key": adminKey || "",
        },
        body: formData,
      })
  
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || data.details || "Unable to transcribe speech.")
      }

      const transcript = data.transcript || data.text || ""
      
      if (!transcript.trim()) {
        throw new Error("Empty transcription")
      }
      
      console.log(`[transcribeSpeech] Success:`, transcript.substring(0, 50) + "...")
      return transcript
      
    } catch (error: any) {
      const isLimitReached = error.message?.includes("Limit Reached") || error.message?.includes("429");
      console.error(`[transcribeSpeech] Attempt ${attempt + 1} failed:`, error.message)
      
      if (attempt === MAX_RETRIES || isLimitReached) {
        if (isLimitReached) {
          throw new Error("Speech Limit Reached: You have exhausted your daily speech-to-text limit. Please try again tomorrow or upgrade your plan.")
        }
        throw new Error("Transcription failed: " + error.message)
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  throw new Error("Transcription failed after all retries")
}

// ─── Arena endpoints ───

export interface ArenaHistoryItem {
  id: string
  topic: string
  difficulty: string
  question_count: number
  status: string
  created_at: string
  participant_count?: number
  leaderboard?: Array<{
    name: string
    score: number
    time_taken: number
    rank: number
  }>
}

export interface ArenaHistoryResponse {
  success: boolean
  history?: ArenaHistoryItem[]
  error?: string
}

export async function getArenaHistory() {
  const res = await fetch(`${API_BASE}/arena/history`, {
    method: "GET",
    headers: getHeaders(),
  })
  const data = await parseJson<any>(res)
  console.log("[getArenaHistory] Raw response:", data)

  const normalized: ArenaHistoryResponse = {
    success: data.success ?? true,
    history: data.history || data.data || [],
    error: data.error,
  }

  if (!res.ok || !normalized.success) {
    throw new Error(normalized.error || "Unable to fetch arena history")
  }
  return normalized
}

export interface GlobalLeaderboardEntry {
  rank: number
  name: string
  score: number
  arena_wins?: number
  mock_tests?: number
  activities?: number
}

export interface GlobalLeaderboardResponse {
  success: boolean
  leaderboard?: GlobalLeaderboardEntry[]
  error?: string
}

export async function getGlobalLeaderboard() {
  const res = await fetch(`${API_BASE}/leaderboard/global`, {
    method: "GET",
    headers: getHeaders(),
  })
  const data = await parseJson<any>(res)
  console.log("[getGlobalLeaderboard] Raw response:", data)

  const raw = data.leaderboard || data.data || []
  const leaderboard: GlobalLeaderboardEntry[] = (Array.isArray(raw) ? raw : []).map((e: any) => ({
    rank: Number(e.rank) || 0,
    name: e.name ?? "",
    score: Number(e.score ?? e.points ?? e.total_score ?? 0),
    arena_wins: Number(e.arena_wins ?? e.wins ?? 0),
    mock_tests: Number(e.mock_tests ?? e.tests ?? 0),
    activities: Number(e.activities ?? e.activity_count ?? 0),
  }))

  const normalized: GlobalLeaderboardResponse = {
    success: data.success ?? true,
    leaderboard,
    error: data.error,
  }

  if (!res.ok || !normalized.success) {
    throw new Error(normalized.error || "Unable to fetch global leaderboard")
  }
  return normalized
}

export interface UserAnalyticsData {
  total_battles: number
  total_wins: number
  total_participation: number
  win_rate: number
  recent_battles?: Array<{
    topic: string
    difficulty: string
    score: number
    rank: number
    created_at: string
  }>
}

export interface UserAnalyticsResponse {
  success: boolean
  analytics?: UserAnalyticsData
  error?: string
}

export async function getUserAnalytics() {
  const res = await fetch(`${API_BASE}/user/analytics`, {
    method: "GET",
    headers: getHeaders(),
  })
  const data = await parseJson<any>(res)
  console.log("[getUserAnalytics] Raw response:", data)

  const raw = data.analytics || data.data || (data.success !== undefined && data.total_battles !== undefined ? data : null)
  const analytics: UserAnalyticsData | undefined = raw ? {
    total_battles: raw.total_battles ?? 0,
    total_wins: raw.total_wins ?? 0,
    total_participation: raw.total_participation ?? 0,
    win_rate: raw.win_rate ?? 0,
    recent_battles: raw.recent_battles ?? undefined,
  } : undefined

  const normalized: UserAnalyticsResponse = {
    success: data.success ?? true,
    analytics,
    error: data.error,
  }

  if (!res.ok || !normalized.success) {
    throw new Error(normalized.error || "Unable to fetch user analytics")
  }
  return normalized
}

// ─── Site Settings (Footer Pages) ───

export interface SiteSetting {
  key: string
  value: string
  updated_at: string
}

export interface SiteSettingsResponse {
  success: boolean
  settings?: SiteSetting[]
  error?: string
}

export interface UpdateSiteSettingResponse {
  success: boolean
  setting?: SiteSetting
  error?: string
}

export async function getSiteSettings() {
  const res = await fetch(`${API_BASE}/admin/settings`, {
    method: "GET",
    headers: getHeaders(),
  })
  const data = await parseJson<SiteSettingsResponse>(res)
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Unable to fetch site settings")
  }
  return data
}

export async function getPublicSiteSettings() {
  const res = await fetch(`${API_BASE}/public/settings`, {
    method: "GET",
  })
  const data = await parseJson<SiteSettingsResponse>(res)
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Unable to fetch site settings")
  }
  return data
}

export async function updateSiteSetting(key: string, value: string) {
  const res = await fetch(`${API_BASE}/admin/settings/${key}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ value }),
  })
  const data = await parseJson<UpdateSiteSettingResponse>(res)
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Unable to update setting")
  }
  return data
}

// Plan Features Mapping (stored client-side since backend plan table doesn't store features)

export interface AvailableFeature {
  id: string
  name: string
  description: string
}

export interface AvailableFeaturesResponse {
  success: boolean
  features?: AvailableFeature[]
  error?: string
}

export async function getAvailableFeatures() {
  const res = await fetch(`${API_BASE}/admin/available-features`, {
    method: "GET",
    headers: getHeaders(),
  })
  const data = await parseJson<AvailableFeaturesResponse>(res)
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Unable to fetch available features")
  }
  return data
}

const PLAN_FEATURES_KEY = "rudranex_plan_features"

export function getPlanFeaturesMap(): Record<string, string[]> {
  if (typeof window === "undefined") return {}
  try {
    const stored = localStorage.getItem(PLAN_FEATURES_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

export function setPlanFeatures(planId: string, features: string[]) {
  if (typeof window === "undefined") return
  const map = getPlanFeaturesMap()
  map[planId] = features
  localStorage.setItem(PLAN_FEATURES_KEY, JSON.stringify(map))
}

export function getPlanFeatures(planId: string): string[] {
  return getPlanFeaturesMap()[planId] || []
}

export function getFeatureIdForEngine(engineName: string): string {
  const map: Record<string, string> = {
    "Student Mode": "student_mode",
    "Interview Prep": "interview_prep",
    "Mock Paper Generator": "mock_paper_generator",
    "Persona Mode": "persona_mode",
    "AI Image Lab": "ai_image_lab",
    "Battle Arena": "battle_arena",
  }
  return map[engineName] || ""
}

// Strike-off price storage (client-side)

export interface PlanStrikeOff {
  price_inr: number  // the displayed (new) price
}

const PLAN_STRIKE_KEY = "rudranex_plan_strike"

export function getPlanStrikeOff(planId: string): PlanStrikeOff | null {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem(PLAN_STRIKE_KEY)
    const map: Record<string, PlanStrikeOff> = stored ? JSON.parse(stored) : {}
    return map[planId] || null
  } catch {
    return null
  }
}

export function setPlanStrikeOff(planId: string, data: PlanStrikeOff | null) {
  if (typeof window === "undefined") return
  try {
    const stored = localStorage.getItem(PLAN_STRIKE_KEY)
    const map: Record<string, PlanStrikeOff> = stored ? JSON.parse(stored) : {}
    if (data) {
      map[planId] = data
    } else {
      delete map[planId]
    }
    localStorage.setItem(PLAN_STRIKE_KEY, JSON.stringify(map))
  } catch {}
}

// Web Speech API fallback for transcription
export function transcribeSpeechFallback(language: string = 'hi-IN'): Promise<TranscriptionResponse> {
  return new Promise((resolve, reject) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      reject(new Error("Web Speech API not supported in this browser"))
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = language
    recognition.continuous = true
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    let finalTranscript = ''
    let timeout: number

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' '
        }
      }
    }

    recognition.onerror = (event: any) => {
      clearTimeout(timeout)
      recognition.stop()
      if (finalTranscript.trim()) {
        resolve({ success: true, text: finalTranscript.trim() })
      } else {
        reject(new Error(`Speech recognition error: ${event.error}`))
      }
    }

    recognition.onend = () => {
      clearTimeout(timeout)
      resolve({ success: true, text: finalTranscript.trim() || "No speech detected" })
    }

    // Start recognition and auto-stop after 10 seconds
    recognition.start()
    timeout = setTimeout(() => {
      recognition.stop()
    }, 10000) as unknown as number

    // Store recognition instance so it can be stopped externally
    (window as any).__speechRecognitionInstance = recognition
  })
}

// Stop any ongoing Web Speech API recognition
export function stopSpeechRecognition() {
  const recognition = (window as any).__speechRecognitionInstance
  if (recognition) {
    recognition.stop()
    delete (window as any).__speechRecognitionInstance
  }
}
